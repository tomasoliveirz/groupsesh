from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify, current_app, g
from flask_login import current_user, login_user, logout_user, login_required
from werkzeug.security import generate_password_hash, check_password_hash
from database import db
from database.models import User
from flask_babel import _
import logging
import requests
import json
from auth.oauth import google_client, google_enabled, get_google_provider_cfg

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    """
    Rota para registro de novos usuários.
    - GET: retorna o formulário de registro (HTML).
    - POST: 
        - Se for AJAX (JSON), faz a validação e retorna JSON.
        - Se for formulário comum, faz a validação e retorna HTML.
    """
    # Se o usuário já estiver logado, não faz sentido registrar de novo
    if current_user.is_authenticated:
        return redirect(url_for('index', lang_code=g.lang_code))
    
    if request.method == 'GET':
        # Retorna a página HTML normal
        return render_template('auth/register.html')
    
    # Se for POST, vamos verificar se é JSON (chamada AJAX) ou formulário HTML
    if request.is_json:
        # --------------------- FLUXO AJAX (JSON) ---------------------
        data = request.get_json() or {}
        name = data.get('name', '').strip()
        email = data.get('email', '').lower().strip()
        password = data.get('password', '')
        confirm_password = data.get('confirm_password', '')

        # Validar campos
        if not name or not email or not password:
            return jsonify({'error': _('Por favor, preencha todos os campos.')}), 400
        
        if password != confirm_password:
            return jsonify({'error': _('As senhas não coincidem.')}), 400
        
        if len(password) < 6:
            return jsonify({'error': _('A senha deve ter pelo menos 6 caracteres.')}), 400
        
        # Verificar se email já existe
        existing_user = User.get_by_email(email)
        if existing_user:
            return jsonify({'error': _('Este email já está registrado.')}), 400
        
        # Criar usuário
        new_user = User(name=name, email=email)
        new_user.set_password(password)
        new_user.is_verified = False
        new_user.generate_verification_token()  # se quiser email de verificação
        
        try:
            db.session.add(new_user)
            db.session.commit()
            # Envio de email de verificação seria aqui, se necessário
            
            return jsonify({'message': _('Registro realizado com sucesso! Verifique seu email.')}), 200
        
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Erro ao registrar usuário: {str(e)}", exc_info=True)
            return jsonify({'error': _('Ocorreu um erro ao criar sua conta. Tente novamente mais tarde.')}), 500
    
    else:
        # --------------------- FLUXO FORM HTML ---------------------
        name = request.form.get('name', '').strip()
        email = request.form.get('email', '').lower().strip()
        password = request.form.get('password', '')
        confirm_password = request.form.get('confirm_password', '')
        
        # Validações iguais, mas usando flash + render_template
        if not name or not email or not password:
            flash(_('Por favor, preencha todos os campos.'), 'danger')
            return render_template('auth/register.html')
        
        if password != confirm_password:
            flash(_('As senhas não coincidem.'), 'danger')
            return render_template('auth/register.html')
        
        if len(password) < 6:
            flash(_('A senha deve ter pelo menos 6 caracteres.'), 'danger')
            return render_template('auth/register.html')
        
        if User.get_by_email(email):
            flash(_('Este email já está registrado.'), 'danger')
            return render_template('auth/register.html')
        
        new_user = User(name=name, email=email)
        new_user.set_password(password)
        new_user.is_verified = False
        new_user.generate_verification_token()
        
        try:
            db.session.add(new_user)
            db.session.commit()
            flash(_('Registro realizado com sucesso! Por favor, verifique seu email.'), 'success')
            return redirect(url_for('auth.login'))
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Erro ao registrar usuário: {str(e)}", exc_info=True)
            flash(_('Ocorreu um erro ao criar sua conta. Tente novamente mais tarde.'), 'danger')
            return render_template('auth/register.html')


@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    """
    Rota para login de usuários.
    Exibe o formulário de login (GET) e faz a validação (POST).
    """
    if current_user.is_authenticated:
        return redirect(url_for('index', lang_code=g.lang_code))
    
    if request.method == 'POST':
        # Verificamos se é uma requisição AJAX ou formulário tradicional
        if request.is_json:
            # ----- FLUXO AJAX -----
            data = request.get_json() or {}
            email = data.get('email', '').lower().strip()
            password = data.get('password', '')
            remember = data.get('remember', False)
            
            # Validação básica
            if not email or not password:
                return jsonify({'error': _('Por favor, preencha todos os campos.')}), 400
            
            user = User.get_by_email(email)
            
            # Verificação do usuário e senha
            if not user or not user.check_password(password):
                return jsonify({'error': _('Email ou senha incorretos.')}), 401
                
            if not user.is_verified:
                return jsonify({'error': _('Conta não verificada. Por favor, verifique seu email.')}), 401
                
            # Login bem-sucedido
            login_user(user, remember=remember)
            
            # Retornar dados do usuário
            return jsonify({
                'message': _('Login realizado com sucesso.'),
                'user': user.to_dict()
            }), 200
            
        else:
            # ----- FLUXO FORMULÁRIO HTML -----
            email = request.form.get('email', '').lower().strip()
            password = request.form.get('password', '')
            remember = 'remember' in request.form  # checkbox "Lembrar de mim"
            
            # Validação básica
            if not email or not password:
                flash(_('Por favor, preencha todos os campos.'), 'danger')
                return render_template('auth/login.html')
            
            user = User.get_by_email(email)
            
            # Verificar existência do usuário e a senha
            if user and user.check_password(password):
                if not user.is_verified:
                    flash(_('Por favor, verifique seu email para ativar sua conta.'), 'warning')
                    return render_template('auth/login.html')
                
                login_user(user, remember=remember)
                
                next_page = request.args.get('next')
                if next_page:
                    return redirect(next_page)
                return redirect(url_for('index', lang_code=g.lang_code))
            else:
                flash(_('Email ou senha incorretos.'), 'danger')
                return render_template('auth/login.html')
    
    # Se for GET, exibe o formulário
    return render_template('auth/login.html')


@auth_bp.route('/logout')
def logout():
    """Rota para logout de usuários."""
    logout_user()
    flash(_('Você saiu da sua conta.'), 'info')
    return redirect(url_for('index', lang_code=g.lang_code))


@auth_bp.route('/verify/<token>')
def verify_email(token):
    """Verifica o email do usuário usando o token enviado."""
    if not token:
        flash(_('Token de verificação inválido.'), 'danger')
        return redirect(url_for('index', lang_code=g.lang_code))
    
    # Buscar usuário pelo token de verificação
    user = User.query.filter_by(verification_token=token).first()
    
    if not user:
        flash(_('Token de verificação inválido ou expirado.'), 'danger')
        return redirect(url_for('auth.login'))
    
    # Verificar se o token ainda é válido (não expirou)
    if user.verify_account(token):
        db.session.commit()
        flash(_('Sua conta foi verificada com sucesso! Agora você pode fazer login.'), 'success')
    else:
        flash(_('Token de verificação expirado. Solicite um novo.'), 'warning')
    
    return redirect(url_for('auth.login'))


@auth_bp.route('/reset-password', methods=['GET', 'POST'])
def reset_password_request():
    """Solicita redefinição de senha."""
    if current_user.is_authenticated:
        return redirect(url_for('index', lang_code=g.lang_code))
    
    if request.method == 'POST':
        email = request.form.get('email', '').lower().strip()
        
        if not email:
            flash(_('Por favor, insira seu email.'), 'danger')
            return render_template('auth/reset_password_request.html')
        
        user = User.get_by_email(email)
        
        if user:
            token = user.generate_reset_token()
            db.session.commit()
            
            # TODO: Enviar email com o link para redefinir senha
            # send_password_reset_email(user, token)
            
            # Log para debug (remover em produção)
            reset_url = url_for('auth.reset_password', token=token, _external=True)
            current_app.logger.info(f"Reset URL for {email}: {reset_url}")
        
        # Sempre mostrar a mesma mensagem (segurança)
        flash(_('Se o email existir no sistema, você receberá instruções para redefinir sua senha.'), 'info')
        return redirect(url_for('auth.login'))
    
    return render_template('auth/reset_password_request.html')


@auth_bp.route('/reset-password/<token>', methods=['GET', 'POST'])
def reset_password(token):
    """Redefine a senha usando o token."""
    if current_user.is_authenticated:
        return redirect(url_for('index', lang_code=g.lang_code))
    
    # Buscar usuário pelo token
    user = User.query.filter_by(reset_password_token=token).first()
    
    if not user:
        flash(_('Link de redefinição de senha inválido ou expirado.'), 'danger')
        return redirect(url_for('auth.login'))
    
    if request.method == 'POST':
        password = request.form.get('password', '')
        confirm_password = request.form.get('confirm_password', '')
        
        if not password or password != confirm_password:
            flash(_('As senhas não coincidem.'), 'danger')
            return render_template('auth/reset_password.html', token=token)
        
        if len(password) < 6:
            flash(_('A senha deve ter pelo menos 6 caracteres.'), 'danger')
            return render_template('auth/reset_password.html', token=token)
        
        # Tentar redefinir a senha
        if user.reset_password(token, password):
            db.session.commit()
            flash(_('Sua senha foi redefinida com sucesso. Agora você pode fazer login.'), 'success')
            return redirect(url_for('auth.login'))
        else:
            flash(_('Link de redefinição de senha expirado.'), 'danger')
            return redirect(url_for('auth.reset_password_request'))
    
    return render_template('auth/reset_password.html', token=token)


@auth_bp.route('/google-login')
def google_login():
    """Inicia o fluxo de login com Google OAuth."""
    # Verificar se o Google OAuth está configurado
    if not google_enabled:
        flash(_('Login com Google não está disponível no momento.'), 'warning')
        return redirect(url_for('auth.login'))
    
    # Obter informações do provedor Google
    google_provider_cfg = get_google_provider_cfg()
    if not google_provider_cfg:
        flash(_('Erro ao conectar com Google. Por favor, tente novamente.'), 'danger')
        return redirect(url_for('auth.login'))
    
    # Construir URL de autorização
    try:
        authorization_endpoint = google_provider_cfg["authorization_endpoint"]
        
        # URL de callback (onde o usuário será redirecionado após autenticação)
        redirect_uri = url_for('auth.google_callback', _external=True)
        
        # Preparar URL de solicitação com escopos necessários
        request_uri = google_client.prepare_request_uri(
            authorization_endpoint,
            redirect_uri=redirect_uri,
            scope=["openid", "email", "profile"],
        )
        
        # Redirecionar para a página de autenticação do Google
        return redirect(request_uri)
    except Exception as e:
        current_app.logger.error(f"Erro no login com Google: {str(e)}", exc_info=True)
        flash(_('Falha ao iniciar autenticação com Google.'), 'danger')
        return redirect(url_for('auth.login'))


@auth_bp.route('/google-callback')
def google_callback():
    """Processa o retorno da autenticação do Google."""
    # Verificar se o Google OAuth está configurado
    if not google_enabled:
        flash(_('Login com Google não está disponível no momento.'), 'warning')
        return redirect(url_for('auth.login'))
    
    # Verificar se recebemos um código de autorização
    code = request.args.get("code")
    if not code:
        flash(_('Falha na autenticação com Google.'), 'danger')
        return redirect(url_for('auth.login'))
    
    try:
        # Obter configuração do provedor
        google_provider_cfg = get_google_provider_cfg()
        if not google_provider_cfg:
            raise Exception("Não foi possível obter configuração do Google")
        
        # Trocar código de autorização por token de acesso
        token_endpoint = google_provider_cfg["token_endpoint"]
        token_url, headers, body = google_client.prepare_token_request(
            token_endpoint,
            authorization_response=request.url,
            redirect_url=url_for('auth.google_callback', _external=True),
            code=code
        )
        
        # Fazer requisição para obter token
        token_response = requests.post(
            token_url,
            headers=headers,
            data=body,
            auth=(current_app.config["GOOGLE_CLIENT_ID"], current_app.config["GOOGLE_CLIENT_SECRET"]),
        )
        
        # Analisar resposta do token
        google_client.parse_request_body_response(json.dumps(token_response.json()))
        
        # Obter informações do usuário
        userinfo_endpoint = google_provider_cfg["userinfo_endpoint"]
        uri, headers, body = google_client.add_token(userinfo_endpoint)
        userinfo_response = requests.get(uri, headers=headers, data=body)
        
        # Verificar se o email foi validado pelo Google
        if userinfo_response.json().get("email_verified"):
            # Obter dados do usuário
            google_id = userinfo_response.json()["sub"]
            email = userinfo_response.json()["email"]
            name = userinfo_response.json().get("name", email.split('@')[0])
            picture = userinfo_response.json().get("picture")
        else:
            flash(_('Email não verificado pelo Google.'), 'danger')
            return redirect(url_for('auth.login'))
        
        # Verificar se usuário já existe pelo Google ID
        user = User.get_by_google_id(google_id)
        
        if not user:
            # Verificar se existe usuário com o mesmo email
            user = User.get_by_email(email)
            
            if user:
                # Associar Google ID ao usuário existente
                user.google_id = google_id
                user.profile_picture = picture
            else:
                # Criar novo usuário
                user = User(
                    email=email,
                    name=name,
                    google_id=google_id,
                    profile_picture=picture,
                    is_verified=True  # Usuários do Google já são verificados
                )
            
            # Salvar alterações
            db.session.add(user)
            db.session.commit()
        
        # Fazer login do usuário
        login_user(user, remember=True)
        
        # Redirecionar para página principal
        return redirect(url_for('index', lang_code=g.lang_code))
    
    except Exception as e:
        current_app.logger.error(f"Erro no callback do Google: {str(e)}", exc_info=True)
        flash(_('Erro durante autenticação com Google.'), 'danger')
        return redirect(url_for('auth.login'))


@auth_bp.route('/resend-verification', methods=['POST'])
def resend_verification():
    """Reenvia o email de verificação."""
    email = request.form.get('email') or request.json.get('email')
    
    if not email:
        if request.is_json:
            return jsonify({'error': _('Email não fornecido.')}), 400
        flash(_('Por favor, informe seu email.'), 'danger')
        return redirect(url_for('auth.login'))
    
    user = User.get_by_email(email)
    
    if not user:
        # Segurança: não revelar se o email existe
        if request.is_json:
            return jsonify({'message': _('Se o email existir, um novo link de verificação foi enviado.')}), 200
        flash(_('Se o email existir, um novo link de verificação foi enviado.'), 'info')
        return redirect(url_for('auth.login'))
    
    if user.is_verified:
        if request.is_json:
            return jsonify({'error': _('Sua conta já está verificada.')}), 400
        flash(_('Sua conta já está verificada.'), 'info')
        return redirect(url_for('auth.login'))
    
    # Gerar novo token
    token = user.generate_verification_token()
    db.session.commit()
    
    # TODO: Enviar email com o link de verificação
    # send_verification_email(user, token)
    
    # Log para debug (remover em produção)
    verification_url = url_for('auth.verify_email', token=token, _external=True)
    current_app.logger.info(f"Verification URL for {email}: {verification_url}")
    
    if request.is_json:
        return jsonify({'message': _('Um novo link de verificação foi enviado para seu email.')}), 200
    
    flash(_('Um novo link de verificação foi enviado para seu email.'), 'info')
    return redirect(url_for('auth.login'))
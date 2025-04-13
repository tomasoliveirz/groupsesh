"""
Routes for user authentication (auth_bp).
Includes login, register, password reset, and OAuth flows.
"""

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

# Create auth blueprint
auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/<lang_code>/auth/register', methods=['GET', 'POST'])
def register():
    """
    Registration route.
    - GET: returns the registration form (HTML).
    - POST: 
        - If AJAX (JSON), validates and returns JSON.
        - If regular form, validates and returns HTML.
    """
    # If user is already logged in, no need to register again
    if current_user.is_authenticated:
        return redirect(url_for('index', lang_code=g.lang_code))
    
    if request.method == 'GET':
        # Return normal HTML page
        return render_template('auth/register.html')
    
    # If POST, check if JSON (AJAX call) or HTML form
    if request.is_json:
        # --------------------- AJAX (JSON) FLOW ---------------------
        data = request.get_json() or {}
        name = data.get('name', '').strip()
        email = data.get('email', '').lower().strip()
        password = data.get('password', '')
        confirm_password = data.get('confirm_password', '')

        # Validate fields
        if not name or not email or not password:
            return jsonify({'error': _('Por favor, preencha todos os campos.')}), 400
        
        if password != confirm_password:
            return jsonify({'error': _('As senhas não coincidem.')}), 400
        
        if len(password) < 6:
            return jsonify({'error': _('A senha deve ter pelo menos 6 caracteres.')}), 400
        
        # Check if email already exists
        existing_user = User.get_by_email(email)
        if existing_user:
            return jsonify({'error': _('Este email já está registrado.')}), 400
        
        # Create user
        new_user = User(name=name, email=email)
        new_user.set_password(password)
        new_user.is_verified = False
        new_user.generate_verification_token()  # for email verification
        
        try:
            db.session.add(new_user)
            db.session.commit()
            # Verification email would be sent here if needed
            
            return jsonify({'message': _('Registro realizado com sucesso! Verifique seu email.')}), 200
        
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Erro ao registrar usuário: {str(e)}", exc_info=True)
            return jsonify({'error': _('Ocorreu um erro ao criar sua conta. Tente novamente mais tarde.')}), 500
    
    else:
        # --------------------- HTML FORM FLOW ---------------------
        name = request.form.get('name', '').strip()
        email = request.form.get('email', '').lower().strip()
        password = request.form.get('password', '')
        confirm_password = request.form.get('confirm_password', '')
        
        # Same validations, but using flash + render_template
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
            return redirect(url_for('auth.login', lang_code=g.lang_code))
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Erro ao registrar usuário: {str(e)}", exc_info=True)
            flash(_('Ocorreu um erro ao criar sua conta. Tente novamente mais tarde.'), 'danger')
            return render_template('auth/register.html')


@auth_bp.route('/<lang_code>/auth/login', methods=['GET', 'POST'])
def login():
    """
    Login route.
    Displays the login form (GET) and validates (POST).
    """
    if current_user.is_authenticated:
        return redirect(url_for('index', lang_code=g.lang_code))
    
    if request.method == 'POST':
        # Check if AJAX request or traditional form
        if request.is_json:
            # ----- AJAX FLOW -----
            data = request.get_json() or {}
            email = data.get('email', '').lower().strip()
            password = data.get('password', '')
            remember = data.get('remember', False)
            
            # Basic validation
            if not email or not password:
                return jsonify({'error': _('Por favor, preencha todos os campos.')}), 400
            
            user = User.get_by_email(email)
            
            # User and password verification
            if not user or not user.check_password(password):
                return jsonify({'error': _('Email ou senha incorretos.')}), 401
                
            # [MODIFIED] Remove verification blocking, but keep warning
            if not user.is_verified:
                # Just log a warning about unverified email
                current_app.logger.info(f"Login with unverified email: {email}")
                
            # Successful login
            login_user(user, remember=remember)
            
            # Return user data
            return jsonify({
                'message': _('Login realizado com sucesso.'),
                'user': user.to_dict(),
                'verified': user.is_verified  # Send verification status
            }), 200
            
        else:
            # ----- HTML FORM FLOW -----
            email = request.form.get('email', '').lower().strip()
            password = request.form.get('password', '')
            remember = 'remember' in request.form  # "Remember me" checkbox
            
            # Basic validation
            if not email or not password:
                flash(_('Por favor, preencha todos os campos.'), 'danger')
                return render_template('auth/login.html')
            
            user = User.get_by_email(email)
            
            # Verify user exists and password is correct
            if user and user.check_password(password):
                # [MODIFIED] Remove verification blocking, but keep warning
                if not user.is_verified:
                    flash(_('Sua conta não está verificada. Algumas funcionalidades podem ser limitadas.'), 'warning')
                
                login_user(user, remember=remember)
                
                next_page = request.args.get('next')
                if next_page:
                    return redirect(next_page)
                return redirect(url_for('index', lang_code=g.lang_code))
            else:
                flash(_('Email ou senha incorretos.'), 'danger')
                return render_template('auth/login.html')
    
    # If GET, display the form
    return render_template('auth/login.html')


@auth_bp.route('/<lang_code>/auth/logout')
def logout():
    """User logout route."""
    logout_user()
    flash(_('Você saiu da sua conta.'), 'info')
    return redirect(url_for('index', lang_code=g.lang_code))


@auth_bp.route('/<lang_code>/auth/verify/<token>')
def verify_email(token):
    """Verifies the user's email using the sent token."""
    if not token:
        flash(_('Token de verificação inválido.'), 'danger')
        return redirect(url_for('index', lang_code=g.lang_code))
    
    # Find user by verification token
    user = User.query.filter_by(verification_token=token).first()
    
    if not user:
        flash(_('Token de verificação inválido ou expirado.'), 'danger')
        return redirect(url_for('auth.login', lang_code=g.lang_code))
    
    # Check if token is still valid (not expired)
    if user.verify_account(token):
        db.session.commit()
        flash(_('Sua conta foi verificada com sucesso! Agora você pode fazer login.'), 'success')
    else:
        flash(_('Token de verificação expirado. Solicite um novo.'), 'warning')
    
    return redirect(url_for('auth.login', lang_code=g.lang_code))


@auth_bp.route('/<lang_code>/auth/reset-password', methods=['GET', 'POST'])
def reset_password_request():
    """Password reset request."""
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
            
            # TODO: Send email with reset link
            # send_password_reset_email(user, token)
            
            # Debug log (remove in production)
            reset_url = url_for('auth.reset_password', token=token, lang_code=g.lang_code, _external=True)
            current_app.logger.info(f"Reset URL for {email}: {reset_url}")
        
        # Always show the same message (security)
        flash(_('Se o email existir no sistema, você receberá instruções para redefinir sua senha.'), 'info')
        return redirect(url_for('auth.login', lang_code=g.lang_code))
    
    return render_template('auth/reset_password_request.html')


@auth_bp.route('/<lang_code>/auth/reset-password/<token>', methods=['GET', 'POST'])
def reset_password(token):
    """Reset password using token."""
    if current_user.is_authenticated:
        return redirect(url_for('index', lang_code=g.lang_code))
    
    # Find user by reset token
    user = User.query.filter_by(reset_password_token=token).first()
    
    if not user:
        flash(_('Link de redefinição de senha inválido ou expirado.'), 'danger')
        return redirect(url_for('auth.login', lang_code=g.lang_code))
    
    if request.method == 'POST':
        password = request.form.get('password', '')
        confirm_password = request.form.get('confirm_password', '')
        
        if not password or password != confirm_password:
            flash(_('As senhas não coincidem.'), 'danger')
            return render_template('auth/reset_password.html', token=token)
        
        if len(password) < 6:
            flash(_('A senha deve ter pelo menos 6 caracteres.'), 'danger')
            return render_template('auth/reset_password.html', token=token)
        
        # Try to reset password
        if user.reset_password(token, password):
            db.session.commit()
            flash(_('Sua senha foi redefinida com sucesso. Agora você pode fazer login.'), 'success')
            return redirect(url_for('auth.login', lang_code=g.lang_code))
        else:
            flash(_('Link de redefinição de senha expirado.'), 'danger')
            return redirect(url_for('auth.reset_password_request', lang_code=g.lang_code))
    
    return render_template('auth/reset_password.html', token=token)


@auth_bp.route('/<lang_code>/auth/google-login')
def google_login():
    """Initiates Google OAuth flow."""
    # Check if Google OAuth is configured
    if not google_enabled:
        flash(_('Login com Google não está disponível no momento.'), 'warning')
        return redirect(url_for('auth.login', lang_code=g.lang_code))
    
    # Get Google provider information
    google_provider_cfg = get_google_provider_cfg()
    if not google_provider_cfg:
        flash(_('Erro ao conectar com Google. Por favor, tente novamente.'), 'danger')
        return redirect(url_for('auth.login', lang_code=g.lang_code))
    
    # Build authorization URL
    try:
        authorization_endpoint = google_provider_cfg["authorization_endpoint"]
        
        # Callback URL (where user will be redirected after authentication)
        redirect_uri = url_for('auth.google_callback', lang_code=g.lang_code, _external=True)
        
        # Prepare request URL with necessary scopes
        request_uri = google_client.prepare_request_uri(
            authorization_endpoint,
            redirect_uri=redirect_uri,
            scope=["openid", "email", "profile"],
        )
        
        # Redirect to Google authentication page
        return redirect(request_uri)
    except Exception as e:
        current_app.logger.error(f"Erro no login com Google: {str(e)}", exc_info=True)
        flash(_('Falha ao iniciar autenticação com Google.'), 'danger')
        return redirect(url_for('auth.login', lang_code=g.lang_code))


@auth_bp.route('/<lang_code>/auth/google-callback')
def google_callback():
    """Handles Google authentication callback."""
    # Check if Google OAuth is configured
    if not google_enabled:
        flash(_('Login com Google não está disponível no momento.'), 'warning')
        return redirect(url_for('auth.login', lang_code=g.lang_code))
    
    # Check if we received an authorization code
    code = request.args.get("code")
    if not code:
        flash(_('Falha na autenticação com Google.'), 'danger')
        return redirect(url_for('auth.login', lang_code=g.lang_code))
    
    try:
        # Get provider configuration
        google_provider_cfg = get_google_provider_cfg()
        if not google_provider_cfg:
            raise Exception("Não foi possível obter configuração do Google")
        
        # Exchange authorization code for access token
        token_endpoint = google_provider_cfg["token_endpoint"]
        token_url, headers, body = google_client.prepare_token_request(
            token_endpoint,
            authorization_response=request.url,
            redirect_url=url_for('auth.google_callback', lang_code=g.lang_code, _external=True),
            code=code
        )
        
        # Make request to get token
        token_response = requests.post(
            token_url,
            headers=headers,
            data=body,
            auth=(current_app.config["GOOGLE_CLIENT_ID"], current_app.config["GOOGLE_CLIENT_SECRET"]),
        )
        
        # Parse token response
        google_client.parse_request_body_response(json.dumps(token_response.json()))
        
        # Get user information
        userinfo_endpoint = google_provider_cfg["userinfo_endpoint"]
        uri, headers, body = google_client.add_token(userinfo_endpoint)
        userinfo_response = requests.get(uri, headers=headers, data=body)
        
        # Verify email was validated by Google
        if userinfo_response.json().get("email_verified"):
            # Get user data
            google_id = userinfo_response.json()["sub"]
            email = userinfo_response.json()["email"]
            name = userinfo_response.json().get("name", email.split('@')[0])
            picture = userinfo_response.json().get("picture")
        else:
            flash(_('Email não verificado pelo Google.'), 'danger')
            return redirect(url_for('auth.login', lang_code=g.lang_code))
        
        # Check if user already exists by Google ID
        user = User.get_by_google_id(google_id)
        
        if not user:
            # Check if user exists with the same email
            user = User.get_by_email(email)
            
            if user:
                # Associate Google ID with existing user
                user.google_id = google_id
                user.profile_picture = picture
            else:
                # Create new user
                user = User(
                    email=email,
                    name=name,
                    google_id=google_id,
                    profile_picture=picture,
                    is_verified=True  # Google users are already verified
                )
            
            # Save changes
            db.session.add(user)
            db.session.commit()
        
        # Log user in
        login_user(user, remember=True)
        
        # Redirect to home page
        return redirect(url_for('index', lang_code=g.lang_code))
    
    except Exception as e:
        current_app.logger.error(f"Erro no callback do Google: {str(e)}", exc_info=True)
        flash(_('Erro durante autenticação com Google.'), 'danger')
        return redirect(url_for('auth.login', lang_code=g.lang_code))


@auth_bp.route('/<lang_code>/auth/resend-verification', methods=['POST'])
def resend_verification():
    """Resends verification email."""
    email = request.form.get('email') or request.json.get('email')
    
    if not email:
        if request.is_json:
            return jsonify({'error': _('Email não fornecido.')}), 400
        flash(_('Por favor, informe seu email.'), 'danger')
        return redirect(url_for('auth.login', lang_code=g.lang_code))
    
    user = User.get_by_email(email)
    
    if not user:
        # Security: don't reveal if email exists
        if request.is_json:
            return jsonify({'message': _('Se o email existir, um novo link de verificação foi enviado.')}), 200
        flash(_('Se o email existir, um novo link de verificação foi enviado.'), 'info')
        return redirect(url_for('auth.login', lang_code=g.lang_code))
    
    if user.is_verified:
        if request.is_json:
            return jsonify({'error': _('Sua conta já está verificada.')}), 400
        flash(_('Sua conta já está verificada.'), 'info')
        return redirect(url_for('auth.login', lang_code=g.lang_code))
    
    # Generate new token
    token = user.generate_verification_token()
    db.session.commit()
    
    # TODO: Send email with verification link
    # send_verification_email(user, token)
    
    # Debug log (remove in production)
    verification_url = url_for('auth.verify_email', token=token, lang_code=g.lang_code, _external=True)
    current_app.logger.info(f"Verification URL for {email}: {verification_url}")
    
    if request.is_json:
        return jsonify({'message': _('Um novo link de verificação foi enviado para seu email.')}), 200
    
    flash(_('Um novo link de verificação foi enviado para seu email.'), 'info')
    return redirect(url_for('auth.login', lang_code=g.lang_code))
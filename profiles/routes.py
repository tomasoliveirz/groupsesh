"""
Rotas para gerenciamento de perfis de usuário (profile_bp).
Inclui página de perfil, my-surveys, e manipulação de dados de conta.
"""

from flask import (
    Blueprint, render_template, request, redirect, url_for, flash,
    current_app, g, jsonify
)
from flask_login import login_required, current_user
from database import db
from database.models import User, Survey, Participant
from werkzeug.security import check_password_hash
from flask_babel import _

# Cria o blueprint do perfil
profile_bp = Blueprint('profile_bp', __name__)

@profile_bp.route('/<lang_code>/profile', methods=['GET', 'POST'])
@profile_bp.route('/<lang_code>/account', methods=['GET', 'POST'])
@login_required
def profile():
    """
    Página de perfil do usuário (GET) e update do perfil (POST).
    """
    if request.method == 'POST':
        form_type = request.form.get('form_type', 'profile')
        
        # 1) Atualizar dados básicos de perfil
        if form_type == 'profile':
            return handle_profile_update()
        
        # 2) Alterar senha existente
        elif form_type == 'password':
            return handle_password_change()
        
        # 3) Definir senha (para usuários Google sem senha local)
        elif form_type == 'set_password':
            return handle_set_password()
        
        # 4) Excluir conta
        elif form_type == 'delete_account':
            return handle_account_deletion()
    
    # Se for GET, apenas exibir a página
    # (Opcional) Exemplo de juntar surveys criadas e participadas:
    surveys = []
    if current_user.is_authenticated:
        # Surveys criadas (creator_id == current_user.id)
        surveys_created = Survey.query.filter_by(creator_id=current_user.id).all()
        
        # Surveys que o user participou (via Participants)
        participations = Participant.query.filter_by(user_id=current_user.id).all()
        surveys_participated = [p.survey for p in participations if p.survey not in surveys_created]
        
        surveys = surveys_created + surveys_participated
    
    return render_template('profile.html', surveys=surveys)


@profile_bp.route('/<lang_code>/my-surveys')
@login_required
def my_surveys():
    """
    Página de "Minhas Pesquisas".
    Exibe as pesquisas criadas pelo usuário e as que ele participou.
    """
    # Surveys criadas
    created_surveys = Survey.query.filter_by(creator_id=current_user.id).all()
    
    # Surveys que participou
    participations = Participant.query.filter_by(user_id=current_user.id).all()
    participated_surveys = [p.survey for p in participations if p.survey not in created_surveys]
    
    return render_template(
        'my_surveys.html',
        created_surveys=created_surveys,
        participated_surveys=participated_surveys
    )


@profile_bp.route('/auth/resend-verification', methods=['POST'])
@login_required
def resend_verification():
    """
    Rota para reenviar email de verificação de conta.
    Exemplo simples retornando JSON. Pode ser chamada via AJAX.
    """
    if current_user.is_verified:
        return jsonify({'error': _('Sua conta já está verificada.')}), 400
    
    # Gerar novo token de verificação
    current_user.generate_verification_token()
    
    try:
        db.session.commit()
        # Aqui poderia chamar a função que envia o email, ex:
        # send_verification_email(current_user)
        
        return jsonify({'message': _('Email de verificação reenviado com sucesso.')}), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Erro ao reenviar verificação: {str(e)}", exc_info=True)
        return jsonify({'error': _('Ocorreu um erro ao reenviar a verificação.')}), 500


# ------------------------------
# Funções auxiliares (POST)
# ------------------------------

def handle_profile_update():
    """Processa atualização de nome/email do perfil."""
    name = request.form.get('name', '').strip()
    email = request.form.get('email', '').strip().lower()
    
    if not name or not email:
        flash(_('Nome e email são obrigatórios'), 'danger')
        return redirect(url_for('profile_bp.profile', lang_code=g.lang_code))
    
    # Se email mudou:
    if email != current_user.email:
        # Se a conta for Google, não deixa mudar o email
        if current_user.google_id:
            flash(_('O email está vinculado à sua conta do Google e não pode ser alterado.'), 'danger')
            return redirect(url_for('profile_bp.profile', lang_code=g.lang_code))
        
        # Verificar se esse email já existe
        existing_user = User.get_by_email(email)
        if existing_user:
            flash(_('Este email já está sendo usado por outra conta.'), 'danger')
            return redirect(url_for('profile_bp.profile', lang_code=g.lang_code))
        
        # Se chegou aqui, pode atualizar o email
        current_user.email = email
        current_user.is_verified = False
        current_user.generate_verification_token()
        # TODO: Enviar email de verificação
    
    current_user.name = name
    
    try:
        db.session.commit()
        flash(_('Perfil atualizado com sucesso.'), 'success')
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Erro ao atualizar perfil: {str(e)}", exc_info=True)
        flash(_('Ocorreu um erro ao atualizar o perfil.'), 'danger')
    
    return redirect(url_for('profile_bp.profile', lang_code=g.lang_code))


def handle_password_change():
    """Processa alteração de senha existente."""
    current_password = request.form.get('current_password', '')
    new_password = request.form.get('new_password', '')
    confirm_password = request.form.get('confirm_password', '')
    
    if not current_password or not new_password or not confirm_password:
        flash(_('Todos os campos são obrigatórios.'), 'danger')
        return redirect(url_for('profile_bp.profile', lang_code=g.lang_code))
    
    if new_password != confirm_password:
        flash(_('As senhas não coincidem.'), 'danger')
        return redirect(url_for('profile_bp.profile', lang_code=g.lang_code))
    
    if len(new_password) < 6:
        flash(_('A senha deve ter pelo menos 6 caracteres.'), 'danger')
        return redirect(url_for('profile_bp.profile', lang_code=g.lang_code))
    
    # Verificar senha atual
    if not current_user.check_password(current_password):
        flash(_('Senha atual incorreta.'), 'danger')
        return redirect(url_for('profile_bp.profile', lang_code=g.lang_code))
    
    current_user.set_password(new_password)
    
    try:
        db.session.commit()
        flash(_('Senha alterada com sucesso.'), 'success')
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Erro ao alterar senha: {str(e)}", exc_info=True)
        flash(_('Ocorreu um erro ao alterar a senha.'), 'danger')
    
    return redirect(url_for('profile_bp.profile', lang_code=g.lang_code))


def handle_set_password():
    """Processa definição de senha (usuários que só têm Google e ainda não tem senha)."""
    new_password = request.form.get('new_password', '')
    confirm_password = request.form.get('confirm_password', '')
    
    if not new_password or not confirm_password:
        flash(_('Todos os campos são obrigatórios.'), 'danger')
        return redirect(url_for('profile_bp.profile', lang_code=g.lang_code))
    
    if new_password != confirm_password:
        flash(_('As senhas não coincidem.'), 'danger')
        return redirect(url_for('profile_bp.profile', lang_code=g.lang_code))
    
    if len(new_password) < 6:
        flash(_('A senha deve ter pelo menos 6 caracteres.'), 'danger')
        return redirect(url_for('profile_bp.profile', lang_code=g.lang_code))
    
    # Se o usuário já tem senha
    if current_user.password_hash:
        flash(_('Você já possui uma senha. Use a opção de alterar senha.'), 'danger')
        return redirect(url_for('profile_bp.profile', lang_code=g.lang_code))
    
    current_user.set_password(new_password)
    
    try:
        db.session.commit()
        flash(_('Senha definida com sucesso.'), 'success')
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Erro ao definir senha: {str(e)}", exc_info=True)
        flash(_('Ocorreu um erro ao definir a senha.'), 'danger')
    
    return redirect(url_for('profile_bp.profile', lang_code=g.lang_code))


def handle_account_deletion():
    """Processa exclusão de conta."""
    password = request.form.get('password', '')
    confirm_delete = (request.form.get('confirm_delete') == 'on')
    
    if not confirm_delete:
        flash(_('Você deve confirmar que entende as consequências da exclusão da conta.'), 'danger')
        return redirect(url_for('profile_bp.profile', lang_code=g.lang_code))
    
    if current_user.password_hash and not current_user.check_password(password):
        flash(_('Senha incorreta.'), 'danger')
        return redirect(url_for('profile_bp.profile', lang_code=g.lang_code))
    
    try:
        user_id = current_user.id
        user_email = current_user.email
        
        db.session.delete(current_user)
        db.session.commit()
        
        current_app.logger.info(f"Conta excluída: ID {user_id}, Email {user_email}")
        
        flash(_('Sua conta foi excluída permanentemente.'), 'info')
        # Redirecionar para a Home
        return redirect(url_for('index', lang_code=g.lang_code))
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Erro ao excluir conta: {str(e)}", exc_info=True)
        flash(_('Ocorreu um erro ao excluir a conta.'), 'danger')
    
    return redirect(url_for('profile_bp.profile', lang_code=g.lang_code))

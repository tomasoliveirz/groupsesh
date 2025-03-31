import os
import json
import base64
import logging
from datetime import datetime, timedelta

from flask import (
    Flask, request, jsonify, render_template, redirect,
    url_for, flash, abort, session, g
)
from flask_wtf.csrf import CSRFProtect
from flask_cors import CORS
from flask_babel import lazy_gettext as _l
from flask_login import current_user, login_required
from werkzeug.security import generate_password_hash, check_password_hash

# Importar traduções e configuração
from translations.config import init_babel, LANGUAGES, DEFAULT_LANGUAGE, _, _l
from config import selected_config as Config

# 1) Importar blueprint do perfil (profile_bp) do seu pacote 'profiles'
#    Assegure-se de que em 'profiles/__init__.py' você exporta o profile_bp:
#    from .routes import profile_bp
from profiles import profile_bp

basedir = os.path.abspath(os.path.dirname(__file__))
instance_path = os.path.join(basedir, 'instance')

app = Flask(
    __name__,
    instance_path=instance_path,
    instance_relative_config=True
)

# 2) Registrar o blueprint APENAS UMA VEZ, aqui:
app.register_blueprint(profile_bp)

# Aplicar configurações
app.config.from_object(Config)

# Configurar logging
logging.basicConfig(
    level=logging.DEBUG if app.config.get('DEBUG', False) else logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Garantir diretório de instância
try:
    if not os.path.exists(app.instance_path):
        os.makedirs(app.instance_path, exist_ok=True)
        os.chmod(app.instance_path, 0o777)
    logger.info(f"Instance path: {app.instance_path}")
except OSError as e:
    logger.error(f"Error setting up instance directory: {e}")

# Segurança
csrf = CSRFProtect(app)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Internacionalização
babel = init_babel(app)

# Inicializar DB e modelos
from database import db, init_app
from database.models import Survey, Participant, Availability, User
init_app(app)

# Inicializar autenticação (Blueprint de auth, por exemplo)
from auth import init_app as init_auth
init_auth(app)

# Middlewares para processar código de idioma na URL
@app.url_value_preprocessor
def pull_lang_code(endpoint, values):
    if values is not None:
        g.lang_code = values.pop('lang_code', DEFAULT_LANGUAGE)
        session['language'] = g.lang_code

@app.url_defaults
def set_language_code(endpoint, values):
    if 'lang_code' in values or not g.get('lang_code', None):
        return
    try:
        if app.url_map.is_endpoint_expecting(endpoint, 'lang_code'):
            values['lang_code'] = g.lang_code
    except KeyError:
        pass

# Redirecionar para URL com linguagem
@app.route('/')
def home():
    lang_code = request.accept_languages.best_match(LANGUAGES.keys()) or DEFAULT_LANGUAGE
    session['language'] = lang_code
    return redirect(url_for('index', lang_code=lang_code))

@app.route('/<lang_code>/')
def index():
    """Página inicial"""
    return render_template('index.html')

@app.route('/<lang_code>/survey/<token>')
def join_survey_page(token):
    """Página para participar de uma survey"""
    survey = Survey.get_by_token(token)
    if not survey:
        flash(_('Survey não encontrada'), 'error')
        return redirect(url_for('index', lang_code=g.lang_code))
    
    if survey.is_expired:
        flash(_('Esta survey está expirada e não aceita mais respostas'), 'warning')
    
    return render_template('join_survey.html', survey=survey)

@app.route('/<lang_code>/dashboard/<token>')
def dashboard_page(token):
    """Página de Dashboard para administrador"""
    survey = Survey.get_by_token(token)
    if not survey:
        flash(_('Survey não encontrada'), 'error')
        return redirect(url_for('index', lang_code=g.lang_code))
    
    is_owner = False
    if current_user.is_authenticated:
        is_owner = (survey.creator_id == current_user.id or
                    survey.admin_email.lower() == current_user.email.lower())
    
    if not is_owner and not session.get(f'admin_verified_{token}', False):
        return redirect(url_for('verify_admin_page', token=token, lang_code=g.lang_code))
    
    is_expired = survey.is_expired
    language_code = g.lang_code
    
    return render_template('dashboard.html',
                           survey=survey,
                           is_expired=is_expired,
                           is_owner=is_owner,
                           language_code=language_code)

@app.route('/<lang_code>/about')
def about_page():
    """Página 'sobre'"""
    return render_template('about.html')

@app.context_processor
def utility_processor():
    def get_current_year():
        return datetime.now().year
    
    # Verificar se Google OAuth está habilitado
    from auth.oauth import google_enabled
    
    return dict(
        current_year=get_current_year,
        google_oauth_enabled=google_enabled,
        languages=LANGUAGES
    )

@app.route('/<lang_code>/create-survey')
@login_required
def create_survey_page():
    """Página de criação de survey"""
    return render_template('create_survey.html')

@app.route('/api/create-survey', methods=['POST'])
@login_required
def create_survey():
    """Cria uma nova Survey"""
    data = request.json
    if not data.get('title'):
        return jsonify({'error': _('O título da pesquisa é obrigatório')}), 400
    
    admin_email = current_user.email.lower().strip()
    admin_name = data.get('admin_name', '').strip() or current_user.name
    expires_at = datetime.utcnow() + timedelta(days=app.config['SURVEY_LINK_EXPIRY'])
    
    try:
        survey = Survey(
            title=data['title'],
            description=data.get('description', ''),
            admin_email=admin_email,
            admin_name=admin_name,
            expires_at=expires_at,
            creator_id=current_user.id
        )
        db.session.add(survey)
        db.session.commit()
        
        lang_code = g.get('lang_code', DEFAULT_LANGUAGE)
        
        return jsonify({
            'message': _('Survey criada com sucesso'),
            'survey': survey.to_dict(),
            'admin_url': url_for('dashboard_page', token=survey.token, lang_code=lang_code, _external=True),
            'participant_url': url_for('join_survey_page', token=survey.token, lang_code=lang_code, _external=True)
        }), 201
    
    except Exception as e:
        db.session.rollback()
        logger.error(f"Erro ao criar survey: {str(e)}", exc_info=True)
        return jsonify({'error': _('Erro ao criar survey')}), 500

@app.route('/api/join-survey/<token>', methods=['POST'])
def join_survey(token):
    """Registra/atualiza disponibilidade do participante."""
    survey = Survey.get_by_token(token)
    if not survey:
        return jsonify({'error': _('Survey não encontrada')}), 404
    
    if survey.is_expired:
        return jsonify({'error': _('Survey expirada')}), 400
    
    data = request.json
    required_fields = ['name', 'email', 'availability_dates']
    for field in required_fields:
        if field not in data or not data[field]:
            return jsonify({'error': _('Campo obrigatório ausente: {}').format(field)}), 400
    
    email = data['email'].lower().strip()
    is_admin = (email == survey.admin_email.lower())
    user_id = current_user.id if current_user.is_authenticated else None
    
    from database.models import Participant, Availability
    existing_participant = Participant.get_by_survey_and_email(survey.id, email)
    
    try:
        if existing_participant:
            existing_participant.name = data['name']
            existing_participant.user_id = user_id
            Availability.query.filter_by(participant_id=existing_participant.id).delete()
            participant = existing_participant
            is_update = True
        else:
            participant = Participant(
                survey_id=survey.id,
                name=data['name'],
                email=email,
                is_admin=is_admin,
                user_id=user_id
            )
            db.session.add(participant)
            db.session.flush()
            is_update = False
        
        for date_str in data['availability_dates']:
            try:
                date_obj = datetime.fromisoformat(date_str).date()
                availability = Availability(
                    participant_id=participant.id,
                    available_date=date_obj
                )
                db.session.add(availability)
            except ValueError:
                pass
        
        db.session.commit()
        logger.info(f"Participante {participant.id} ({participant.email}) registrou {len(data['availability_dates'])} disponibilidades")
        
        return jsonify({
            'message': _('Disponibilidade atualizada com sucesso') if is_update else _('Disponibilidade registrada com sucesso'),
            'participant': participant.to_dict(),
            'is_admin': is_admin,
            'is_update': is_update
        }), 200
    
    except Exception as e:
        db.session.rollback()
        logger.error(f"Erro ao registrar disponibilidade: {str(e)}", exc_info=True)
        return jsonify({'error': _('Erro ao registrar disponibilidade')}), 500

@app.route('/api/survey-info/<token>', methods=['GET'])
def get_survey_info(token):
    survey = Survey.get_by_token(token)
    if not survey:
        return jsonify({'error': _('Survey não encontrada')}), 404
    return jsonify({
        'id': survey.id,
        'token': survey.token,
        'title': survey.title,
        'description': survey.description,
        'admin_name': survey.admin_name,
        'admin_email': survey.admin_email,
        'created_at': survey.created_at.isoformat(),
        'expires_at': survey.expires_at.isoformat(),
        'is_expired': survey.is_expired
    }), 200

@app.route('/api/participant-response/<token>', methods=['GET'])
def get_participant_response(token):
    survey = Survey.get_by_token(token)
    if not survey:
        return jsonify({'error': _('Survey não encontrada')}), 404
    
    email = request.args.get('email', '').lower()
    if not email:
        return jsonify({'error': _('Email não fornecido')}), 400
    
    from database.models import Participant
    participant = Participant.get_by_survey_and_email(survey.id, email)
    if not participant:
        return jsonify({'participant': None}), 200
    
    is_admin = (email == survey.admin_email.lower())
    return jsonify({'participant': participant.to_dict(), 'is_admin': is_admin}), 200

@app.template_filter('date_format')
def date_format_filter(date_input, include_time=True):
    if not date_input:
        return ""
    try:
        if isinstance(date_input, datetime):
            date_obj = date_input
        elif isinstance(date_input, str):
            date_obj = datetime.fromisoformat(date_input.replace('Z', '+00:00'))
        else:
            date_str = str(date_input)
            date_obj = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        
        if include_time:
            return date_obj.strftime('%d/%m/%Y %H:%M')
        else:
            return date_obj.strftime('%d/%m/%Y')
    except (ValueError, AttributeError, TypeError) as e:
        logger.warning(f"Error formatting date '{date_input}' (type: {type(date_input).__name__}): {e}")
        return str(date_input)

@app.route('/<lang_code>/verify-admin/<token>', methods=['GET','POST'])
def verify_admin_page(token):
    survey = Survey.get_by_token(token)
    if not survey:
        flash(_('Survey não encontrada'), 'error')
        return redirect(url_for('index', lang_code=g.lang_code))
    
    if current_user.is_authenticated:
        if survey.creator_id == current_user.id or survey.admin_email.lower() == current_user.email.lower():
            return redirect(url_for('dashboard_page', token=token, lang_code=g.lang_code))
    
    if request.method == 'POST':
        email = request.form.get('email', '').lower().strip()
        if email == survey.admin_email.lower():
            session[f'admin_verified_{token}'] = True
            return redirect(url_for('dashboard_page', token=token, lang_code=g.lang_code))
        else:
            flash(_('Email incorreto. Você precisa usar o email do administrador.'), 'danger')
    return render_template('verify_admin.html', survey=survey)

@app.route('/api/survey-data/<token>', methods=['GET'])
def get_survey_data(token):
    survey = Survey.get_by_token(token)
    if not survey:
        return jsonify({'error': _('Survey não encontrada')}), 404
    
    from database.models import Participant
    participants = Participant.query.filter_by(survey_id=survey.id).all()
    participants_dict = {p.id: p.to_dict() for p in participants}
    
    availabilities_by_date = {}
    for participant in participants:
        for availability in participant.availabilities:
            date_str = availability.available_date.isoformat()
            if date_str not in availabilities_by_date:
                availabilities_by_date[date_str] = []
            availabilities_by_date[date_str].append({
                'participant_id': participant.id,
                'name': participant.name,
                'email': participant.email
            })
    
    stats = {
        'total_participants': len(participants),
        'total_dates': len(availabilities_by_date),
        'best_date': None,
        'participants_by_date_count': {}
    }
    
    best_date = None
    max_participants = 0
    for date_str, plist in availabilities_by_date.items():
        count = len(plist)
        stats['participants_by_date_count'][count] = stats['participants_by_date_count'].get(count, 0) + 1
        if count > max_participants:
            max_participants = count
            best_date = date_str
    
    if best_date:
        stats['best_date'] = {
            'date': best_date,
            'count': max_participants,
            'percentage': round((max_participants / len(participants)) * 100 if participants else 0, 1)
        }
    
    return jsonify({
        'survey': survey.to_dict(),
        'participants': participants_dict,
        'availability_by_date': availabilities_by_date,
        'is_expired': survey.is_expired,
        'stats': stats
    }), 200

@app.route('/api/user-info', methods=['GET'])
def get_user_info():
    if current_user.is_authenticated:
        return jsonify({'authenticated': True, 'user': current_user.to_dict()}), 200
    else:
        return jsonify({'authenticated': False}), 200

def generate_admin_token(survey_id, email):
    expiry = datetime.utcnow() + timedelta(hours=24)
    data = {'survey_id': survey_id, 'email': email, 'exp': expiry.timestamp()}
    token_data = json.dumps(data).encode('utf-8')
    token = base64.urlsafe_b64encode(token_data).decode('utf-8')
    return token

@app.errorhandler(404)
def page_not_found(e):
    lang_code = g.get('lang_code', DEFAULT_LANGUAGE)
    return render_template('404.html'), 404

@app.errorhandler(500)
def server_error(e):
    lang_code = g.get('lang_code', DEFAULT_LANGUAGE)
    logger.error(f"Erro 500: {str(e)}", exc_info=True)
    return render_template('500.html'), 500

@app.context_processor
def extra_utility_processor():
    def get_current_year():
        return datetime.now().year
    return dict(current_year=get_current_year)


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    host = os.environ.get('HOST', '0.0.0.0')  # Usar 0.0.0.0 para permitir conexões externas
    app.run(host=host, port=port, debug=app.config.get('DEBUG', False))

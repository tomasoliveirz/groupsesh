from flask import Flask, request, jsonify, render_template, redirect, url_for, flash, abort, session, g
from flask_wtf.csrf import CSRFProtect
from flask_cors import CORS
from datetime import datetime, timedelta
import json
import os
import sys
import logging
import base64
from werkzeug.security import generate_password_hash, check_password_hash
from translations.config import init_babel, LANGUAGES, DEFAULT_LANGUAGE, _, _l
from flask_babel import lazy_gettext as _l
from config import Config

# Initialize application with absolute path to instance
basedir = os.path.abspath(os.path.dirname(__file__))
instance_path = os.path.join(basedir, 'instance')

app = Flask(__name__, 
            instance_path=instance_path,
            instance_relative_config=True)

# Apply configurations from Config object
app.config.from_object(Config)

# Configuração de logging - Corrigido para acessar app.config em vez de Config diretamente
logging.basicConfig(
    level=logging.DEBUG if app.config.get('DEBUG', False) else logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Ensure instance directory exists with proper permissions
try:
    if not os.path.exists(app.instance_path):
        os.makedirs(app.instance_path, exist_ok=True)
        os.chmod(app.instance_path, 0o777)  # Wide permissions for development
    
    logger.info(f"Instance path: {app.instance_path}")
except OSError as e:
    logger.error(f"Error setting up instance directory: {e}")

# Security configuration
csrf = CSRFProtect(app)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Initialize internationalization
babel = init_babel(app)

# Now import database modules
from database import db, init_app
from database.models import Survey, Participant, Availability

# Initialize database
init_app(app)

# Middleware to process language prefix in URL
@app.url_value_preprocessor
def pull_lang_code(endpoint, values):
    if values is not None:
        g.lang_code = values.pop('lang_code', DEFAULT_LANGUAGE)
        # Store language in session for persistence
        session['language'] = g.lang_code

@app.url_defaults
def set_language_code(endpoint, values):
    if 'lang_code' in values or not g.get('lang_code', None):
        return
    if app.url_map.is_endpoint_expecting(endpoint, 'lang_code'):
        values['lang_code'] = g.lang_code

# Redirect to URL with language
@app.route('/')
def home():
    lang_code = request.accept_languages.best_match(LANGUAGES.keys()) or DEFAULT_LANGUAGE
    # Store language in session
    session['language'] = lang_code
    return redirect(url_for('index', lang_code=lang_code))

# Routes for pages
@app.route('/<lang_code>/')
def index():
    """Página inicial"""
    return render_template('index.html')

@app.route('/<lang_code>/create-survey')
def create_survey_page():
    """Página de criação de survey"""
    return render_template('create_survey.html')

@app.route('/<lang_code>/survey/<token>')
def join_survey_page(token):
    """Página de participação na survey"""
    survey = Survey.get_by_token(token)
    if not survey:
        flash(_('Survey não encontrada'), 'error')
        return redirect(url_for('index', lang_code=g.lang_code))
    
    if survey.is_expired:
        flash(_('Esta survey está expirada e não aceita mais respostas'), 'warning')
    
    # Sempre permitimos visualizar a survey, mesmo se expirada
    return render_template('join_survey.html', survey=survey)

@app.route('/<lang_code>/dashboard/<token>')
def dashboard_page(token):
    """Dashboard do administrador"""
    survey = Survey.get_by_token(token)
    if not survey:
        flash(_('Survey não encontrada'), 'error')
        return redirect(url_for('index', lang_code=g.lang_code))
    
    # Verificar se está expirada, mas ainda mostrar o dashboard com aviso
    is_expired = survey.is_expired
    
    # Importante: Passar explicitamente o language_code para o template
    language_code = g.lang_code
    
    return render_template('dashboard.html', 
                          survey=survey, 
                          is_expired=is_expired, 
                          language_code=language_code)


@app.route('/<lang_code>/about')
def about_page():
    """Página sobre"""
    return render_template('about.html')

# API endpoints
@app.route('/api/create-survey', methods=['POST'])
def create_survey():
    """Cria uma nova survey"""
    data = request.json
    
    # Validação básica
    required_fields = ['title', 'admin_email', 'admin_name']
    for field in required_fields:
        if field not in data or not data[field]:
            return jsonify({'error': _('Campo obrigatório ausente: {}').format(field)}), 400
    
    # Normalizar email (converter para minúsculas)
    email = data['admin_email'].lower().strip()
    
    # Validar formato de e-mail (básico)
    if '@' not in email or '.' not in email:
        return jsonify({'error': _('E-mail inválido')}), 400
    
    # Calcular data de expiração
    expires_at = datetime.utcnow() + timedelta(days=app.config['SURVEY_LINK_EXPIRY'])
    
    # Criar survey
    try:
        survey = Survey(
            title=data['title'],
            description=data.get('description', ''),
            admin_email=email,
            admin_name=data['admin_name'],
            expires_at=expires_at
        )
        
        db.session.add(survey)
        db.session.commit()
        
        # Obter o código de idioma atual
        lang_code = g.get('lang_code', DEFAULT_LANGUAGE)
        
        # NOTA: Não criamos automaticamente a participação do admin aqui
        # Isso será feito separadamente logo após o registro da survey
        
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
    """Registra ou atualiza a disponibilidade de um participante"""
    survey = Survey.get_by_token(token)
    if not survey:
        return jsonify({'error': _('Survey não encontrada')}), 404
    
    if survey.is_expired:
        return jsonify({'error': _('Survey expirada')}), 400
    
    data = request.json
    
    # Validação básica
    required_fields = ['name', 'email', 'availability_dates']
    for field in required_fields:
        if field not in data or not data[field]:
            return jsonify({'error': _('Campo obrigatório ausente: {}').format(field)}), 400
    
    # Normalizar email (converter para minúsculas)
    email = data['email'].lower().strip()
    
    # Verificar se é o administrador da survey
    is_admin = (email == survey.admin_email.lower())
    
    # Verificar se o usuário já respondeu
    existing_participant = Participant.get_by_survey_and_email(survey.id, email)
    
    # Atualizações para resposta existente ou nova participação
    try:
        if existing_participant:
            # Se já respondeu, atualizar os dados
            existing_participant.name = data['name']
            # Nota: o campo updated_at será automaticamente atualizado se existir no modelo
            
            # Remover disponibilidades antigas
            Availability.query.filter_by(participant_id=existing_participant.id).delete()
            
            participant = existing_participant
            is_update = True
        else:
            # Criar novo participante
            participant = Participant(
                survey_id=survey.id,
                name=data['name'],
                email=email,
                is_admin=is_admin
            )
            db.session.add(participant)
            db.session.flush()  # Para obter o ID gerado
            is_update = False
        
        # Adicionar novas disponibilidades
        for date_str in data['availability_dates']:
            try:
                # Converter string para data
                date_obj = datetime.fromisoformat(date_str).date()
                
                availability = Availability(
                    participant_id=participant.id,
                    available_date=date_obj
                )
                db.session.add(availability)
            except ValueError:
                # Ignorar datas inválidas
                continue
        
        db.session.commit()
        
        # Log das disponibilidades para monitoramento
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
    """Obtém informações básicas da survey"""
    survey = Survey.get_by_token(token)
    if not survey:
        return jsonify({'error': _('Survey não encontrada')}), 404
    
    # Retornar apenas informações básicas (não inclui participantes)
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
    """Obtém a resposta de um participante específico"""
    survey = Survey.get_by_token(token)
    if not survey:
        return jsonify({'error': _('Survey não encontrada')}), 404
    
    email = request.args.get('email', '').lower()
    if not email:
        return jsonify({'error': _('Email não fornecido')}), 400
    
    # Buscar participante
    participant = Participant.get_by_survey_and_email(survey.id, email)
    if not participant:
        return jsonify({'participant': None}), 200
    
    # Verificar se é o administrador
    is_admin = (email == survey.admin_email.lower())
    
    return jsonify({
        'participant': participant.to_dict(),
        'is_admin': is_admin
    }), 200

@app.template_filter('date_format')
def date_format_filter(date_input, include_time=True):
    """Formata datas ISO para exibição, suportando tanto strings ISO quanto objetos datetime"""
    if not date_input:
        return ""
    
    try:
        # Se já for um objeto datetime, use-o diretamente
        if isinstance(date_input, datetime):
            date_obj = date_input
        # Se for uma string, tente converter para datetime
        elif isinstance(date_input, str):
            date_obj = datetime.fromisoformat(date_input.replace('Z', '+00:00'))
        else:
            # Caso seja outro tipo, tente converter para string e depois para datetime
            date_str = str(date_input)
            date_obj = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        
        # Formata de acordo com o parâmetro include_time
        if include_time:
            return date_obj.strftime('%d/%m/%Y %H:%M')
        else:
            return date_obj.strftime('%d/%m/%Y')
    except (ValueError, AttributeError, TypeError) as e:
        # Em caso de falha, registra o erro e retorna a entrada original como string
        logger.warning(f"Error formatting date '{date_input}' (type: {type(date_input).__name__}): {e}")
        return str(date_input)
    
    
@app.route('/api/verify-admin', methods=['POST'])
def verify_admin():
    """Verifica se o email fornecido é o administrador de uma survey"""
    data = request.json
    
    if not data or 'token' not in data or 'email' not in data:
        return jsonify({'error': _('Parâmetros insuficientes')}), 400
    
    token = data['token']
    email = data['email'].lower().strip()
    
    # Buscar a survey
    survey = Survey.get_by_token(token)
    if not survey:
        return jsonify({'error': _('Survey não encontrada')}), 404
    
    # Verificar se o email corresponde ao admin
    is_admin = (email == survey.admin_email.lower())
    
    if is_admin:
        # Gerar um token de autenticação temporário
        admin_auth_token = generate_admin_token(survey.id, email)
        
        # Salvar em session ou retornar para o cliente salvar em localStorage
        session[f'admin_auth_{token}'] = admin_auth_token
        
        return jsonify({
            'success': True,
            'is_admin': True,
            'admin_name': survey.admin_name,
            'auth_token': admin_auth_token
        }), 200
    else:
        return jsonify({
            'success': True,
            'is_admin': False
        }), 200

@app.route('/api/survey-data/<token>', methods=['GET'])
def get_survey_data(token):
    """Obtém os dados da survey para o dashboard"""
    survey = Survey.get_by_token(token)
    if not survey:
        return jsonify({'error': _('Survey não encontrada')}), 404
    
    # Carregar participantes e suas disponibilidades
    participants = Participant.query.filter_by(survey_id=survey.id).all()
    
    # Criar estrutura de dados para o dashboard
    # 1. Dicionário de participantes
    participants_dict = {p.id: p.to_dict() for p in participants}
    
    # 2. Disponibilidades por data
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
    
    # 3. Estatísticas extras
    stats = {
        'total_participants': len(participants),
        'total_dates': len(availabilities_by_date),
        'best_date': None,
        'participants_by_date_count': {}
    }
    
    # Encontrar as datas com mais participantes
    best_date = None
    max_participants = 0
    
    for date_str, participants_list in availabilities_by_date.items():
        count = len(participants_list)
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

def generate_admin_token(survey_id, email):
    """Gera um token temporário para autenticação do admin"""
    expiry = datetime.utcnow() + timedelta(hours=24)
    data = {
        'survey_id': survey_id,
        'email': email,
        'exp': expiry.timestamp()
    }
    
    # Em produção, usar um algoritmo de assinatura como JWT
    # Para simplificar, usamos uma string codificada em base64
    token_data = json.dumps(data).encode('utf-8')
    token = base64.urlsafe_b64encode(token_data).decode('utf-8')
    
    return token

@app.errorhandler(404)
def page_not_found(e):
    """Tratamento de erro 404"""
    lang_code = g.get('lang_code', DEFAULT_LANGUAGE)
    return render_template('404.html'), 404

@app.errorhandler(500)
def server_error(e):
    """Tratamento de erro 500"""
    lang_code = g.get('lang_code', DEFAULT_LANGUAGE)
    logger.error(f"Erro 500: {str(e)}", exc_info=True)
    return render_template('500.html'), 500

# Registrar função auxiliar para templates
@app.context_processor
def utility_processor():
    def get_current_year():
        return datetime.now().year
    
    return dict(current_year=get_current_year)

if __name__ == '__main__':
    # Em produção, usar um servidor WSGI como gunicorn
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=app.config.get('DEBUG', False))
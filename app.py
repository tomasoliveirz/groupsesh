from flask import Flask, request, jsonify, render_template, redirect, url_for, flash, abort, session, g
from flask_wtf.csrf import CSRFProtect
from flask_cors import CORS
from datetime import datetime, timedelta
import json
import os
import sys
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

# Ensure instance directory exists with proper permissions
try:
    if not os.path.exists(app.instance_path):
        os.makedirs(app.instance_path, exist_ok=True)
        os.chmod(app.instance_path, 0o777)  # Wide permissions for development
    
    print(f"Instance path: {app.instance_path}")
except OSError as e:
    print(f"Error setting up instance directory: {e}")

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
    return render_template('index.html')

@app.route('/<lang_code>/create-survey')
def create_survey_page():
    """Survey creation page"""
    return render_template('create_survey.html')

@app.route('/<lang_code>/survey/<token>')
def join_survey_page(token):
    """Survey participation page"""
    survey = Survey.get_by_token(token)
    if not survey or survey.is_expired:
        flash(_('Survey not found or expired'), 'error')
        return redirect(url_for('index'))
    
    return render_template('join_survey.html', survey=survey)

@app.route('/<lang_code>/dashboard/<token>')
def dashboard_page(token):
    """Administrator dashboard"""
    survey = Survey.get_by_token(token)
    if not survey:
        flash(_('Survey not found'), 'error')
        return redirect(url_for('index'))
    
    # Check if expired, but still show dashboard with warning
    is_expired = survey.is_expired
    
    return render_template('dashboard.html', survey=survey, is_expired=is_expired)

@app.route('/<lang_code>/about')
def about_page():
    """About page"""
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
    
    # Validar formato de e-mail (básico)
    if '@' not in data['admin_email'] or '.' not in data['admin_email']:
        return jsonify({'error': _('E-mail inválido')}), 400
    
    # Calcular data de expiração
    expires_at = datetime.utcnow() + timedelta(days=app.config['SURVEY_LINK_EXPIRY'])
    
    # Criar survey
    try:
        survey = Survey(
            title=data['title'],
            description=data.get('description', ''),
            admin_email=data['admin_email'],
            admin_name=data['admin_name'],
            expires_at=expires_at
        )
        
        db.session.add(survey)
        db.session.commit()
        
        # Obter o código de idioma atual
        lang_code = g.get('lang_code', DEFAULT_LANGUAGE)
        
        return jsonify({
            'message': _('Survey criada com sucesso'),
            'survey': survey.to_dict(),
            'admin_url': url_for('dashboard_page', token=survey.token, lang_code=lang_code, _external=True),
            'participant_url': url_for('join_survey_page', token=survey.token, lang_code=lang_code, _external=True)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Erro ao criar survey: {str(e)}")
        return jsonify({'error': _('Erro ao criar survey')}), 500

@app.route('/api/join-survey/<token>', methods=['POST'])
def join_survey(token):
    """Registra a disponibilidade de um participante"""
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
    
    # Validar formato de e-mail (básico)
    if '@' not in data['email'] or '.' not in data['email']:
        return jsonify({'error': _('E-mail inválido')}), 400
    
    # Validar datas
    availability_dates = data['availability_dates']
    if not isinstance(availability_dates, list):
        return jsonify({'error': _('Formato de datas inválido')}), 400
    
    try:
        # Verificar se o usuário já respondeu
        existing_participant = Participant.query.filter_by(
            survey_id=survey.id,
            email=data['email']
        ).first()
        
        if existing_participant:
            # Se já respondeu, atualizar as disponibilidades
            # Primeiro, remover disponibilidades antigas
            Availability.query.filter_by(participant_id=existing_participant.id).delete()
            
            participant = existing_participant
            participant.name = data['name']  # Atualizar nome se necessário
        else:
            # Criar novo participante
            participant = Participant(
                survey_id=survey.id,
                name=data['name'],
                email=data['email']
            )
            db.session.add(participant)
            db.session.flush()  # Para obter o ID gerado
        
        # Adicionar disponibilidades
        for date_str in availability_dates:
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
        
        return jsonify({
            'message': _('Disponibilidade registrada com sucesso'),
            'participant': participant.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Erro ao registrar disponibilidade: {str(e)}")
        return jsonify({'error': _('Erro ao registrar disponibilidade')}), 500

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
    
    return jsonify({
        'survey': survey.to_dict(),
        'participants': participants_dict,
        'availability_by_date': availabilities_by_date,
        'is_expired': survey.is_expired
    }), 200

@app.errorhandler(404)
def page_not_found(e):
    """Tratamento de erro 404"""
    lang_code = g.get('lang_code', DEFAULT_LANGUAGE)
    return render_template('404.html'), 404

@app.errorhandler(500)
def server_error(e):
    """Tratamento de erro 500"""
    lang_code = g.get('lang_code', DEFAULT_LANGUAGE)
    return render_template('500.html'), 500

if __name__ == '__main__':
    # Em produção, usar um servidor WSGI como gunicorn
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=Config.DEBUG)
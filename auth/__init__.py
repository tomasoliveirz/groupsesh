from flask_login import LoginManager

login_manager = LoginManager()

def init_app(app):
    """
    Inicializa o módulo de autenticação e configura o Flask-Login.
    
    Este método configura o sistema de autenticação, incluindo:
    1. Inicialização do gerenciador de login
    2. Configuração do OAuth do Google (quando disponível)
    3. Registro do blueprint de autenticação
    4. Configuração do carregador de usuário
    """
    # Inicializa o gerenciador de login
    login_manager.init_app(app)
    
    # Importação aqui dentro para evitar importação circular
    from auth.oauth import init_oauth
    
    # Inicializa OAuth (não causará erros se as credenciais não existirem)
    init_oauth(app)
    
    # Registra o blueprint de autenticação
    from auth.routes import auth_bp
    app.register_blueprint(auth_bp, url_prefix='/auth')
    
    # Configura o carregador de usuário para o Flask-Login
    @login_manager.user_loader
    def load_user(user_id):
        from database.models import User
        return User.query.get(int(user_id))
    
    # Configurações adicionais do Flask-Login
    login_manager.login_view = 'auth.login'
    login_manager.login_message = 'Por favor, faça login para acessar esta página.'
    login_manager.login_message_category = 'info'
    
    # Disponibiliza o status do OAuth para templates
    @app.context_processor
    def inject_oauth_status():
        from auth.oauth import google_enabled
        return dict(google_oauth_enabled=google_enabled)
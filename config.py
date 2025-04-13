import os
from datetime import timedelta
from dotenv import load_dotenv

# Load environment variables from .env if it exists
load_dotenv()

class Config:
    # Basic configuration
    SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key-here')
    DEBUG = os.environ.get('FLASK_DEBUG', 'False').lower() in ('true', '1', 't')
    
    # Database configurations
    # First check for DATABASE_URL (Render/Heroku) and adjust for postgres/postgresql if needed
    DATABASE_URL = os.environ.get('DATABASE_URL')
    if DATABASE_URL and DATABASE_URL.startswith('postgres://'):
        DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql://')
        SQLALCHEMY_DATABASE_URI = DATABASE_URL
    else:
        # SQLite as fallback
        SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'sqlite:///instance/availability_survey.db')
    
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Authentication configurations
    REMEMBER_COOKIE_DURATION = timedelta(days=30)
    PERMANENT_SESSION_LIFETIME = timedelta(days=30)
    SESSION_TYPE = 'filesystem'
    
    # OAuth for Google
    GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID', '')
    GOOGLE_CLIENT_SECRET = os.environ.get('GOOGLE_CLIENT_SECRET', '')
    
    # Security configurations
    SESSION_COOKIE_SECURE = os.environ.get('SESSION_COOKIE_SECURE', 'False').lower() in ('true', '1', 't')
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    
    # Email system configurations
    MAIL_SERVER = os.environ.get('MAIL_SERVER', 'smtp.example.com')
    MAIL_PORT = int(os.environ.get('MAIL_PORT', 587))
    MAIL_USE_TLS = os.environ.get('MAIL_USE_TLS', 'True').lower() in ('true', '1', 't')
    MAIL_USE_SSL = os.environ.get('MAIL_USE_SSL', 'False').lower() in ('true', '1', 't')
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME', '')
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD', '')
    MAIL_DEFAULT_SENDER = os.environ.get('MAIL_DEFAULT_SENDER', 'noreply@groupsesh.com')
    
    # GroupSesh specific configurations
    SURVEY_LINK_EXPIRY = int(os.environ.get('SURVEY_LINK_EXPIRY', 30))  # Days
    
    # Internationalization configurations
    BABEL_DEFAULT_LOCALE = 'en'  # Changed to English
    BABEL_DEFAULT_TIMEZONE = 'UTC'
    
    @staticmethod
    def init_app(app):
        """Additional initialization for the Flask application."""
        pass


class DevelopmentConfig(Config):
    DEBUG = True
    # Other development-specific configurations


class ProductionConfig(Config):
    DEBUG = False
    
    # Security configurations for production
    SESSION_COOKIE_SECURE = True
    
    @staticmethod
    def init_app(app):
        Config.init_app(app)
        # Additional security configurations for production


class RenderConfig(ProductionConfig):
    """Render-specific configuration."""
    
    @staticmethod
    def init_app(app):
        ProductionConfig.init_app(app)
        
        # Configure to use gunicorn in production
        from werkzeug.middleware.proxy_fix import ProxyFix
        app.wsgi_app = ProxyFix(
            app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_prefix=1
        )
        
        # Ensure session directory (for SESSION_TYPE = 'filesystem')
        import os
        os.makedirs('flask_session', exist_ok=True)


# Configuration to automatically choose based on environment
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'render': RenderConfig,
    'default': DevelopmentConfig
}

# Automatically detect if we're on Render
is_on_render = os.environ.get('RENDER', '') == 'true'
config_name = os.environ.get('FLASK_CONFIG', 'render' if is_on_render else 'default')

# Ensure configuration exists
if config_name not in config:
    config_name = 'default'

selected_config = config[config_name]
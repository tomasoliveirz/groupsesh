import os
from datetime import timedelta

class Config:
    # Configurações básicas
    SECRET_KEY = os.environ.get('SECRET_KEY', 'sua-chave-secreta-aqui')
    DEBUG = os.environ.get('DEBUG', 'False').lower() == 'true'
    
    # Configurações do banco de dados
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'sqlite:///instance/groupsesh.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Configurações de autenticação
    REMEMBER_COOKIE_DURATION = timedelta(days=30)
    PERMANENT_SESSION_LIFETIME = timedelta(days=30)
    SESSION_TYPE = 'filesystem'
    
    # OAuth para Google
    GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID', '')
    GOOGLE_CLIENT_SECRET = os.environ.get('GOOGLE_CLIENT_SECRET', '')
    
    # Configurações de segurança
    SESSION_COOKIE_SECURE = os.environ.get('SESSION_COOKIE_SECURE', 'False').lower() == 'true'
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    
    # Configurações do sistema de emails
    MAIL_SERVER = os.environ.get('MAIL_SERVER', 'smtp.example.com')
    MAIL_PORT = int(os.environ.get('MAIL_PORT', 587))
    MAIL_USE_TLS = os.environ.get('MAIL_USE_TLS', 'True').lower() == 'true'
    MAIL_USE_SSL = os.environ.get('MAIL_USE_SSL', 'False').lower() == 'true'
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME', 'username')
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD', 'password')
    MAIL_DEFAULT_SENDER = os.environ.get('MAIL_DEFAULT_SENDER', 'noreply@groupsesh.com')
    
    # Configurações específicas do GroupSesh
    SURVEY_LINK_EXPIRY = int(os.environ.get('SURVEY_LINK_EXPIRY', 30))  # Dias
    
    # Configurações de internacionalização
    BABEL_DEFAULT_LOCALE = 'pt'
    BABEL_DEFAULT_TIMEZONE = 'UTC'
    
    @staticmethod
    def init_app(app):
        """Inicialização adicional para o aplicativo Flask."""
        pass


class DevelopmentConfig(Config):
    DEBUG = True
    # Outras configurações específicas para desenvolvimento


class ProductionConfig(Config):
    DEBUG = False
    
    # Configurações de segurança para produção
    SESSION_COOKIE_SECURE = True
    
    @staticmethod
    def init_app(app):
        Config.init_app(app)
        # Configurações adicionais de segurança para produção


# Configuração para escolher automaticamente com base no ambiente
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}

config_name = os.environ.get('FLASK_CONFIG', 'default')
selected_config = config[config_name]
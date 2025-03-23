import os
from datetime import timedelta  # Adicionando importação do timedelta

class Config:
    # Configuração básica
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'chave-secreta-padrao-deve-ser-alterada-em-producao'
    
    # Configuração do caminho absoluto para o banco de dados
    basedir = os.path.abspath(os.path.dirname(__file__))
    instance_path = os.path.join(basedir, 'instance')
    db_path = os.path.join(instance_path, 'availability_survey.db')
    
    # URI do banco de dados com caminho absoluto
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or f'sqlite:///{db_path}'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Configurações de segurança
    WTF_CSRF_ENABLED = True
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    REMEMBER_COOKIE_SECURE = True
    REMEMBER_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    
    # Duração do link da survey (em dias)
    SURVEY_LINK_EXPIRY = 30
    
    # Tempo máximo de inatividade da sessão (em minutos)
    PERMANENT_SESSION_LIFETIME = timedelta(minutes=30)
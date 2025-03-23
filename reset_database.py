# reset_database.py

import os
import sys
from datetime import datetime

# Adiciona o diretório pai ao path para importar os módulos
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from flask import Flask
from config import Config
from database import db
from sqlalchemy import text  # Importação necessária para expressões SQL textuais

# Criar aplicação Flask
app = Flask(__name__)
app.config.from_object(Config)

# Inicializar banco de dados
db.init_app(app)

# Definir modelos de dados
class Survey(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    token = db.Column(db.String(64), unique=True, nullable=False)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    admin_email = db.Column(db.String(255), nullable=False)
    admin_name = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=False)
    
    # Relações
    participants = db.relationship('Participant', back_populates='survey', cascade='all, delete-orphan')
    
    @property
    def is_expired(self):
        return datetime.utcnow() > self.expires_at
    
    def to_dict(self):
        return {
            'id': self.id,
            'token': self.token,
            'title': self.title,
            'description': self.description,
            'admin_email': self.admin_email,
            'admin_name': self.admin_name,
            'created_at': self.created_at.isoformat(),
            'expires_at': self.expires_at.isoformat(),
            'is_expired': self.is_expired
        }
    
    @classmethod
    def get_by_token(cls, token):
        return cls.query.filter_by(token=token).first()

class Participant(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    survey_id = db.Column(db.Integer, db.ForeignKey('survey.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_admin = db.Column(db.Boolean, default=False)  # Campo para identificar o administrador
    
    # Relações
    survey = db.relationship('Survey', back_populates='participants')
    availabilities = db.relationship('Availability', back_populates='participant', cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'created_at': self.created_at.isoformat(),
            'is_admin': self.is_admin,
            'availability_dates': [a.available_date.isoformat() for a in self.availabilities]
        }

class Availability(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    participant_id = db.Column(db.Integer, db.ForeignKey('participant.id'), nullable=False)
    available_date = db.Column(db.Date, nullable=False)
    
    # Relação
    participant = db.relationship('Participant', back_populates='availabilities')
    
    # Restrição única para evitar duplicatas
    __table_args__ = (db.UniqueConstraint('participant_id', 'available_date'),)

# Recriação do banco de dados
with app.app_context():
    # Verificar se o arquivo do banco existe e removê-lo
    db_path = app.config['SQLALCHEMY_DATABASE_URI'].replace('sqlite:///', '')
    if db_path.startswith('/'):  # É um caminho absoluto
        if os.path.exists(db_path):
            try:
                os.remove(db_path)
                print(f"Banco de dados antigo removido: {db_path}")
            except Exception as e:
                print(f"Erro ao remover banco de dados: {e}")
    
    # Criar todas as tabelas
    db.create_all()
    print("Banco de dados recriado com sucesso!")
    
    # Criar índices para melhorar performance - CORRIGIDO
    try:
        # Usando text() para envolver explicitamente as expressões SQL
        # E corrigindo a sintaxe para usar IF NOT EXISTS
        db.session.execute(text("CREATE INDEX IF NOT EXISTS idx_surveys_token ON survey(token)"))
        db.session.execute(text("CREATE INDEX IF NOT EXISTS idx_participants_survey_id ON participant(survey_id)"))
        db.session.execute(text("CREATE INDEX IF NOT EXISTS idx_availabilities_participant_id ON availability(participant_id)"))
        db.session.execute(text("CREATE INDEX IF NOT EXISTS idx_availabilities_date ON availability(available_date)"))
        db.session.commit()
        print("Índices criados com sucesso!")
    except Exception as e:
        db.session.rollback()  # Garantir rollback em caso de erro
        print(f"Erro ao criar índices: {e}")
        # Continuar mesmo com erro nos índices, pois as tabelas base já foram criadas
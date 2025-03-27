from datetime import datetime, timedelta
import uuid
from sqlalchemy import Column, ForeignKey, Integer, String, Text, DateTime, Boolean, Date
from sqlalchemy.orm import relationship
from flask_login import UserMixin
from database import db
from werkzeug.security import generate_password_hash, check_password_hash
import secrets

class User(db.Model, UserMixin):
    """
    Modelo que representa um usuário do sistema.
    """
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=True)
    name = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    
    # Campos para autenticação externa
    google_id = db.Column(db.String(255), nullable=True, unique=True)
    profile_picture = db.Column(db.String(255), nullable=True)
    
    # Campos para verificação de conta e recuperação de senha
    is_verified = db.Column(db.Boolean, default=False)
    verification_token = db.Column(db.String(255), nullable=True)
    verification_token_expiry = db.Column(db.DateTime, nullable=True)
    reset_password_token = db.Column(db.String(255), nullable=True)
    reset_password_token_expiry = db.Column(db.DateTime, nullable=True)
    
    # Relacionamentos
    surveys = db.relationship('Survey', backref='creator', lazy='dynamic')
    participants = db.relationship('Participant', backref='user', lazy='dynamic')
    
    def set_password(self, password):
        """Define a senha do usuário com hash seguro."""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Verifica se a senha corresponde ao hash armazenado."""
        if self.password_hash:
            return check_password_hash(self.password_hash, password)
        return False
    
    def generate_verification_token(self):
        """Gera um token para verificação de email."""
        self.verification_token = secrets.token_urlsafe(32)
        self.verification_token_expiry = datetime.utcnow() + timedelta(hours=24)
        return self.verification_token
    
    def verify_account(self, token):
        """Verifica a conta do usuário com o token fornecido."""
        if (self.verification_token == token and 
            self.verification_token_expiry > datetime.utcnow()):
            self.is_verified = True
            self.verification_token = None
            self.verification_token_expiry = None
            return True
        return False
    
    def generate_reset_token(self):
        """Gera um token para redefinição de senha."""
        self.reset_password_token = secrets.token_urlsafe(32)
        self.reset_password_token_expiry = datetime.utcnow() + timedelta(hours=1)
        return self.reset_password_token
    
    def reset_password(self, token, new_password):
        """Redefine a senha do usuário com o token fornecido."""
        if (self.reset_password_token == token and 
            self.reset_password_token_expiry > datetime.utcnow()):
            self.set_password(new_password)
            self.reset_password_token = None
            self.reset_password_token_expiry = None
            return True
        return False
    
    @classmethod
    def get_by_email(cls, email):
        """Busca um usuário pelo email."""
        return cls.query.filter_by(email=email.lower()).first()
    
    @classmethod
    def get_by_google_id(cls, google_id):
        """Busca um usuário pelo ID do Google."""
        return cls.query.filter_by(google_id=google_id).first()
    
    def to_dict(self):
        """Converte o usuário para um dicionário."""
        return {
            'id': self.id,
            'email': self.email,
            'name': self.name,
            'created_at': self.created_at.isoformat(),
            'is_verified': self.is_verified,
            'has_password': self.password_hash is not None,
            'has_google': self.google_id is not None,
            'profile_picture': self.profile_picture
        }


class Survey(db.Model):
    """
    Modelo que representa uma pesquisa de disponibilidade.
    """
    __tablename__ = 'survey'  # Definição explícita do nome da tabela
    
    id = db.Column(db.Integer, primary_key=True)
    token = db.Column(db.String(64), unique=True, nullable=False, 
                     default=lambda: str(uuid.uuid4()))
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    admin_email = db.Column(db.String(255), nullable=False)
    admin_name = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=False)
    
    # Relação explicitamente definida com Participant
    participants = db.relationship(
        'Participant',
        back_populates='survey',
        cascade='all, delete-orphan',
        lazy='dynamic',
        foreign_keys='Participant.survey_id'  # Especificação explícita da chave estrangeira
    )
    
    @property
    def is_expired(self):
        """Verifica se a survey está expirada."""
        return datetime.utcnow() > self.expires_at
    
    def to_dict(self):
        """Converte o objeto Survey para um dicionário."""
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
        """Obtém uma survey pelo token."""
        return cls.query.filter_by(token=token).first()


class Participant(db.Model):
    __tablename__ = 'participant'
    
    id = db.Column(db.Integer, primary_key=True)
    survey_id = db.Column(db.Integer, db.ForeignKey('survey.id', ondelete='CASCADE'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    # Removida a coluna updated_at que não existe no banco de dados
    is_admin = db.Column(db.Boolean, default=False)
    
    # Adicionando unique constraint para evitar respostas duplicadas
    __table_args__ = (db.UniqueConstraint('survey_id', 'email', name='uix_participant_survey_email'),)
    
    # Relações
    survey = db.relationship('Survey', back_populates='participants', foreign_keys=[survey_id])
    availabilities = db.relationship('Availability', back_populates='participant', 
                                     cascade='all, delete-orphan', lazy='joined')
    
    @classmethod
    def get_by_survey_and_email(cls, survey_id, email):
        """Busca um participante por survey_id e email"""
        return cls.query.filter_by(survey_id=survey_id, email=email.lower()).first()
    
    @property
    def is_survey_admin(self):
        """Verifica se o participante é o administrador da survey"""
        return self.is_admin
    
    def to_dict(self):
        """Converte o objeto Participant para um dicionário"""
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'created_at': self.created_at.isoformat(),
            # Removida referência a updated_at
            'is_admin': self.is_admin,
            'availability_dates': [a.available_date.isoformat() for a in self.availabilities]
        }
    
    
class Availability(db.Model):
    """
    Modelo que representa a disponibilidade de um participante em uma data específica.
    """
    __tablename__ = 'availability'  # Definição explícita do nome da tabela
    
    id = db.Column(db.Integer, primary_key=True)
    participant_id = db.Column(db.Integer, db.ForeignKey('participant.id', ondelete='CASCADE'), nullable=False)
    available_date = db.Column(db.Date, nullable=False)
    
    # Relação com Participant
    participant = db.relationship(
        'Participant',
        back_populates='availabilities',
        foreign_keys=[participant_id]  # Referência explícita ao campo participant_id
    )
    
    # Restrição única para evitar duplicatas
    __table_args__ = (db.UniqueConstraint('participant_id', 'available_date'),)

# Adicionar relações às classes existentes
Survey.creator_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
Participant.user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
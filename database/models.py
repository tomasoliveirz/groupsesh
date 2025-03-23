from datetime import datetime, timedelta
import uuid
from sqlalchemy import Column, ForeignKey, Integer, String, Text, DateTime, Boolean, Date
from sqlalchemy.orm import relationship
from database import db

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
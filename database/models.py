from datetime import datetime
import json
from . import db
import uuid
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy.orm import relationship

class Survey(db.Model):
    """Modelo para as pesquisas de disponibilidade."""
    __tablename__ = 'surveys'
    
    id = db.Column(db.Integer, primary_key=True)
    token = db.Column(db.String(64), unique=True, nullable=False)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    admin_email = db.Column(db.String(255), nullable=False)
    admin_name = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    
    # Relacionamentos
    participants = relationship("Participant", back_populates="survey", cascade="all, delete-orphan")
    
    def __init__(self, title, description, admin_email, admin_name, expires_at):
        self.title = title
        self.description = description
        self.admin_email = admin_email
        self.admin_name = admin_name
        self.expires_at = expires_at
        self.token = str(uuid.uuid4())
    
    def to_dict(self):
        """Converte o objeto para um dicionário."""
        return {
            'id': self.id,
            'token': self.token,
            'title': self.title,
            'description': self.description,
            'admin_email': self.admin_email,
            'admin_name': self.admin_name,
            'created_at': self.created_at.isoformat(),
            'expires_at': self.expires_at.isoformat(),
            'is_active': self.is_active
        }
    
    @classmethod
    def get_by_token(cls, token):
        """Busca uma survey pelo token."""
        return cls.query.filter_by(token=token, is_active=True).first()
    
    @property
    def is_expired(self):
        """Verifica se a survey está expirada."""
        return datetime.utcnow() > self.expires_at

class Participant(db.Model):
    """Modelo para os participantes da survey."""
    __tablename__ = 'participants'
    
    id = db.Column(db.Integer, primary_key=True)
    survey_id = db.Column(db.Integer, db.ForeignKey('surveys.id'), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relacionamentos
    survey = relationship("Survey", back_populates="participants")
    availabilities = relationship("Availability", back_populates="participant", cascade="all, delete-orphan")
    
    def __init__(self, survey_id, name, email):
        self.survey_id = survey_id
        self.name = name
        self.email = email
    
    def to_dict(self):
        """Converte o objeto para um dicionário."""
        return {
            'id': self.id,
            'survey_id': self.survey_id,
            'name': self.name,
            'email': self.email,
            'created_at': self.created_at.isoformat(),
            'availability_dates': [a.available_date.isoformat() for a in self.availabilities]
        }

class Availability(db.Model):
    """Modelo para os dias de disponibilidade."""
    __tablename__ = 'availabilities'
    
    id = db.Column(db.Integer, primary_key=True)
    participant_id = db.Column(db.Integer, db.ForeignKey('participants.id'), nullable=False)
    available_date = db.Column(db.Date, nullable=False)
    
    # Relacionamentos
    participant = relationship("Participant", back_populates="availabilities")
    
    __table_args__ = (
        db.UniqueConstraint('participant_id', 'available_date', name='unique_participant_date'),
    )
    
    def __init__(self, participant_id, available_date):
        self.participant_id = participant_id
        self.available_date = available_date
    
    def to_dict(self):
        """Converte o objeto para um dicionário."""
        return {
            'id': self.id,
            'participant_id': self.participant_id,
            'available_date': self.available_date.isoformat()
        }
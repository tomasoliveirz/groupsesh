"""
models.py
=========
Modelos SQLAlchemy que correspondem às tabelas definidas em schema.sql.
Adaptados para uso com Flask e o objeto 'db' (de flask_sqlalchemy).
"""

import uuid
import secrets
from datetime import datetime, timedelta

from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import Column, String, Integer, Text, DateTime, Boolean, Date, ForeignKey
from sqlalchemy.orm import relationship

from database import db  # Presume que você tenha um 'database.py' que inicializa 'db'


class User(db.Model, UserMixin):
    """
    Representa um usuário do sistema, armazenado na tabela 'users'.
    """
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=True)
    name = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True, nullable=False)

    # Autenticação externa
    google_id = Column(String(255), unique=True, nullable=True)
    profile_picture = Column(String(255), nullable=True)

    # Verificação de conta e recuperação de senha
    is_verified = Column(Boolean, default=False, nullable=False)
    verification_token = Column(String(255), nullable=True)
    verification_token_expiry = Column(DateTime, nullable=True)
    reset_password_token = Column(String(255), nullable=True)
    reset_password_token_expiry = Column(DateTime, nullable=True)

    # Relacionamentos diretos (Survey e Participant)
    surveys = relationship("Survey", backref="creator", lazy="dynamic")
    participants = relationship("Participant", backref="user", lazy="dynamic")

    def set_password(self, password: str) -> None:
        """Define a senha do usuário com hash seguro."""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        """Verifica se a senha corresponde ao hash armazenado."""
        if not self.password_hash:
            return False
        return check_password_hash(self.password_hash, password)

    def generate_verification_token(self) -> str:
        """Gera e retorna um token para verificação de email, válido por 24h."""
        self.verification_token = secrets.token_urlsafe(32)
        self.verification_token_expiry = datetime.utcnow() + timedelta(hours=24)
        return self.verification_token

    def verify_account(self, token: str) -> bool:
        """
        Verifica a conta do usuário com o token fornecido.
        Retorna True se a verificação for bem-sucedida.
        """
        if (self.verification_token == token and 
                self.verification_token_expiry > datetime.utcnow()):
            self.is_verified = True
            self.verification_token = None
            self.verification_token_expiry = None
            return True
        return False

    def generate_reset_token(self) -> str:
        """
        Gera e retorna um token para redefinição de senha, válido por 1h.
        """
        self.reset_password_token = secrets.token_urlsafe(32)
        self.reset_password_token_expiry = datetime.utcnow() + timedelta(hours=1)
        return self.reset_password_token

    def reset_password(self, token: str, new_password: str) -> bool:
        """
        Redefine a senha do usuário, se o token for válido.
        Retorna True se a redefinição for bem-sucedida.
        """
        if (self.reset_password_token == token and
                self.reset_password_token_expiry > datetime.utcnow()):
            self.set_password(new_password)
            self.reset_password_token = None
            self.reset_password_token_expiry = None
            return True
        return False

    @classmethod
    def get_by_email(cls, email: str):
        """Busca um usuário pelo email."""
        return cls.query.filter_by(email=email.lower()).first()

    @classmethod
    def get_by_google_id(cls, google_id: str):
        """Busca um usuário pelo ID do Google."""
        return cls.query.filter_by(google_id=google_id).first()

    def to_dict(self) -> dict:
        """Converte o usuário para um dicionário simples."""
        return {
            "id": self.id,
            "email": self.email,
            "name": self.name,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "is_verified": self.is_verified,
            "has_password": self.password_hash is not None,
            "has_google": self.google_id is not None,
            "profile_picture": self.profile_picture
        }


class Survey(db.Model):
    """
    Representa uma pesquisa de disponibilidade, armazenada na tabela 'surveys'.
    """
    __tablename__ = 'surveys'

    id = Column(Integer, primary_key=True)
    token = Column(String(64), unique=True, nullable=False, default=lambda: str(uuid.uuid4()))
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    admin_email = Column(String(255), nullable=False)
    admin_name = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    # Relacionamento com User
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Relacionamento com Participant
    participants = relationship(
        "Participant",
        back_populates="survey",
        cascade="all, delete-orphan",
        lazy="dynamic"
    )

    @property
    def is_expired(self) -> bool:
        """Retorna True se a survey já expirou."""
        return datetime.utcnow() > self.expires_at

    def to_dict(self) -> dict:
        """Converte a Survey para um dicionário simples."""
        return {
            "id": self.id,
            "token": self.token,
            "title": self.title,
            "description": self.description,
            "admin_email": self.admin_email,
            "admin_name": self.admin_name,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "is_expired": self.is_expired,
            "is_active": self.is_active
        }

    @classmethod
    def get_by_token(cls, token: str):
        """Obtém uma Survey pelo token único."""
        return cls.query.filter_by(token=token).first()


class Participant(db.Model):
    """
    Representa um participante que responde a uma Survey, armazenado em 'participants'.
    """
    __tablename__ = 'participants'

    id = Column(Integer, primary_key=True)
    survey_id = Column(Integer, ForeignKey("surveys.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_admin = Column(Boolean, default=False, nullable=False)

    __table_args__ = (
        db.UniqueConstraint("survey_id", "email", name="uix_participant_survey_email"),
    )

    survey = relationship("Survey", back_populates="participants")
    # Relação com User (via user_id) está implícita por ForeignKey("users.id"), mas sem "back_populates" aqui.
    availabilities = relationship(
        "Availability",
        back_populates="participant",
        cascade="all, delete-orphan",
        lazy="joined"
    )

    def to_dict(self) -> dict:
        """Converte o Participant para um dicionário simples."""
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "is_admin": self.is_admin,
            "availability_dates": [
                a.available_date.isoformat() for a in self.availabilities
            ]
        }

    @property
    def is_survey_admin(self) -> bool:
        """Retorna True se este participante é marcado como administrador."""
        return self.is_admin

    @classmethod
    def get_by_survey_and_email(cls, survey_id: int, email: str):
        """Busca um participante por survey_id e email."""
        return cls.query.filter_by(survey_id=survey_id, email=email.lower()).first()


class Availability(db.Model):
    """
    Representa a disponibilidade de um participante em uma data específica. Tabela: 'availabilities'.
    """
    __tablename__ = 'availabilities'

    id = Column(Integer, primary_key=True)
    participant_id = Column(Integer, ForeignKey("participants.id", ondelete="CASCADE"), nullable=False)
    available_date = Column(Date, nullable=False)

    __table_args__ = (
        db.UniqueConstraint("participant_id", "available_date", name="uix_avail_participant_date"),
    )

    participant = relationship("Participant", back_populates="availabilities")

    def __init__(self, participant_id: int, available_date: Date):
        self.participant_id = participant_id
        self.available_date = available_date

# criar um script de migração (migration.py)
from app import app, db
from database.models import User, Survey
import uuid

def associate_surveys_with_users():
    """Associa surveys existentes a usuários com base no admin_email"""
    
    with app.app_context():
        # Encontrar surveys sem criador
        surveys = Survey.query.filter_by(creator_id=None).all()
        print(f"Encontradas {len(surveys)} surveys sem criador associado.")
        
        for survey in surveys:
            # Procurar usuário com o mesmo email
            user = User.get_by_email(survey.admin_email)
            
            if user:
                # Associar survey ao usuário
                survey.creator_id = user.id
                print(f"Survey '{survey.title}' associada ao usuário {user.email}")
            else:
                # Criar usuário temporário
                print(f"Criando usuário para email: {survey.admin_email}")
                
                # Gerar senha aleatória
                temp_password = uuid.uuid4().hex
                
                user = User(
                    email=survey.admin_email,
                    name=survey.admin_name,
                    is_verified=True,
                    is_active=True
                )
                user.set_password(temp_password)
                
                db.session.add(user)
                db.session.flush()  # Obter ID sem commit
                
                # Associar survey
                survey.creator_id = user.id
        
        # Commit das alterações
        db.session.commit()
        print("Migração concluída com sucesso!")

if __name__ == "__main__":
    associate_surveys_with_users()
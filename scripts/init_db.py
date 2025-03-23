#!/usr/bin/env python3
"""
Script para inicializar o banco de dados SQLite com o esquema correto.
Útil para ambientes de desenvolvimento ou reinstalação.
"""

import os
import sys
import sqlite3
from datetime import datetime, timedelta
import uuid

# Adicionar o diretório raiz ao path para importar os módulos
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Definir caminhos
DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '../instance/availability_survey.db'))
SCHEMA_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '../database/schema.sql'))

def create_database():
    """Cria o banco de dados e as tabelas utilizando o esquema SQL."""
    # Verificar se o diretório instance existe
    instance_dir = os.path.dirname(DB_PATH)
    if not os.path.exists(instance_dir):
        os.makedirs(instance_dir)
    
    # Verificar se o banco já existe
    if os.path.exists(DB_PATH):
        response = input(f"O banco de dados já existe em {DB_PATH}. Deseja recriá-lo? (s/N): ")
        if response.lower() != 's':
            print("Operação cancelada.")
            return False
        else:
            # Fazer backup antes de recriar
            backup_path = f"{DB_PATH}_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            print(f"Criando backup em {backup_path}...")
            try:
                import shutil
                shutil.copy2(DB_PATH, backup_path)
                print("Backup criado com sucesso.")
            except Exception as e:
                print(f"Erro ao criar backup: {e}")
                response = input("Continuar mesmo assim? (s/N): ")
                if response.lower() != 's':
                    print("Operação cancelada.")
                    return False
    
    # Ler o esquema SQL
    try:
        with open(SCHEMA_PATH, 'r') as f:
            schema_sql = f.read()
    except Exception as e:
        print(f"Erro ao ler o arquivo de esquema: {e}")
        return False
    
    # Criar banco de dados e executar esquema
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.executescript(schema_sql)
        conn.commit()
        conn.close()
        print(f"Banco de dados criado com sucesso em {DB_PATH}")
        return True
    except Exception as e:
        print(f"Erro ao criar banco de dados: {e}")
        return False

def create_sample_data():
    """Cria dados de exemplo para o banco de dados."""
    response = input("Deseja criar dados de exemplo? (s/N): ")
    if response.lower() != 's':
        return
    
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Criar uma survey de exemplo
        admin_name = "Administrador Exemplo"
        admin_email = "admin@exemplo.com"
        title = "Reunião de Equipe - Exemplo"
        description = "Esta é uma survey de exemplo para demonstração do sistema."
        token = str(uuid.uuid4())
        expires_at = (datetime.now() + timedelta(days=30)).isoformat()
        
        cursor.execute(
            "INSERT INTO surveys (token, title, description, admin_email, admin_name, expires_at) VALUES (?, ?, ?, ?, ?, ?)",
            (token, title, description, admin_email, admin_name, expires_at)
        )
        survey_id = cursor.lastrowid
        
        print(f"Survey de exemplo criada com token: {token}")
        
        # Criar alguns participantes de exemplo
        participants = [
            ("João Silva", "joao@exemplo.com"),
            ("Maria Oliveira", "maria@exemplo.com"),
            ("Carlos Santos", "carlos@exemplo.com"),
            ("Ana Pereira", "ana@exemplo.com")
        ]
        
        for name, email in participants:
            cursor.execute(
                "INSERT INTO participants (survey_id, name, email) VALUES (?, ?, ?)",
                (survey_id, name, email)
            )
            participant_id = cursor.lastrowid
            
            # Adicionar disponibilidades aleatórias
            # Próximos 10 dias a partir de hoje
            today = datetime.now().date()
            for i in range(1, 11):
                # Cada participante está disponível em alguns dias aleatórios
                if i % (participants.index((name, email)) + 2) == 0:
                    date = (today + timedelta(days=i)).isoformat()
                    cursor.execute(
                        "INSERT INTO availabilities (participant_id, available_date) VALUES (?, ?)",
                        (participant_id, date)
                    )
        
        conn.commit()
        conn.close()
        
        print(f"Dados de exemplo criados com sucesso!")
        print(f"URL de administração: http://localhost:5000/dashboard/{token}")
        print(f"URL de participação: http://localhost:5000/survey/{token}")
        
    except Exception as e:
        print(f"Erro ao criar dados de exemplo: {e}")

if __name__ == "__main__":
    print("=== Inicialização do Banco de Dados ===")
    if create_database():
        create_sample_data()
    print("Operação concluída.")
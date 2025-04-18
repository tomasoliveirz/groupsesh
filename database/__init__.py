import os
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

def init_app(app):
    """Inicializa a aplicação com a instância do banco de dados."""
    # Usar diretório instance dentro da aplicação, não caminhos absolutos
    instance_path = os.path.join(app.instance_path)
    
    # Garantir que o diretório instance exista
    if not os.path.exists(instance_path):
        os.makedirs(instance_path, exist_ok=True)
        print(f"Diretório de instância criado em: {instance_path}")
    
    # Extrair e verificar o caminho do banco de dados da configuração
    db_uri = app.config.get('SQLALCHEMY_DATABASE_URI', '')
    if db_uri.startswith('sqlite:///'):
        # Para SQLite, extrair o caminho do arquivo
        db_path = db_uri.replace('sqlite:///', '')
        
        # Se o caminho não for absoluto, considerar relativo ao instance_path
        if not os.path.isabs(db_path):
            db_path = os.path.join(instance_path, os.path.basename(db_path))
            # Atualizar a configuração com o novo caminho
            app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
        
        # Garantir que o diretório do banco de dados exista
        db_dir = os.path.dirname(db_path)
        if not os.path.exists(db_dir):
            os.makedirs(db_dir, exist_ok=True)
            print(f"Diretório do banco de dados criado em: {db_dir}")
        
        print(f"Caminho do banco de dados SQLite: {db_path}")
    else:
        print(f"Usando URI de banco de dados não-SQLite: {db_uri}")
    
    # Inicializar o banco de dados
    db.init_app(app)
    
    # Criar as tabelas dentro do contexto da aplicação
    with app.app_context():
        try:
            print("Tentando criar tabelas no banco de dados...")
            db.create_all()
            print("Tabelas criadas com sucesso!")
        except Exception as e:
            print(f"ERRO ao criar tabelas: {str(e)}")
            # Informações adicionais para diagnóstico
            print(f"Diretório atual: {os.getcwd()}")
            print(f"Config DATABASE_URL: {os.environ.get('DATABASE_URL')}")
            raise  # Re-lançar a exceção para não mascarar o erro
#!/bin/bash
# Script para configuração e execução rápida do GroupSesh

# Definir cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}===============================================${NC}"
echo -e "${BLUE}    GroupSesh - Sistema de Agendamento        ${NC}"
echo -e "${BLUE}===============================================${NC}"

# Verificar Python
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Erro: Python 3 não encontrado. Por favor, instale o Python 3.${NC}"
    exit 1
fi

# Verificar versão do Python
PYTHON_VERSION=$(python3 --version | cut -d " " -f 2)
PYTHON_MAJOR=$(echo $PYTHON_VERSION | cut -d. -f1)
PYTHON_MINOR=$(echo $PYTHON_VERSION | cut -d. -f2)

if [ "$PYTHON_MAJOR" -lt 3 ] || ([ "$PYTHON_MAJOR" -eq 3 ] && [ "$PYTHON_MINOR" -lt 8 ]); then
    echo -e "${RED}Erro: GroupSesh requer Python 3.8 ou superior. Versão atual: $PYTHON_VERSION${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Python $PYTHON_VERSION detectado${NC}"

# Criar ambiente virtual se não existir
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}Criando ambiente virtual...${NC}"
    python3 -m venv venv
    if [ $? -ne 0 ]; then
        echo -e "${RED}Erro ao criar ambiente virtual.${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Ambiente virtual criado${NC}"
else
    echo -e "${GREEN}✓ Ambiente virtual encontrado${NC}"
fi

# Ativar ambiente virtual
echo -e "${YELLOW}Ativando ambiente virtual...${NC}"
source venv/bin/activate
if [ $? -ne 0 ]; then
    echo -e "${RED}Erro ao ativar ambiente virtual.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Ambiente virtual ativado${NC}"

# Instalar dependências
echo -e "${YELLOW}Instalando dependências...${NC}"
pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo -e "${RED}Erro ao instalar dependências.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Dependências instaladas${NC}"

# Criar arquivo .env se não existir
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Criando arquivo .env...${NC}"
    cat > .env << EOF
SECRET_KEY=dev-key-change-in-production
FLASK_APP=app.py
FLASK_DEBUG=1
DATABASE_URL=sqlite:///instance/groupsesh.db
EOF
    echo -e "${GREEN}✓ Arquivo .env criado${NC}"
else
    echo -e "${GREEN}✓ Arquivo .env encontrado${NC}"
fi

# Carregar variáveis de ambiente
export FLASK_APP=app.py
export FLASK_DEBUG=1

# Compilar traduções
echo -e "${YELLOW}Compilando traduções...${NC}"
pybabel compile -d translations
if [ $? -ne 0 ]; then
    echo -e "${RED}Erro ao compilar traduções. Verificando se a estrutura existe...${NC}"
    
    # Verificar se o diretório existe, se não, criar estrutura básica
    if [ ! -d "translations" ]; then
        echo -e "${YELLOW}Criando estrutura básica de traduções...${NC}"
        mkdir -p translations/en/LC_MESSAGES
        mkdir -p translations/pt_BR/LC_MESSAGES
        
        # Criar mensagens.pot se não existir
        echo -e "${YELLOW}Extraindo strings para tradução...${NC}"
        pybabel extract -F babel.cfg -k _l -o translations/messages.pot .
        
        # Inicializar traduções básicas
        pybabel init -i translations/messages.pot -d translations -l en
        pybabel init -i translations/messages.pot -d translations -l pt_BR
        
        # Tentar compilar novamente
        echo -e "${YELLOW}Compilando traduções novamente...${NC}"
        pybabel compile -d translations
        if [ $? -ne 0 ]; then
            echo -e "${RED}Erro ao compilar traduções. Continuando sem traduções.${NC}"
        else
            echo -e "${GREEN}✓ Traduções compiladas${NC}"
        fi
    else
        echo -e "${RED}Pasta de traduções existe, mas houve erro na compilação. Continuando sem traduções.${NC}"
    fi
else
    echo -e "${GREEN}✓ Traduções compiladas${NC}"
fi

# Verificar se o banco de dados existe, caso contrário inicializar
if [ ! -f "instance/groupsesh.db" ]; then
    echo -e "${YELLOW}Inicializando banco de dados...${NC}"
    
    # Garantir que o diretório instance exista
    mkdir -p instance
    chmod 777 instance
    
    # Executar script de inicialização
    python scripts/init_db.py
    if [ $? -ne 0 ]; then
        echo -e "${RED}Erro ao inicializar banco de dados.${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Banco de dados inicializado${NC}"
else
    echo -e "${GREEN}✓ Banco de dados encontrado${NC}"
fi

# Executar a aplicação
echo -e "${BLUE}===============================================${NC}"
echo -e "${GREEN}Iniciando GroupSesh...${NC}"
echo -e "${BLUE}===============================================${NC}"
echo -e "${YELLOW}A aplicação estará disponível em:${NC}"
echo -e "${BLUE}http://localhost:5000${NC}"
echo -e "${YELLOW}Para acessar com idioma específico:${NC}"
echo -e "${BLUE}http://localhost:5000/en/ (Inglês)${NC}"
echo -e "${BLUE}http://localhost:5000/pt-br/ (Português Brasil)${NC}"
echo -e "${BLUE}http://localhost:5000/pt-pt/ (Português Portugal)${NC}"
echo -e "${BLUE}http://localhost:5000/es/ (Espanhol)${NC}"
echo -e "${BLUE}http://localhost:5000/de/ (Alemão)${NC}"
echo -e "${BLUE}http://localhost:5000/fr/ (Francês)${NC}"
echo -e "${BLUE}http://localhost:5000/it/ (Italiano)${NC}"
echo -e "${BLUE}===============================================${NC}"
echo -e "${YELLOW}Pressione Ctrl+C para encerrar${NC}"
echo -e "${BLUE}===============================================${NC}"

# Executar a aplicação
flask run --host=0.0.0.0
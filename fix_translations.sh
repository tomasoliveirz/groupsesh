#!/bin/bash
# Script para corrigir problemas de tradução no GroupSesh

# Definir cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=============================================${NC}"
echo -e "${BLUE}   Correção do Sistema de Traduções GroupSesh   ${NC}"
echo -e "${BLUE}=============================================${NC}"

# Instalar setuptools e wheel (necessários para pybabel)
echo -e "${YELLOW}Instalando dependências para traduções...${NC}"
pip install setuptools wheel

# Criar estrutura de diretórios para traduções
echo -e "${YELLOW}Criando estrutura de diretórios para traduções...${NC}"
mkdir -p translations/en/LC_MESSAGES
mkdir -p translations/pt_BR/LC_MESSAGES
mkdir -p translations/pt_PT/LC_MESSAGES
mkdir -p translations/es/LC_MESSAGES
mkdir -p translations/fr/LC_MESSAGES
mkdir -p translations/de/LC_MESSAGES
mkdir -p translations/it/LC_MESSAGES

# Criar babel.cfg se não existir
if [ ! -f "babel.cfg" ]; then
    echo -e "${YELLOW}Criando arquivo babel.cfg...${NC}"
    cat > babel.cfg << EOF
[python: **.py]
[jinja2: **/templates/**.html]
extensions=jinja2.ext.autoescape,jinja2.ext.with_
EOF
fi

# Extrair mensagens para tradução
echo -e "${YELLOW}Extraindo mensagens para tradução...${NC}"
pybabel extract -F babel.cfg -k _l -o translations/messages.pot .

# Iniciar traduções para cada idioma se não existirem os arquivos .po
if [ ! -f "translations/en/LC_MESSAGES/messages.po" ]; then
    echo -e "${YELLOW}Iniciando tradução para inglês...${NC}"
    pybabel init -i translations/messages.pot -d translations -l en
fi

if [ ! -f "translations/pt_BR/LC_MESSAGES/messages.po" ]; then
    echo -e "${YELLOW}Iniciando tradução para português do Brasil...${NC}"
    pybabel init -i translations/messages.pot -d translations -l pt_BR
fi

if [ ! -f "translations/pt_PT/LC_MESSAGES/messages.po" ]; then
    echo -e "${YELLOW}Iniciando tradução para português de Portugal...${NC}"
    pybabel init -i translations/messages.pot -d translations -l pt_PT
fi

if [ ! -f "translations/es/LC_MESSAGES/messages.po" ]; then
    echo -e "${YELLOW}Iniciando tradução para espanhol...${NC}"
    pybabel init -i translations/messages.pot -d translations -l es
fi

if [ ! -f "translations/fr/LC_MESSAGES/messages.po" ]; then
    echo -e "${YELLOW}Iniciando tradução para francês...${NC}"
    pybabel init -i translations/messages.pot -d translations -l fr
fi

if [ ! -f "translations/de/LC_MESSAGES/messages.po" ]; then
    echo -e "${YELLOW}Iniciando tradução para alemão...${NC}"
    pybabel init -i translations/messages.pot -d translations -l de
fi

if [ ! -f "translations/it/LC_MESSAGES/messages.po" ]; then
    echo -e "${YELLOW}Iniciando tradução para italiano...${NC}"
    pybabel init -i translations/messages.pot -d translations -l it
fi

# Se as traduções já existem, atualizá-las
if [ -f "translations/en/LC_MESSAGES/messages.po" ]; then
    echo -e "${YELLOW}Atualizando traduções existentes...${NC}"
    pybabel update -i translations/messages.pot -d translations
fi

# Compilar as traduções
echo -e "${YELLOW}Compilando traduções...${NC}"
pybabel compile -d translations

echo -e "${GREEN}Processo de tradução concluído com sucesso!${NC}"
echo -e "${BLUE}=============================================${NC}"
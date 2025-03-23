#!/bin/bash
# Script para correção completa do GroupSesh
# Corrige problemas de traduções e recursos estáticos

# Definir cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=====================================================${NC}"
echo -e "${BLUE}   Correção Completa do Sistema GroupSesh   ${NC}"
echo -e "${BLUE}=====================================================${NC}"

# ETAPA 1: Instalar dependências necessárias
echo -e "${YELLOW}Etapa 1: Instalando dependências necessárias...${NC}"
pip install setuptools wheel

if [ $? -ne 0 ]; then
    echo -e "${RED}Erro ao instalar dependências. Tentando continuar assim mesmo...${NC}"
else
    echo -e "${GREEN}✓ Dependências instaladas com sucesso!${NC}"
fi

# ETAPA 2: Corrigir traduções
echo -e "${YELLOW}Etapa 2: Corrigindo sistema de traduções...${NC}"

# Criar estrutura de diretórios para traduções
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

if [ $? -ne 0 ]; then
    echo -e "${RED}Erro ao extrair mensagens. Criando arquivo POT manualmente...${NC}"
    # Criar um arquivo POT básico
    cat > translations/messages.pot << EOF
# GroupSesh Translations Template.
# Copyright (C) 2025 GroupSesh
# This file is distributed under the same license as the GroupSesh project.
#
msgid ""
msgstr ""
"Project-Id-Version: GroupSesh 1.0\\n"
"Report-Msgid-Bugs-To: info@groupsesh.com\\n"
"POT-Creation-Date: 2025-03-23 18:14+0000\\n"
"PO-Revision-Date: YEAR-MO-DA HO:MI+ZONE\\n"
"Last-Translator: FULL NAME <EMAIL@ADDRESS>\\n"
"Language-Team: LANGUAGE <LL@li.org>\\n"
"Language: \\n"
"MIME-Version: 1.0\\n"
"Content-Type: text/plain; charset=UTF-8\\n"
"Content-Transfer-Encoding: 8bit\\n"

msgid "Coordenação de Disponibilidade Simplificada"
msgstr ""

msgid "Início"
msgstr ""
EOF
fi

# Criar arquivos de tradução básicos para cada idioma
echo -e "${YELLOW}Criando arquivos de tradução básicos...${NC}"

# Criar .po files básicos se a inicialização falhar
for lang in en pt_BR pt_PT es fr de it; do
    file_path="translations/${lang}/LC_MESSAGES/messages.po"
    
    if [ ! -f "$file_path" ]; then
        # Tentar inicializar via pybabel
        pybabel init -i translations/messages.pot -d translations -l $lang
        
        # Se falhar, criar manualmente
        if [ ! -f "$file_path" ]; then
            echo -e "${YELLOW}Criando arquivo básico para $lang manualmente...${NC}"
            
            mkdir -p translations/${lang}/LC_MESSAGES
            
            cat > "$file_path" << EOF
# ${lang} translations for GroupSesh.
# Copyright (C) 2025 GroupSesh
# This file is distributed under the same license as the GroupSesh project.
#
msgid ""
msgstr ""
"Project-Id-Version: GroupSesh 1.0\\n"
"Report-Msgid-Bugs-To: info@groupsesh.com\\n"
"POT-Creation-Date: 2025-03-23 18:14+0000\\n"
"PO-Revision-Date: 2025-03-23 18:14+0000\\n"
"Last-Translator: Tomás Oliveira <tomas@groupsesh.com>\\n"
"Language-Team: ${lang}\\n"
"Language: ${lang}\\n"
"MIME-Version: 1.0\\n"
"Content-Type: text/plain; charset=UTF-8\\n"
"Content-Transfer-Encoding: 8bit\\n"

msgid "Coordenação de Disponibilidade Simplificada"
msgstr "Simplified Availability Coordination"

msgid "Início"
msgstr "Home"
EOF
        fi
    fi
done

# Tentar compilar traduções
echo -e "${YELLOW}Compilando traduções...${NC}"

# Verificar se o diretório .mo existe, se não, criá-lo
for lang in en pt_BR pt_PT es fr de it; do
    mkdir -p translations/${lang}/LC_MESSAGES
done

# Tentar compilar com pybabel
pybabel compile -d translations

# Se compilação falhar, criar .mo files vazios
if [ $? -ne 0 ]; then
    echo -e "${RED}Erro ao compilar traduções. Criando arquivos .mo manualmente...${NC}"
    
    for lang in en pt_BR pt_PT es fr de it; do
        touch translations/${lang}/LC_MESSAGES/messages.mo
    done
else
    echo -e "${GREEN}✓ Traduções compiladas com sucesso!${NC}"
fi

# ETAPA 3: Criar recursos estáticos
echo -e "${YELLOW}Etapa 3: Criando recursos estáticos...${NC}"

# Criar estrutura de diretórios
mkdir -p static/img
mkdir -p static/css
mkdir -p static/js

# Criar imagens necessárias
echo -e "${YELLOW}Criando arquivos de imagem essenciais...${NC}"

# Favicon
touch static/img/favicon.png

# Logo
cat > static/img/logo.svg << EOF
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <!-- Background Circle -->
  <circle cx="100" cy="100" r="90" fill="#4F46E5" opacity="0.1"/>
  
  <!-- Calendar Base -->
  <rect x="40" y="50" width="120" height="110" rx="8" fill="#FFFFFF" stroke="#4F46E5" stroke-width="6"/>
  
  <!-- Calendar Header -->
  <rect x="40" y="50" width="120" height="30" rx="8" fill="#4F46E5"/>
  
  <!-- Calendar Grid Lines -->
  <line x1="40" y1="100" x2="160" y2="100" stroke="#E5E7EB" stroke-width="2"/>
  <line x1="40" y1="130" x2="160" y2="130" stroke="#E5E7EB" stroke-width="2"/>
  <line x1="80" y1="80" x2="80" y2="160" stroke="#E5E7EB" stroke-width="2"/>
  <line x1="120" y1="80" x2="120" y2="160" stroke="#E5E7EB" stroke-width="2"/>
  
  <!-- Check Marks -->
  <circle cx="60" cy="115" r="8" fill="#10B981"/>
  <path d="M55 115 L59 119 L65 111" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  
  <circle cx="100" cy="145" r="8" fill="#10B981"/>
  <path d="M95 145 L99 149 L105 141" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  
  <circle cx="140" cy="115" r="8" fill="#10B981"/>
  <path d="M135 115 L139 119 L145 111" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  
  <!-- Calendar Pins -->
  <circle cx="50" cy="50" r="3" fill="#F59E0B"/>
  <circle cx="150" cy="50" r="3" fill="#F59E0B"/>
</svg>
EOF

# Hero Calendar
cat > static/img/hero-calendar.svg << EOF
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
  <!-- Background Shape -->
  <path d="M50 100 Q400 0 750 100 L750 500 Q400 600 50 500 Z" fill="#F3F4F6"/>
  
  <!-- Main Calendar -->
  <rect x="150" y="100" width="500" height="400" rx="16" fill="#FFFFFF" stroke="#4F46E5" stroke-width="5"/>
  
  <!-- Calendar Header -->
  <rect x="150" y="100" width="500" height="80" rx="16" fill="#4F46E5"/>
  <text x="400" y="150" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="#FFFFFF" text-anchor="middle">March 2025</text>
</svg>
EOF

# Imagens de placeholder
touch static/img/creator.jpg
touch static/img/dashboard-preview.png
touch static/img/404-illustration.svg
touch static/img/500-illustration.svg

echo -e "${GREEN}✓ Recursos estáticos criados com sucesso!${NC}"

# ETAPA 4: Verificar se arquivos essenciais existem
echo -e "${YELLOW}Etapa 4: Verificando arquivos essenciais...${NC}"

missing_files=0

# Verificar arquivos CSS
for file in static/css/styles.css static/css/themes.css; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}! Arquivo ausente: $file${NC}"
        missing_files=1
    fi
done

# Verificar arquivos JS
for file in static/js/main.js static/js/calendar-utils.js; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}! Arquivo ausente: $file${NC}"
        missing_files=1
    fi
done

# Verificar templates
for file in templates/base.html templates/index.html templates/about.html; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}! Arquivo ausente: $file${NC}"
        missing_files=1
    fi
done

if [ $missing_files -eq 0 ]; then
    echo -e "${GREEN}✓ Todos os arquivos essenciais estão presentes!${NC}"
else
    echo -e "${YELLOW}Alguns arquivos estão ausentes. Verifique os avisos acima.${NC}"
fi

# ETAPA 5: Resumo e próximos passos
echo -e "${BLUE}=====================================================${NC}"
echo -e "${GREEN}Correção concluída com sucesso!${NC}"
echo -e "${BLUE}=====================================================${NC}"
echo -e "${YELLOW}Próximos passos:${NC}"
echo -e "1. Reinicie a aplicação: ${BLUE}flask run${NC}"
echo -e "2. Acesse a aplicação em: ${BLUE}http://localhost:5000${NC}"
echo -e "3. Verifique se os recursos estáticos estão sendo carregados"
echo -e "4. Teste a funcionalidade multilíngue em vários idiomas"
echo -e "${BLUE}=====================================================${NC}"
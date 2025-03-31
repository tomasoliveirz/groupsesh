#!/usr/bin/env bash
# Script de build para o Render

# Sair em caso de erro
set -o errexit

# Criar diretório de instance se não existir
mkdir -p instance
chmod 777 instance

# Inicializar o banco de dados
python -c "from app import app, db; app.app_context().push(); db.create_all()"

# Se você precisar executar migrações ou outros comandos de inicialização, adicione aqui

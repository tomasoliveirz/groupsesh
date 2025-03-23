#!/bin/bash
# Script para backup do banco de dados SQLite

# Configuração
BACKUP_DIR="./backups"
DB_PATH="./instance/availability_survey.db"
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/backup_${DATE}.db"
KEEP_DAYS=30

# Criar diretório de backup se não existir
mkdir -p "$BACKUP_DIR"

# Verificar se o banco de dados existe
if [ ! -f "$DB_PATH" ]; then
    echo "Erro: Banco de dados não encontrado em $DB_PATH"
    exit 1
fi

# Realizar backup (utilizando sqlite3 para garantir que o banco esteja consistente)
echo "Criando backup em $BACKUP_FILE..."
sqlite3 "$DB_PATH" ".backup '$BACKUP_FILE'"

# Comprimir o backup
echo "Comprimindo backup..."
gzip "$BACKUP_FILE"

# Remover backups antigos
echo "Removendo backups mais antigos que $KEEP_DAYS dias..."
find "$BACKUP_DIR" -name "backup_*.db.gz" -type f -mtime +$KEEP_DAYS -delete

echo "Backup concluído com sucesso!"
echo "Arquivo: ${BACKUP_FILE}.gz"

# Listar os backups existentes
echo -e "\nBackups disponíveis:"
ls -lh "$BACKUP_DIR" | grep "backup_"
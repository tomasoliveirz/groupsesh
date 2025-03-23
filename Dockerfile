FROM python:3.10-slim

# Definir variáveis de ambiente
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV FLASK_APP=app.py
ENV FLASK_ENV=production

# Configuração para que o SQLite funcione corretamente em um container
ENV SQLITE_USE_MEMORY=0

# Criar diretório de trabalho
WORKDIR /app

# Instalar dependências
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install gunicorn

# Copiar código-fonte
COPY . .

# Criar pasta para banco de dados e definir permissões
RUN mkdir -p /app/instance
RUN chmod -R 777 /app/instance

# Expor porta
EXPOSE 8000

# Iniciar Gunicorn com configurações de produção
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "4", "--timeout", "120", "app:app"]
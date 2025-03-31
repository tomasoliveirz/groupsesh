import os

# Bindar ao endereço 0.0.0.0 para permitir conexões externas
bind = f"0.0.0.0:{os.environ.get('PORT', '8000')}"

# Configuração de workers para balancear carga
workers = 2  # Pode ajustar conforme necessário, geralmente (2*CPU)+1
worker_class = "sync"  # Pode usar uvicorn.workers.UvicornWorker se necessitar async
timeout = 120  # Tempo limite em segundos

# Configuração de logging
accesslog = "-"  # stdout
errorlog = "-"   # stderr
loglevel = "info"

# Configurações adicionais
max_requests = 1000
max_requests_jitter = 50

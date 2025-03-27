from oauthlib.oauth2 import WebApplicationClient
import requests
import json
import logging

# Variáveis globais para controle do estado da autenticação Google
google_client = None
google_enabled = False

def init_oauth(app):
    """
    Inicializa o cliente OAuth para autenticação com Google.
    
    Este método verifica a presença das credenciais do Google e,
    caso existam, configura o cliente OAuth. Se as credenciais
    estiverem ausentes ou forem inválidas, o sistema continuará
    funcionando, mas com a autenticação do Google desativada.
    """
    global google_client, google_enabled
    
    # Configurar cliente OAuth apenas se as credenciais estiverem configuradas
    google_client_id = app.config.get('GOOGLE_CLIENT_ID')
    google_client_secret = app.config.get('GOOGLE_CLIENT_SECRET')
    
    if google_client_id and google_client_secret and len(google_client_id) > 0 and len(google_client_secret) > 0:
        try:
            google_client = WebApplicationClient(google_client_id)
            google_enabled = True
            app.logger.info("Google OAuth configurado com sucesso")
        except Exception as e:
            app.logger.error(f"Erro ao configurar Google OAuth: {str(e)}")
            google_enabled = False
    else:
        app.logger.warning("Google OAuth não configurado - chaves de API ausentes")
        google_enabled = False

def get_google_provider_cfg():
    """
    Obtém a configuração do provedor OAuth do Google.
    
    Retorna None se a autenticação do Google não estiver habilitada
    ou se ocorrer algum erro na comunicação com os servidores do Google.
    """
    if not google_enabled:
        return None
        
    try:
        google_discovery_url = "https://accounts.google.com/.well-known/openid-configuration"
        return requests.get(google_discovery_url).json()
    except Exception as e:
        logging.error(f"Erro ao obter configuração do Google: {str(e)}")
        return None
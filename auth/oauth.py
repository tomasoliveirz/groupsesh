# Arquivo: auth/oauth.py
"""
Módulo OAuth para autenticação com serviços externos.
Atualmente em modo standby - será implementado posteriormente.
"""

# Variável para verificar se o OAuth está habilitado
google_enabled = False
google_client = None

def init_oauth(app):
    """
    Inicializa as configurações OAuth.
    Atualmente retorna False para indicar que o OAuth está desabilitado.
    """
    global google_enabled
    
    # Verificar se as credenciais do Google estão configuradas
    if app.config.get('GOOGLE_CLIENT_ID') and app.config.get('GOOGLE_CLIENT_SECRET'):
        # Em standby - não inicializar agora
        app.logger.info("OAuth Google configurado mas em standby.")
        google_enabled = False
    
    return False

def get_google_provider_cfg():
    """Função placeholder para obtenção de configuração do Google."""
    return None
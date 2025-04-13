"""
Pacote para gerenciamento de perfis de usuário.
Exporta o blueprint de perfil para uso na aplicação principal.
"""

from .routes import profile_bp

# Só exporta o blueprint, mas NÃO registra no 'app'
# O registro será feito em app.py
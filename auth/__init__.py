from flask_login import LoginManager
from translations.config import _

login_manager = LoginManager()

def init_app(app):
    """
    Initialize the authentication module and configure Flask-Login.
    
    This method configures the auth system, including:
    1. Initializing the login manager
    2. Configuring Google OAuth (when available)
    3. Registering the auth blueprint
    4. Setting up the user loader
    """
    # Initialize login manager
    login_manager.init_app(app)
    
    # Import here to avoid circular imports
    from auth.oauth import init_oauth
    
    # Initialize OAuth (won't cause errors if credentials don't exist)
    init_oauth(app)
    
    # Set up login manager configuration
    login_manager.login_view = 'auth.login'
    login_manager.login_message = _('Por favor, faça login para acessar esta página.')
    login_manager.login_message_category = 'info'
    
    # Configure the user loader for Flask-Login
    @login_manager.user_loader
    def load_user(user_id):
        from database.models import User
        return User.query.get(int(user_id))
    
    # Custom unauthorized handler that preserves language codes
    @login_manager.unauthorized_handler
    def unauthorized():
        """Custom unauthorized handler that preserves language codes"""
        from flask import request, redirect, url_for, g, flash
        from translations.config import DEFAULT_LANGUAGE
        
        # Get current language code
        lang_code = g.get('lang_code', DEFAULT_LANGUAGE)
        
        # Create login URL with language code and next parameter
        login_url = url_for('auth.login', lang_code=lang_code, next=request.path)
        
        # Add flash message if configured
        if login_manager.login_message:
            flash(login_manager.login_message, category=login_manager.login_message_category)
        
        # Redirect to login page
        return redirect(login_url)
    
    # Make OAuth status available to templates
    @app.context_processor
    def inject_oauth_status():
        from auth.oauth import google_enabled
        return dict(google_oauth_enabled=google_enabled)
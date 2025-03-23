"""
Internationalization configuration for GroupSesh.
This module defines supported languages and provides utility functions for translations.
"""

import os
from flask_babel import Babel, gettext, lazy_gettext
from flask import request, session, g

# Definition of supported languages
LANGUAGES = {
    'en': {
        'name': 'English',
        'native_name': 'English',
        'flag': 'us',
        'babel_locale': 'en'
    },
    'pt-pt': {
        'name': 'Portuguese (Portugal)',
        'native_name': 'Português (Portugal)',
        'flag': 'pt',
        'babel_locale': 'pt_PT'
    },
    'pt-br': {
        'name': 'Portuguese (Brazil)',
        'native_name': 'Português (Brasil)',
        'flag': 'br',
        'babel_locale': 'pt_BR'
    },
    'es': {
        'name': 'Spanish',
        'native_name': 'Español',
        'flag': 'es',
        'babel_locale': 'es'
    },
    'de': {
        'name': 'German',
        'native_name': 'Deutsch',
        'flag': 'de',
        'babel_locale': 'de'
    },
    'fr': {
        'name': 'French',
        'native_name': 'Français',
        'flag': 'fr',
        'babel_locale': 'fr'
    },
    'it': {
        'name': 'Italian',
        'native_name': 'Italiano',
        'flag': 'it',
        'babel_locale': 'it'
    },
}

# Default language (changed to English)
DEFAULT_LANGUAGE = 'en'

# Aliases to simplify importing
_ = gettext
_l = lazy_gettext


def get_locale():
    """
    Determines the language to use based on URL or browser preferences.
    
    URL format: /{lang_code}/rest/of/path
    For example: /pt-br/create-survey
    
    Returns:
        str: Locale code for Babel (e.g. 'pt_BR', 'en')
    """
    # Check if language is defined in URL 
    if hasattr(g, 'lang_code') and g.lang_code in LANGUAGES:
        session['language'] = g.lang_code
        return LANGUAGES[g.lang_code]['babel_locale']
    
    # Check if language is in session
    if 'language' in session and session['language'] in LANGUAGES:
        return LANGUAGES[session['language']]['babel_locale']
    
    # Check browser's Accept-Languages
    preferred = request.accept_languages.best_match(
        [lang['babel_locale'] for lang in LANGUAGES.values()]
    ) if request and hasattr(request, 'accept_languages') else None
    
    # Map Babel locale back to our language code
    if preferred:
        for code, lang in LANGUAGES.items():
            if lang['babel_locale'] == preferred:
                return lang['babel_locale']
    
    # Use default language
    return LANGUAGES[DEFAULT_LANGUAGE]['babel_locale']


def init_babel(app):
    """
    Initializes Babel for internationalization.
    
    Args:
        app: The Flask instance
    
    Returns:
        Babel: Configured Babel instance
    """
    babel = Babel(app, locale_selector=get_locale)
    
    # Add supported languages to template context
    @app.context_processor
    def inject_languages():
        current_lang = get_current_language_code()
        return {'languages': LANGUAGES, 'language_code': current_lang}
    
    return babel


def get_current_language_code():
    """
    Gets the current language code (our format, not Babel's).
    
    Returns:
        str: Language code (e.g. 'pt-br', 'en')
    """
    # Check in g object first (from URL)
    if hasattr(g, 'lang_code') and g.lang_code in LANGUAGES:
        return g.lang_code
    
    # Check in session
    if 'language' in session and session['language'] in LANGUAGES:
        return session['language']
    
    # Try to get from browser preferences
    preferred = request.accept_languages.best_match(
        [lang['babel_locale'] for lang in LANGUAGES.values()]
    ) if request and hasattr(request, 'accept_languages') else None
    
    if preferred:
        for code, lang in LANGUAGES.items():
            if lang['babel_locale'] == preferred:
                return code
    
    return DEFAULT_LANGUAGE
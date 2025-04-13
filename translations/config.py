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

# Default language
DEFAULT_LANGUAGE = 'en'

# Aliases to simplify importing
_ = gettext
_l = lazy_gettext

# Mapping between URL language codes and Babel locales
# This is a critical mapping to ensure proper language loading
URL_TO_BABEL_LOCALE = {
    'en': 'en',
    'pt-pt': 'pt_PT',
    'pt-br': 'pt_BR',
    'es': 'es',
    'de': 'de',
    'fr': 'fr',
    'it': 'it'
}

# Reverse mapping from Babel locale to URL language code
BABEL_LOCALE_TO_URL = {
    'en': 'en',
    'pt_PT': 'pt-pt',
    'pt_BR': 'pt-br',
    'es': 'es',
    'de': 'de',
    'fr': 'fr',
    'it': 'it'
}


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
        # Get the corresponding Babel locale code
        babel_locale = URL_TO_BABEL_LOCALE.get(g.lang_code, DEFAULT_LANGUAGE)
        return babel_locale
    
    # Check if language is in session
    if 'language' in session and session['language'] in LANGUAGES:
        # Get the corresponding Babel locale code
        babel_locale = URL_TO_BABEL_LOCALE.get(session['language'], DEFAULT_LANGUAGE)
        return babel_locale
    
    # Check browser's Accept-Languages
    supported_locales = [lang for lang in URL_TO_BABEL_LOCALE.values()]
    preferred = request.accept_languages.best_match(supported_locales)
    
    # Return preferred locale or default
    if preferred:
        return preferred
    
    # Use default language
    return URL_TO_BABEL_LOCALE[DEFAULT_LANGUAGE]


def get_locale_with_logging():
    """
    Wrapper for get_locale() that adds debug logging.
    """
    locale = get_locale()
    print(f"DEBUG - Using locale: {locale}, current URL: {request.path}")
    return locale


def init_babel(app):
    """
    Initializes Babel for internationalization.
    
    Args:
        app: The Flask instance
    
    Returns:
        Babel: Configured Babel instance
    """
    # Configure babel with the appropriate locale selector function
    # Use the logging version in debug mode, otherwise use the regular version
    locale_selector = get_locale_with_logging if app.debug else get_locale
    babel = Babel(app, locale_selector=locale_selector)
    
    # Add supported languages to template context
    @app.context_processor
    def inject_languages():
        current_lang = get_current_language_code()
        return {
            'languages': LANGUAGES, 
            'language_code': current_lang,
            'DEFAULT_LANGUAGE': DEFAULT_LANGUAGE
        }
    
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
    
    # If we have a locale from Babel, convert it to our URL format
    locale = get_locale()
    if locale in BABEL_LOCALE_TO_URL:
        return BABEL_LOCALE_TO_URL[locale]
    
    return DEFAULT_LANGUAGE
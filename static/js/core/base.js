(function() {
    'use strict';

    window.GroupSesh = window.GroupSesh || {};
    window.GroupSesh.Core = window.GroupSesh.Core || {};

    if (GroupSesh.Core.Base) {
        console.log('GroupSesh.Core.Base já existente, usando versão atual');
        return;
    }

    const Base = {
        /**
         * Retorna o locale atual (ex: 'en', 'pt-BR')
         */
        getCurrentLocale() {
            return window.APP_CONFIG?.language 
                || document.documentElement.lang 
                || 'en';
        },

        /**
         * Verifica se o idioma atual é inglês
         */
        isEnglishLocale() {
            // Pega as 2 primeiras letras e compara
            return this.getCurrentLocale().substring(0, 2) === 'en';
        },

        /**
         * Gera um ID único (caso precise)
         */
        generateUniqueId(prefix = '') {
            const randPart = Math.random().toString(36).substring(2, 8);
            return `${prefix}${Date.now().toString(36)}${randPart}`;
        }
    };

    window.GroupSesh.Core.Base = Base;
    console.log('Base inicializado com sucesso');
})();

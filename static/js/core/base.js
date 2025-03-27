/**
 * base.js - Core de inicialização para aplicação
 */
(function() {
    'use strict';
    
    // Inicialização defensiva do namespace
    window.GroupSesh = window.GroupSesh || {};
    window.GroupSesh.Core = window.GroupSesh.Core || {};
    
    // Evitar redefinição do módulo Base
    if (GroupSesh.Core.Base) {
        console.log('GroupSesh.Core.Base já existente, utilizando versão atual');
        return;
    }
    
    /**
     * Módulo Base com funções fundamentais
     */
    const Base = {
        getCurrentLocale: function() {
            return window.APP_CONFIG?.language || 
                   document.documentElement.lang || 
                   'pt-BR';
        },
        
        isEnglishLocale: function() {
            return this.getCurrentLocale().startsWith('en');
        }
    };
    
    // Exportar para namespace estruturado
    GroupSesh.Core.Base = Base;
    
    console.log('Base inicializado com sucesso');
})();
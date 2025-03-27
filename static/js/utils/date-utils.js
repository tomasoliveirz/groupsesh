/**
 * Patch para date-utils.js com verificação de dependências
 */
(function() {
    'use strict';
    
    // Verificar se o módulo Base existe
    if (!window.GroupSesh || !window.GroupSesh.Core || !window.GroupSesh.Core.Base) {
        console.warn('GroupSesh.Core.Base não encontrado, criando versão minimal');
        
        // Criar namespace necessário
        window.GroupSesh = window.GroupSesh || {};
        window.GroupSesh.Core = window.GroupSesh.Core || {};
        
        // Implementar objeto Base minimal
        GroupSesh.Core.Base = {
            getCurrentLocale: function() {
                return document.documentElement.lang || 'pt-BR';
            },
            
            isEnglishLocale: function() {
                const locale = this.getCurrentLocale();
                return locale.startsWith('en');
            }
        };
    }
    
    // Função de inicialização segura para calendário
    const safeInitCalendar = function(element, options = {}) {
        if (!element) {
            console.error('Elemento do calendário não encontrado');
            return null;
        }
        
        try {
            // Obter locale de forma segura
            let locale;
            let isEnglish;
            
            try {
                locale = GroupSesh.Core.Base.getCurrentLocale();
                isEnglish = GroupSesh.Core.Base.isEnglishLocale();
            } catch (e) {
                console.warn('Erro ao acessar Base.getCurrentLocale(), usando fallback:', e);
                locale = document.documentElement.lang || 'pt-BR';
                isEnglish = locale.startsWith('en');
            }
            
            // Opções padrão com fallback seguro
            const defaultOptions = {
                initialView: 'dayGridMonth',
                initialDate: new Date(),
                headerToolbar: {
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth'
                },
                views: {
                    dayGridMonth: {
                        buttonText: isEnglish ? 'Month' : 'Mês'
                    }
                },
                locale: locale.substring(0, 2),
                height: 'auto'
            };
            
            // Mesclar opções
            const mergedOptions = Object.assign({}, defaultOptions, options);
            
            // Verificar disponibilidade do FullCalendar
            if (!window.FullCalendar || !FullCalendar.Calendar) {
                throw new Error('FullCalendar não disponível');
            }
            
            // Criar e renderizar calendário
            const calendar = new FullCalendar.Calendar(element, mergedOptions);
            calendar.render();
            
            return calendar;
        } catch (error) {
            console.error('Erro crítico na inicialização do calendário:', error);
            return null;
        }
    };
    
    // Substituir ou disponibilizar a função de inicialização segura
    if (window.GroupSesh && window.GroupSesh.Utils && window.GroupSesh.Utils.DateUtils) {
        // Backup da função original para referência
        const originalInitCalendar = GroupSesh.Utils.DateUtils.initCalendar;
        
        // Substituir com versão segura
        GroupSesh.Utils.DateUtils.initCalendar = function(element, options) {
            try {
                return originalInitCalendar(element, options);
            } catch (error) {
                console.warn('Erro na função original initCalendar, utilizando versão segura:', error);
                return safeInitCalendar(element, options);
            }
        };
    } else {
        // Criar namespace se necessário
        window.GroupSesh = window.GroupSesh || {};
        window.GroupSesh.Utils = window.GroupSesh.Utils || {};
        
        // Criar DateUtils minimal se não existir
        GroupSesh.Utils.DateUtils = GroupSesh.Utils.DateUtils || {
            isPastDate: function(date) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                const checkDate = date instanceof Date ? date : new Date(date);
                checkDate.setHours(0, 0, 0, 0);
                
                return checkDate < today;
            },
            
            initCalendar: safeInitCalendar
        };
    }
    
    // Caso date-utils.js não tenha definido DateUtils global
    if (!window.DateUtils) {
        window.DateUtils = {
            initCalendar: GroupSesh.Utils.DateUtils.initCalendar,
            isPastDate: GroupSesh.Utils.DateUtils.isPastDate
        };
    }
    
    console.log('Patch para DateUtils aplicado com sucesso');
})();
/**
 * Patch para date-utils.js com verificação de dependências
 * Adiciona safeInitCalendar, formatDate, sortDates, e fallback para Base.isEnglishLocale()
 */
(function() {
    'use strict';
    
    // =========================================================
    // 1) Garantir que GroupSesh.Core.Base exista e tenha isEnglishLocale
    // =========================================================
    if (!window.GroupSesh || !window.GroupSesh.Core || !window.GroupSesh.Core.Base) {
        console.warn('GroupSesh.Core.Base não encontrado, criando versão minimal');
        
        // Criar namespace necessário
        window.GroupSesh = window.GroupSesh || {};
        window.GroupSesh.Core = window.GroupSesh.Core || {};
        
        // Implementar objeto Base minimal
        window.GroupSesh.Core.Base = {
            getCurrentLocale: function() {
                return document.documentElement.lang || 'pt-BR';
            },
            
            isEnglishLocale: function() {
                const locale = this.getCurrentLocale();
                return locale.startsWith('en');
            }
        };
    } else {
        // Se já existe Base, mas não tiver isEnglishLocale, definimos
        if (typeof window.GroupSesh.Core.Base.isEnglishLocale !== 'function') {
            console.warn('GroupSesh.Core.Base existe, mas isEnglishLocale() não definido. Criando fallback.');
            window.GroupSesh.Core.Base.isEnglishLocale = function() {
                const locale = this.getCurrentLocale();
                return locale.startsWith('en');
            };
        }
    }
    
    // =========================================================
    // 2) Função de inicialização segura para calendário
    // =========================================================
    const safeInitCalendar = function(element, options = {}) {
        if (!element) {
            console.error('Elemento do calendário não encontrado');
            return null;
        }
        
        try {
            let locale;
            let isEnglish;
            
            try {
                locale = window.GroupSesh.Core.Base.getCurrentLocale();
                isEnglish = window.GroupSesh.Core.Base.isEnglishLocale();
            } catch (e) {
                console.warn('Erro ao acessar Base.getCurrentLocale(), usando fallback:', e);
                locale = document.documentElement.lang || 'pt-BR';
                isEnglish = locale.startsWith('en');
            }
            
            // Opções padrão
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
            
            // Verificar FullCalendar
            if (!window.FullCalendar || !FullCalendar.Calendar) {
                throw new Error('FullCalendar não disponível');
            }
            
            const mergedOptions = Object.assign({}, defaultOptions, options);
            const calendar = new FullCalendar.Calendar(element, mergedOptions);
            calendar.render();
            return calendar;
        } catch (error) {
            console.error('Erro crítico na inicialização do calendário:', error);
            return null;
        }
    };
    
    // =========================================================
    // 3) Garantir que GroupSesh.Utils.DateUtils exista
    // =========================================================
    window.GroupSesh = window.GroupSesh || {};
    window.GroupSesh.Utils = window.GroupSesh.Utils || {};
    if (!window.GroupSesh.Utils.DateUtils) {
        window.GroupSesh.Utils.DateUtils = {};
    }
    
    // =========================================================
    // 4) Patch no initCalendar
    // =========================================================
    (function() {
        const existingDateUtils = window.GroupSesh.Utils.DateUtils;
        
        // Se já existir uma versão original de initCalendar, mantemos backup
        const originalInitCalendar = existingDateUtils.initCalendar;
        
        // Substituímos por uma que tenta chamar original, senão safe
        existingDateUtils.initCalendar = function(element, options) {
            if (typeof originalInitCalendar === 'function') {
                try {
                    return originalInitCalendar(element, options);
                } catch (error) {
                    console.warn('Erro na função original initCalendar, utilizando versão segura:', error);
                    return safeInitCalendar(element, options);
                }
            } else {
                // Se não existe initCalendar, usar safe
                return safeInitCalendar(element, options);
            }
        };
    })();
    
    // =========================================================
    // 5) Definir formatDate e sortDates, se não existir
    // =========================================================
    if (typeof window.GroupSesh.Utils.DateUtils.formatDate !== 'function') {
        window.GroupSesh.Utils.DateUtils.formatDate = function(date, mode = 'short') {
            if (!date) return '';
            const d = (date instanceof Date) ? date : new Date(date);
            if (isNaN(d.getTime())) return '';
            
            const isEnglish = window.GroupSesh.Core.Base.isEnglishLocale();
            
            // Exemplo de formatação: mode === 'full' -> data + hora
            const options = (mode === 'full')
                ? { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }
                : { day: '2-digit', month: '2-digit', year: 'numeric' };
            
            const locale = isEnglish ? 'en-US' : 'pt-BR';
            return d.toLocaleString(locale, options);
        };
    }
    
    if (typeof window.GroupSesh.Utils.DateUtils.sortDates !== 'function') {
        window.GroupSesh.Utils.DateUtils.sortDates = function(dateArray) {
            if (!Array.isArray(dateArray)) return [];
            return dateArray.slice().sort((a, b) => new Date(a) - new Date(b));
        };
    }
    
    // =========================================================
    // 6) Caso window.DateUtils não exista, criamos
    //    (alguns scripts podem depender de window.DateUtils)
    // =========================================================
    if (!window.DateUtils) {
        window.DateUtils = {
            initCalendar: window.GroupSesh.Utils.DateUtils.initCalendar,
            isPastDate: window.GroupSesh.Utils.DateUtils.isPastDate || function(date) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const checkDate = date instanceof Date ? date : new Date(date);
                checkDate.setHours(0, 0, 0, 0);
                return checkDate < today;
            },
            formatDate: window.GroupSesh.Utils.DateUtils.formatDate,
            sortDates: window.GroupSesh.Utils.DateUtils.sortDates
        };
    } else {
        // Se já existe window.DateUtils, mas sem formatDate / sortDates, definimos
        if (typeof window.DateUtils.formatDate !== 'function') {
            window.DateUtils.formatDate = window.GroupSesh.Utils.DateUtils.formatDate;
        }
        if (typeof window.DateUtils.sortDates !== 'function') {
            window.DateUtils.sortDates = window.GroupSesh.Utils.DateUtils.sortDates;
        }
        if (!window.DateUtils.isPastDate) {
            window.DateUtils.isPastDate = window.GroupSesh.Utils.DateUtils.isPastDate
                || function(date) {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const checkDate = date instanceof Date ? date : new Date(date);
                    checkDate.setHours(0, 0, 0, 0);
                    return checkDate < today;
                };
        }
    }
    
    console.log('Patch para DateUtils aplicado com sucesso');
})();

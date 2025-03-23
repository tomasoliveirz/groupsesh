/**
 * date-utils.js - Funções para manipulação e formatação de datas
 */
const DateUtils = {
    /**
     * Formata uma data com ou sem hora
     * @param {string} dateString - Data em formato ISO
     * @param {boolean} includeTime - Incluir hora na formatação
     * @param {string} locale - Código de idioma
     * @returns {string} Data formatada
     */
    formatDate(dateString, includeTime = false, locale = window.APP_CONFIG?.language || 'pt-BR') {
        if (!dateString) return '';
        
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '';
            
            const options = includeTime
                ? { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }
                : { day: '2-digit', month: '2-digit', year: 'numeric' };
            
            return date.toLocaleDateString(locale, options);
        } catch (e) {
            console.error('Erro ao formatar data:', e);
            return dateString;
        }
    },
    
    /**
     * Verifica se uma data é no passado
     * @param {Date|string} date - Data para verificar
     * @returns {boolean} Verdadeiro se a data for no passado
     */
    isPastDate(date) {
        const checkDate = date instanceof Date ? date : new Date(date);
        const today = new Date();
        
        // Remover horas para comparar apenas datas
        today.setHours(0, 0, 0, 0);
        checkDate.setHours(0, 0, 0, 0);
        
        return checkDate < today;
    },
    
    /**
     * Inicializa um calendário do FullCalendar 
     * @param {HTMLElement} element - Elemento do calendário
     * @param {Object} options - Opções adicionais
     * @returns {Object} Instância do calendário
     */
    initCalendar(element, options = {}) {
        if (!element) return null;
        
        const lang = window.APP_CONFIG?.language || document.documentElement.lang || 'pt-BR';
        
        const defaultOptions = {
            initialView: 'dayGridMonth',
            initialDate: new Date(), // Importante: definir data inicial para o mês atual
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,dayGridYear'
            },
            views: {
                dayGridMonth: {
                    buttonText: lang === 'en' ? 'Month' : 'Mês'
                },
                dayGridYear: {
                    buttonText: lang === 'en' ? 'Year' : 'Ano',
                    duration: { years: 1 }
                }
            },
            locale: lang.substring(0, 2), // FullCalendar usa códigos de 2 letras
            height: 'auto'
        };
        
        // Criar e renderizar calendário com opções mescladas
        const calendar = new FullCalendar.Calendar(
            element,
            {...defaultOptions, ...options}
        );
        
        calendar.render();
        return calendar;
    }
};
/**
 * calendar-manager.js - Gerenciamento do calendário do dashboard
 * @module Dashboard/CalendarManager
 * @requires Core/Base
 * @requires Core/Events
 * @requires Utils/DateUtils
 * @requires Utils/DOMUtils
 * @requires UI/Modals
 */
window.GroupSesh = window.GroupSesh || {};
GroupSesh.Dashboard = GroupSesh.Dashboard || {};

(function() {
    'use strict';

    /**
     * Gerenciamento do calendário do dashboard
     * @namespace
     */
    const CalendarManager = {
        /**
         * Instância do calendário
         * @type {Object}
         * @private
         */
        _calendar: null,
        
        /**
         * Dados das disponibilidades
         * @type {Object}
         * @private
         */
        _availabilityData: null,
        
        /**
         * Inicializa o calendário
         * @param {HTMLElement} element - Elemento do calendário
         * @returns {Object|null} Instância do calendário
         */
        init(element) {
            if (!element) {
                console.error('Calendar element not found');
                return null;
            }
            
            try {
                // Inicializar calendário vazio
                this._calendar = GroupSesh.Utils.DateUtils.initCalendar(element);
                
                // Configurar navigation buttons
                this._setupNavigationButtons();
                
                // Configurar highlight switch
                this._setupHighlightSwitch();
                
                return this._calendar;
            } catch (error) {
                console.error('Error initializing calendar:', error);
                return null;
            }
        },
        
        /**
         * Configura botões de navegação
         * @private
         */
        _setupNavigationButtons() {
            const DOMUtils = GroupSesh.Utils.DOMUtils;
            
            // Botão mês anterior
            const prevMonthBtn = DOMUtils.getElementById('prev-month-btn');
            if (prevMonthBtn) {
                DOMUtils.addEventListener(prevMonthBtn, 'click', () => {
                    if (this._calendar) this._calendar.prev();
                });
            }
            
            // Botão hoje
            const todayBtn = DOMUtils.getElementById('today-btn');
            if (todayBtn) {
                DOMUtils.addEventListener(todayBtn, 'click', () => {
                    if (this._calendar) this._calendar.today();
                });
            }
            
            // Botão próximo mês
            const nextMonthBtn = DOMUtils.getElementById('next-month-btn');
            if (nextMonthBtn) {
                DOMUtils.addEventListener(nextMonthBtn, 'click', () => {
                    if (this._calendar) this._calendar.next();
                });
            }
        },
        
        /**
         * Configura switch de destaque
         * @private
         */
        _setupHighlightSwitch() {
            const DOMUtils = GroupSesh.Utils.DOMUtils;
            const highlightSwitch = DOMUtils.getElementById('highlight-switch');
            
            if (highlightSwitch) {
                DOMUtils.addEventListener(highlightSwitch, 'change', () => {
                    const dayElements = document.querySelectorAll('.highlight-participants');
                    dayElements.forEach(el => {
                        if (highlightSwitch.checked) {
                            el.classList.add('active');
                        } else {
                            el.classList.remove('active');
                        }
                    });
                });
            }
        },
        
        /**
         * Atualiza o calendário com dados de disponibilidade
         * @param {Object} data - Dados de disponibilidade
         * @param {Function} participantClickHandler - Handler para clique em data com participantes
         */
        updateWithData(data, participantClickHandler) {
            if (!this._calendar) {
                console.warn('Calendar not initialized, cannot update with data');
                return;
            }
            
            if (!data || !data.availability_by_date) {
                console.warn('Invalid availability data provided');
                return;
            }
            
            try {
                // Armazenar dados para referência posterior
                this._availabilityData = data;
                
                // Limpar eventos existentes
                this._calendar.removeAllEvents();
                
                // Preparar eventos
                const events = [];
                
                // Para cada data com participantes
                for (const dateStr in data.availability_by_date) {
                    if (Object.prototype.hasOwnProperty.call(data.availability_by_date, dateStr)) {
                        const participants = data.availability_by_date[dateStr];
                        
                        if (Array.isArray(participants) && participants.length > 0) {
                            events.push({
                                start: dateStr,
                                display: 'background',
                                backgroundColor: 'rgba(40, 167, 69, 0.2)',
                                extendedProps: {
                                    participants: participants,
                                    count: participants.length
                                }
                            });
                        }
                    }
                }
                
                // Adicionar eventos
                this._calendar.addEventSource(events);
                
                // Configurar click handler
                this._calendar.setOption('dateClick', (info) => {
                    const dateStr = info.dateStr;
                    const participants = data.availability_by_date[dateStr] || [];
                    
                    if (participants.length > 0 && typeof participantClickHandler === 'function') {
                        participantClickHandler(dateStr, participants);
                    }
                });
                
                // Configurar renderização de eventos
                this._calendar.setOption('eventDidMount', (info) => {
                    if (info.event.extendedProps?.count) {
                        const count = info.event.extendedProps.count;
                        const dayElement = info.el.closest('.fc-daygrid-day');
                        
                        if (!dayElement) return;
                        
                        // Adicionar classe para styling
                        dayElement.classList.add('fc-day-has-participants');
                        
                        // Adicionar contador
                        const dayFrame = info.el.closest('.fc-daygrid-day-frame');
                        if (dayFrame) {
                            const countEl = GroupSesh.Utils.DOMUtils.createElement('div', {
                                className: 'participant-count'
                            }, count.toString());
                            
                            dayFrame.appendChild(countEl);
                        }
                        
                        // Configurar destaque condicional
                        dayElement.classList.add('highlight-participants');
                        
                        // Categorizar por número de participantes
                        let category = count >= 5 ? '5+' : count.toString();
                        dayElement.setAttribute('data-count', category);
                    }
                });
                
                // Renderizar para aplicar as alterações
                this._calendar.render();
                
                // Aplicar destaque se estiver ativado
                const highlightSwitch = GroupSesh.Utils.DOMUtils.getElementById('highlight-switch');
                if (highlightSwitch && highlightSwitch.checked) {
                    setTimeout(() => {
                        document.querySelectorAll('.highlight-participants').forEach(el => {
                            el.classList.add('active');
                        });
                    }, 100);
                }
                
                // Notificar sistema de eventos que o calendário foi atualizado
                GroupSesh.Core.Events.publish('calendar:updated', events.length);
                
                return true;
            } catch (error) {
                console.error('Error updating calendar with data:', error);
                return false;
            }
        },
        
        /**
         * Obtém dados de participantes para uma data específica
         * @param {string} dateStr - Data ISO
         * @returns {Array} Array de participantes ou array vazio
         */
        getParticipantsForDate(dateStr) {
            if (!this._availabilityData || !this._availabilityData.availability_by_date) {
                return [];
            }
            
            return this._availabilityData.availability_by_date[dateStr] || [];
        },
        
        /**
         * Obtém as datas disponíveis com mais participantes
         * @param {number} [limit=3] - Número máximo de datas para retornar
         * @returns {Array} Array de objetos {date, count, percentage}
         */
        getBestDates(limit = 3) {
            if (!this._availabilityData || !this._availabilityData.availability_by_date) {
                return [];
            }
            
            // Extrair datas e contagens
            const dateCountPairs = Object.entries(this._availabilityData.availability_by_date)
                .map(([date, participants]) => ({
                    date,
                    count: Array.isArray(participants) ? participants.length : 0,
                    participants: Array.isArray(participants) ? participants : []
                }));
            
            // Ordenar por contagem (decrescente)
            dateCountPairs.sort((a, b) => b.count - a.count);
            
            // Calcular porcentagem baseada no total de participantes
            const totalParticipants = Object.keys(this._availabilityData.participants || {}).length;
            
            // Limitar e retornar as melhores datas
            return dateCountPairs.slice(0, limit).map(item => ({
                date: item.date,
                count: item.count,
                percentage: totalParticipants ? Math.round((item.count / totalParticipants) * 100) : 0,
                participants: item.participants
            }));
        },
        
        /**
         * Destrói a instância do calendário e limpa recursos
         */
        destroy() {
            if (this._calendar) {
                this._calendar.destroy();
                this._calendar = null;
            }
            
            this._availabilityData = null;
        }
    };
    
    // Exportar o módulo
    GroupSesh.Dashboard.CalendarManager = CalendarManager;
})();
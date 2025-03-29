/**
 * calendar-manager.js - Gerenciamento do calendário do dashboard
 * @module Dashboard/CalendarManager
 * @requires Core/Base
 * @requires Core/Events
 * @requires Utils/DateUtils
 * @requires Utils/DOMUtils
 * @requires UI/Modals
 */
(function() {
    'use strict';

    // Garantir namespace
    window.GroupSesh = window.GroupSesh || {};
    window.GroupSesh.Dashboard = window.GroupSesh.Dashboard || {};

    // Se já existir, não redefine
    if (window.GroupSesh.Dashboard.CalendarManager) {
        console.log('[CalendarManager] Já existente, usando versão atual.');
        return;
    }

    /**
     * Gerenciamento do calendário do dashboard.
     * Este módulo reinicializa o calendário sempre que for chamado,
     * destruindo a instância anterior e criando uma nova a partir dos dados recebidos.
     * Também mantém os contadores dos dias conforme os dados da database.
     * @namespace CalendarManager
     */
    const CalendarManager = {
        _calendar: null,
        _availabilityData: null,

        /**
         * Inicializa o calendário.
         * Se já existir uma instância, ela é destruída antes de reinicializar.
         * @param {HTMLElement} element - Elemento do calendário
         * @returns {Object|null} Instância do calendário
         */
        init(element) {
            if (!element) {
                console.error('[CalendarManager] Elemento do calendário não encontrado.');
                return null;
            }

            try {
                // Se já existe uma instância, destrói-a
                if (this._calendar) {
                    console.log('[CalendarManager] Instância anterior encontrada. Destruindo...');
                    this._calendar.destroy();
                    this._calendar = null;
                }
                console.log('[CalendarManager] Inicializando o calendário...');
                // Cria a instância do calendário utilizando a função initCalendar do DateUtils
                this._calendar = GroupSesh.Utils.DateUtils.initCalendar(element);
                console.log('[CalendarManager] Calendário inicializado.');

                // Configura os botões de navegação e o switch de destaque
                this._setupNavigationButtons();
                this._setupHighlightSwitch();

                return this._calendar;
            } catch (error) {
                console.error('[CalendarManager] Erro ao inicializar o calendário:', error);
                return null;
            }
        },

        /**
         * Configura os botões de navegação (prev, today, next).
         * @private
         */
        _setupNavigationButtons() {
            const DOMUtils = GroupSesh.Utils.DOMUtils;
            const prevMonthBtn = DOMUtils.getElementById('prev-month-btn');
            if (prevMonthBtn) {
                DOMUtils.addEventListener(prevMonthBtn, 'click', () => {
                    console.log('[CalendarManager] Botão "mês anterior" clicado.');
                    if (this._calendar) this._calendar.prev();
                });
            }
            const todayBtn = DOMUtils.getElementById('today-btn');
            if (todayBtn) {
                DOMUtils.addEventListener(todayBtn, 'click', () => {
                    console.log('[CalendarManager] Botão "hoje" clicado.');
                    if (this._calendar) this._calendar.today();
                });
            }
            const nextMonthBtn = DOMUtils.getElementById('next-month-btn');
            if (nextMonthBtn) {
                DOMUtils.addEventListener(nextMonthBtn, 'click', () => {
                    console.log('[CalendarManager] Botão "próximo mês" clicado.');
                    if (this._calendar) this._calendar.next();
                });
            }
        },

        /**
         * Configura o switch de destaque no calendário (ex.: highlight-switch).
         * @private
         */
        _setupHighlightSwitch() {
            const DOMUtils = GroupSesh.Utils.DOMUtils;
            const highlightSwitch = DOMUtils.getElementById('highlight-switch');
            if (highlightSwitch) {
                DOMUtils.addEventListener(highlightSwitch, 'change', () => {
                    console.log('[CalendarManager] Switch de destaque alterado:', highlightSwitch.checked);
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
         * Atualiza o calendário com os dados de disponibilidade.
         * Reinicializa os eventos, exibindo os contadores nos dias correspondentes.
         * @param {Object} data - Dados de disponibilidade da survey (deve conter availability_by_date e participantes)
         * @param {Function} participantClickHandler - Callback para clique em data com participantes
         */
        updateWithData(data, participantClickHandler) {
            if (!this._calendar) {
                console.warn('[CalendarManager] Calendário não inicializado. Não é possível atualizar os dados.');
                return;
            }
            if (!data || !data.availability_by_date) {
                console.warn('[CalendarManager] Dados de disponibilidade inválidos.');
                return;
            }
            try {
                console.log('[CalendarManager] Atualizando calendário com novos dados...');
                // Armazena os dados para referência futura
                this._availabilityData = data;
                // Remove todos os eventos atuais
                this._calendar.removeAllEvents();
                const events = [];

                // Para cada data, cria um evento de fundo que inclui o contador
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
                console.log('[CalendarManager] Eventos a adicionar:', events);
                this._calendar.addEventSource(events);

                // Configura o handler para clique nas datas
                this._calendar.setOption('dateClick', (info) => {
                    const dateStr = info.dateStr;
                    const participants = data.availability_by_date[dateStr] || [];
                    console.log(`[CalendarManager] Data clicada: ${dateStr}, participantes:`, participants);
                    if (participants.length > 0 && typeof participantClickHandler === 'function') {
                        participantClickHandler(dateStr, participants);
                    }
                });

                // Configura a renderização dos eventos para exibir os contadores
                this._calendar.setOption('eventDidMount', (info) => {
                    if (info.event.extendedProps?.count) {
                        const count = info.event.extendedProps.count;
                        const dayElement = info.el.closest('.fc-daygrid-day');
                        if (!dayElement) return;
                        dayElement.classList.add('fc-day-has-participants');
                        const dayFrame = info.el.closest('.fc-daygrid-day-frame');
                        if (dayFrame) {
                            let countEl = dayFrame.querySelector('.participant-count');
                            if (!countEl) {
                                countEl = GroupSesh.Utils.DOMUtils.createElement('div', {
                                    className: 'participant-count'
                                }, count.toString());
                                dayFrame.appendChild(countEl);
                            } else {
                                countEl.textContent = count.toString();
                            }
                        }
                        dayElement.classList.add('highlight-participants');
                        const category = count >= 5 ? '5+' : count.toString();
                        dayElement.setAttribute('data-count', category);
                    }
                });

                // Renderiza o calendário (chama render para aplicar as alterações)
                this._calendar.render();
                console.log('[CalendarManager] Calendário atualizado e renderizado.');

                // Se o switch de destaque estiver ativo, garante que os dias marcados fiquem com a classe "active"
                const highlightSwitch = GroupSesh.Utils.DOMUtils.getElementById('highlight-switch');
                if (highlightSwitch && highlightSwitch.checked) {
                    setTimeout(() => {
                        document.querySelectorAll('.highlight-participants').forEach(el => {
                            el.classList.add('active');
                        });
                    }, 100);
                }

                // Notifica outros módulos que o calendário foi atualizado
                GroupSesh.Core.Events.publish('calendar:updated', events.length);
                return true;
            } catch (error) {
                console.error('[CalendarManager] Erro ao atualizar o calendário com dados:', error);
                return false;
            }
        },

        /**
         * Obtém os participantes para uma data específica.
         * @param {string} dateStr - Data ISO
         * @returns {Array} Array de participantes ou vazio
         */
        getParticipantsForDate(dateStr) {
            if (!this._availabilityData || !this._availabilityData.availability_by_date) {
                return [];
            }
            return this._availabilityData.availability_by_date[dateStr] || [];
        },

        /**
         * Obtém as datas com mais participantes.
         * @param {number} [limit=3] - Número máximo de datas para retornar
         * @returns {Array} Array de objetos {date, count, percentage, participants}
         */
        getBestDates(limit = 3) {
            if (!this._availabilityData || !this._availabilityData.availability_by_date) {
                return [];
            }
            const dateCountPairs = Object.entries(this._availabilityData.availability_by_date)
                .map(([date, participants]) => ({
                    date,
                    count: Array.isArray(participants) ? participants.length : 0,
                    participants: Array.isArray(participants) ? participants : []
                }));
            dateCountPairs.sort((a, b) => b.count - a.count);
            const totalParticipants = Object.keys(this._availabilityData.participants || {}).length;
            return dateCountPairs.slice(0, limit).map(item => ({
                date: item.date,
                count: item.count,
                percentage: totalParticipants ? Math.round((item.count / totalParticipants) * 100) : 0,
                participants: item.participants
            }));
        },

        /**
         * Destrói a instância do calendário e limpa os dados.
         */
        destroy() {
            if (this._calendar) {
                console.log('[CalendarManager] Destruindo instância do calendário.');
                this._calendar.destroy();
                this._calendar = null;
            }
            this._availabilityData = null;
        }
    };

    // Ouvinte para o evento customizado 'reinitializeCalendar'
    document.addEventListener('reinitializeCalendar', function() {
        console.log('[CalendarManager] Evento reinitializeCalendar recebido.');
        const calendarEl = document.getElementById('calendar');
        if (calendarEl) {
            console.log('[CalendarManager] Elemento do calendário encontrado. Reinicializando...');
            CalendarManager.init(calendarEl);
        } else {
            console.warn('[CalendarManager] Nenhum elemento de calendário encontrado para reinicialização.');
        }
    });

    // Exporta o módulo para o namespace global
    window.GroupSesh.Dashboard.CalendarManager = CalendarManager;
    console.log('[CalendarManager] Calendar Manager inicializado com sucesso.');
})();

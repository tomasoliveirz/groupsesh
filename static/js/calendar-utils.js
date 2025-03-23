/**
 * GroupSesh - Utilitários para calendário
 * Funções especializadas para manipulação e visualização de calendários
 */

const CalendarUtils = {
    /**
     * Inicializa um calendário FullCalendar com configurações padrão
     * @param {HTMLElement} element - Elemento onde o calendário será renderizado
     * @param {Object} options - Opções de configuração personalizadas
     * @returns {Object} Instância do calendário
     */
    initializeCalendar(element, options = {}) {
        if (!element) return null;
        
        // Obter o código de idioma atual da tag html
        const lang = document.documentElement.lang || 'en';
        
        // Configurações padrão
        const defaultSettings = {
            initialView: 'dayGridMonth',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,dayGridYear'
            },
            views: {
                dayGridMonth: {
                    buttonText: this.getLocalizedText('month', lang)
                },
                dayGridYear: {
                    buttonText: this.getLocalizedText('year', lang),
                    duration: { years: 1 }
                }
            },
            locale: lang.substring(0, 2), // FullCalendar usa códigos de 2 letras
            height: 'auto',
            firstDay: 1, // Segunda como primeiro dia da semana
            themeSystem: 'bootstrap5'
        };
        
        // Mesclar configurações padrão com opções personalizadas
        const calendarSettings = { ...defaultSettings, ...options };
        
        // Inicializar o calendário
        return new FullCalendar.Calendar(element, calendarSettings);
    },
    
    /**
     * Obter texto localizado para elementos do calendário
     * @param {string} key - Chave de texto
     * @param {string} lang - Código de idioma
     * @returns {string} Texto localizado
     */
    getLocalizedText(key, lang) {
        const translations = {
            'month': {
                'en': 'Month',
                'pt-pt': 'Mês',
                'pt-br': 'Mês',
                'es': 'Mes',
                'de': 'Monat',
                'fr': 'Mois',
                'it': 'Mese'
            },
            'year': {
                'en': 'Year',
                'pt-pt': 'Ano',
                'pt-br': 'Ano',
                'es': 'Año',
                'de': 'Jahr',
                'fr': 'Année',
                'it': 'Anno'
            },
            'today': {
                'en': 'Today',
                'pt-pt': 'Hoje',
                'pt-br': 'Hoje',
                'es': 'Hoy',
                'de': 'Heute',
                'fr': 'Aujourd\'hui',
                'it': 'Oggi'
            }
        };
        
        // Tentar obter a tradução para o idioma especificado
        if (translations[key] && translations[key][lang]) {
            return translations[key][lang];
        }
        
        // Verificar se existe uma versão mais genérica do idioma (apenas 2 caracteres)
        const shortLang = lang.substring(0, 2);
        if (translations[key] && translations[key][shortLang]) {
            return translations[key][shortLang];
        }
        
        // Fallback para inglês
        return translations[key]['en'] || key;
    },
    
    /**
     * Cria um calendário de seleção para o usuário indicar disponibilidades
     * @param {HTMLElement} element - Elemento onde o calendário será renderizado
     * @param {Set} selectedDates - Conjunto para armazenar as datas selecionadas
     * @param {Function} onChange - Callback chamado quando a seleção muda
     * @returns {Object} Instância do calendário
     */
    createSelectionCalendar(element, selectedDates, onChange) {
        if (!element || !selectedDates) return null;
        
        const calendarOptions = {
            selectable: false, // Vamos gerenciar manualmente com dateClick
            unselectAuto: false,
            dateClick: (info) => {
                this.handleDateSelection(info, selectedDates);
                if (typeof onChange === 'function') {
                    onChange(selectedDates);
                }
            },
            eventClassNames: function(arg) {
                return [ 'fc-event-selected' ];
            }
        };
        
        const calendar = this.initializeCalendar(element, calendarOptions);
        
        // Renderizar o calendário
        calendar.render();
        
        return calendar;
    },
    
    /**
     * Manipula a seleção de uma data no calendário
     * @param {Object} info - Informações do clique na data
     * @param {Set} selectedDates - Conjunto de datas selecionadas
     */
    handleDateSelection(info, selectedDates) {
        const dateStr = info.dateStr;
        const dayEl = info.dayEl;
        
        // Ignorar datas passadas
        if (info.date < new Date().setHours(0, 0, 0, 0)) {
            return;
        }
        
        // Toggle da seleção
        if (selectedDates.has(dateStr)) {
            selectedDates.delete(dateStr);
            dayEl.classList.remove('fc-day-selected');
        } else {
            selectedDates.add(dateStr);
            dayEl.classList.add('fc-day-selected');
        }
    },
    
    /**
     * Atualiza a exibição do calendário com eventos para datas selecionadas
     * @param {Object} calendar - Instância do calendário FullCalendar
     * @param {Array|Set} dates - Datas selecionadas (strings ISO)
     */
    updateCalendarWithSelectedDates(calendar, dates) {
        if (!calendar) return;
        
        // Limpar eventos existentes
        calendar.removeAllEvents();
        
        // Converter para array se for um Set
        const datesArray = Array.isArray(dates) ? dates : Array.from(dates);
        
        // Adicionar eventos para cada data selecionada
        const events = datesArray.map(dateStr => ({
            start: dateStr,
            display: 'background',
            backgroundColor: 'rgba(79, 70, 229, 0.2)'
        }));
        
        // Adicionar os eventos ao calendário
        calendar.addEventSource(events);
    },
    
    /**
     * Cria um calendário de visualização para o dashboard
     * @param {HTMLElement} element - Elemento onde o calendário será renderizado
     * @param {Object} data - Dados de disponibilidade por data
     * @param {Function} onDateClick - Callback para clique em data
     * @returns {Object} Instância do calendário
     */
    createDashboardCalendar(element, data, onDateClick) {
        if (!element || !data) return null;
        
        // Preparar eventos a partir dos dados
        const events = [];
        for (const dateStr in data.availability_by_date) {
            const participants = data.availability_by_date[dateStr];
            events.push({
                start: dateStr,
                end: dateStr,
                display: 'background',
                backgroundColor: 'rgba(40, 167, 69, 0.2)',
                extendedProps: {
                    participants: participants,
                    count: participants.length
                }
            });
        }
        
        const calendarOptions = {
            events: events,
            eventDidMount: function(info) {
                if (info.event.extendedProps.count) {
                    const count = info.event.extendedProps.count;
                    
                    // Adicionar classe para estilização
                    info.el.closest('.fc-daygrid-day').classList.add('fc-day-has-participants');
                    
                    // Adicionar contador de participantes
                    const countEl = document.createElement('div');
                    countEl.className = 'participant-count';
                    countEl.textContent = count;
                    info.el.closest('.fc-daygrid-day-frame').appendChild(countEl);
                    
                    // Adicionar atributo para destaque condicional
                    const dayEl = info.el.closest('.fc-daygrid-day');
                    dayEl.classList.add('highlight-participants');
                    
                    // Categorizar por número de participantes
                    let category = count >= 5 ? '5+' : count.toString();
                    dayEl.setAttribute('data-count', category);
                }
            },
            dateClick: function(info) {
                const dateStr = info.dateStr;
                const participants = data.availability_by_date[dateStr] || [];
                
                if (typeof onDateClick === 'function') {
                    onDateClick(dateStr, participants);
                }
            }
        };
        
        const calendar = this.initializeCalendar(element, calendarOptions);
        
        // Renderizar o calendário
        calendar.render();
        
        return calendar;
    },
    
    /**
     * Exporta dados do calendário para CSV
     * @param {Object} data - Dados do dashboard
     * @param {string} filename - Nome do arquivo
     */
    exportToCSV(data, filename = 'availability_data.csv') {
        if (!data || !data.participants || !data.survey) return;
        
        // Criar cabeçalho do CSV
        let csv = 'Nome,Email,Data de Resposta,Dias Disponíveis\n';
        
        // Adicionar dados de cada participante
        for (const id in data.participants) {
            const p = data.participants[id];
            const name = p.name.replace(/,/g, ' '); // Remover vírgulas do nome
            const email = p.email;
            const createdAt = new Date(p.created_at).toLocaleString();
            const dates = p.availability_dates
                .map(d => new Date(d).toLocaleDateString())
                .join('; ');
            
            csv += `"${name}","${email}","${createdAt}","${dates}"\n`;
        }
        
        // Criar blob e link para download
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        // Criar nome de arquivo com base no título da survey e data atual
        const surveyTitle = data.survey.title.replace(/\s+/g, '_');
        const dateStr = new Date().toISOString().slice(0, 10);
        const fullFilename = `${surveyTitle}_${dateStr}.csv`;
        
        // Configurar link para download
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', fullFilename);
        link.style.display = 'none';
        
        // Adicionar à página, clicar e remover
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};
/**
 * admin.js - Funcionalidades do dashboard de administração
 * 
 * Este script gerencia a exibição dos dados da survey no dashboard,
 * incluindo o calendário, lista de participantes, exportação de dados, etc.
 */

document.addEventListener('DOMContentLoaded', function() {
    // Elementos do DOM
    const calendarEl = document.getElementById('calendar');
    const participantsList = document.getElementById('participants-list');
    const participantsCount = document.getElementById('participants-count');
    const creationDate = document.getElementById('creation-date');
    const expiryDate = document.getElementById('expiry-date');
    const modalDate = document.getElementById('modal-date');
    const modalParticipantsList = document.getElementById('modal-participants-list');
    const participantSearch = document.getElementById('participant-search');
    const highlightSwitch = document.getElementById('highlight-switch');
    
    // Inicializar modais Bootstrap
    const participantsModal = new bootstrap.Modal(document.getElementById('participants-modal'));
    const participantDetailModal = new bootstrap.Modal(document.getElementById('participant-detail-modal'));
    
    // Token da survey extraído da URL
    const surveyToken = window.location.pathname.split('/').pop();
    
    // Variáveis globais
    let surveyData = null;
    let calendar = null;
    
    /**
     * Formata uma data para exibição no formato brasileiro com hora
     * @param {string} dateString - String ISO de data para formatar
     * @returns {string} Data formatada
     */
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    /**
     * Formata uma data para exibição no formato brasileiro sem hora
     * @param {string} dateString - String ISO de data para formatar
     * @returns {string} Data formatada
     */
    function formatShortDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }
    
    /**
     * Inicializa o calendário FullCalendar com os dados da survey
     * @param {Object} data - Dados da survey obtidos da API
     */
    function initCalendar(data) {
        // Mapear datas para eventos do calendário
        const events = [];
        
        // Para cada data com participantes
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
        
        // Inicializar calendário
        calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,dayGridYear'
            },
            views: {
                dayGridMonth: {
                    buttonText: 'Mês'
                },
                dayGridYear: {
                    buttonText: 'Ano',
                    duration: { years: 1 }
                }
            },
            locale: 'pt-br',
            height: 'auto',
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
                
                if (participants.length > 0) {
                    showParticipantsModal(dateStr, participants);
                }
            }
        });
        
        calendar.render();
        
        // Configurar botões de navegação
        setupCalendarNavigation();
    }
    
    /**
     * Configura os botões de navegação do calendário
     */
    function setupCalendarNavigation() {
        document.getElementById('prev-month-btn').addEventListener('click', function() {
            calendar.prev();
        });
        
        document.getElementById('today-btn').addEventListener('click', function() {
            calendar.today();
        });
        
        document.getElementById('next-month-btn').addEventListener('click', function() {
            calendar.next();
        });
    }
    
    /**
     * Exibe o modal com a lista de participantes para uma data específica
     * @param {string} dateStr - String ISO da data
     * @param {Array} participants - Array de participantes disponíveis na data
     */
    function showParticipantsModal(dateStr, participants) {
        // Formatar data para o título do modal
        modalDate.textContent = formatShortDate(dateStr);
        
        // Limpar lista anterior
        modalParticipantsList.innerHTML = '';
        
        // Preencher com participantes
        if (participants.length === 0) {
            modalParticipantsList.innerHTML = '<div class="text-center py-3">Nenhum participante disponível neste dia.</div>';
        } else {
            participants.forEach(participant => {
                const participantId = participant.participant_id;
                const fullParticipant = surveyData.participants[participantId];
                
                const item = document.createElement('a');
                item.href = '#';
                item.className = 'list-group-item list-group-item-action';
                item.innerHTML = `
                    <div class="d-flex w-100 justify-content-between">
                        <h6 class="mb-1">${participant.name}</h6>
                    </div>
                    <p class="mb-1">${participant.email}</p>
                `;
                
                // Evento para mostrar detalhes do participante
                item.addEventListener('click', function(e) {
                    e.preventDefault();
                    showParticipantDetails(fullParticipant);
                });
                
                modalParticipantsList.appendChild(item);
            });
        }
        
        // Mostrar modal
        participantsModal.show();
    }
    
    /**
     * Exibe o modal com os detalhes de um participante específico
     * @param {Object} participant - Objeto com dados do participante
     */
    function showParticipantDetails(participant) {
        // Fechar modal anterior
        participantsModal.hide();
        
        // Preencher informações
        const participantInfo = document.getElementById('participant-info');
        participantInfo.innerHTML = `
            <div class="card">
                <div class="card-body">
                    <h5 class="card-title">${participant.name}</h5>
                    <h6 class="card-subtitle mb-2 text-muted">${participant.email}</h6>
                    <p class="card-text">
                        <small class="text-muted">Resposta enviada em: ${formatDate(participant.created_at)}</small>
                    </p>
                </div>
            </div>
        `;
        
        // Preencher datas disponíveis
        const datesList = document.getElementById('participant-dates');
        datesList.innerHTML = '';
        
        if (participant.availability_dates.length === 0) {
            datesList.innerHTML = '<div class="text-center py-3">Nenhuma data selecionada.</div>';
        } else {
            // Ordenar datas
            const sortedDates = [...participant.availability_dates].sort();
            
            sortedDates.forEach(dateStr => {
                const item = document.createElement('div');
                item.className = 'list-group-item';
                item.textContent = formatShortDate(dateStr);
                datesList.appendChild(item);
            });
        }
        
        // Mostrar modal
        participantDetailModal.show();
    }
    
    /**
     * Atualiza a lista de participantes na interface
     * @param {Object} participants - Objeto com dados dos participantes
     * @param {string} filter - Filtro de busca (opcional)
     */
    function updateParticipantsList(participants, filter = '') {
        participantsList.innerHTML = '';
        
        const participantIds = Object.keys(participants);
        
        if (participantIds.length === 0) {
            participantsList.innerHTML = `
                <div class="text-center py-5">
                    <div class="display-4 text-muted mb-3">
                        <i class="bi bi-people"></i>
                    </div>
                    <p class="lead">Nenhum participante ainda.</p>
                    <p class="text-muted">Compartilhe o link da survey para receber respostas.</p>
                </div>
            `;
            return;
        }
        
        // Filtrar participantes
        let filteredIds = participantIds;
        if (filter) {
            const lowerFilter = filter.toLowerCase();
            filteredIds = participantIds.filter(id => {
                const p = participants[id];
                return p.name.toLowerCase().includes(lowerFilter) || 
                       p.email.toLowerCase().includes(lowerFilter);
            });
        }
        
        if (filteredIds.length === 0) {
            participantsList.innerHTML = `
                <div class="text-center py-3">
                    <p>Nenhum participante encontrado com o termo "${filter}".</p>
                </div>
            `;
            return;
        }
        
        // Ordenar por nome
        filteredIds.sort((a, b) => {
            return participants[a].name.localeCompare(participants[b].name);
        });
        
        // Criar lista
        const list = document.createElement('div');
        list.className = 'list-group';
        
        filteredIds.forEach(id => {
            const participant = participants[id];
            
            const item = document.createElement('a');
            item.href = '#';
            item.className = 'list-group-item list-group-item-action participant-card';
            item.innerHTML = `
                <div class="d-flex w-100 justify-content-between">
                    <h6 class="mb-1">${participant.name}</h6>
                    <small>${formatShortDate(participant.created_at)}</small>
                </div>
                <p class="mb-1">${participant.email}</p>
                <small class="text-muted">
                    ${participant.availability_dates.length} ${participant.availability_dates.length === 1 ? 'dia disponível' : 'dias disponíveis'}
                </small>
            `;
            
            // Evento para mostrar detalhes do participante
            item.addEventListener('click', function(e) {
                e.preventDefault();
                showParticipantDetails(participant);
            });
            
            list.appendChild(item);
        });
        
        participantsList.appendChild(list);
    }
    
    /**
     * Exporta os dados da survey para um arquivo CSV
     */
    function exportToCSV() {
        if (!surveyData) return;
        
        // Criar cabeçalho do CSV
        let csv = 'Nome,Email,Data de Resposta,Dias Disponíveis\n';
        
        // Adicionar dados de cada participante
        for (const id in surveyData.participants) {
            const p = surveyData.participants[id];
            const name = p.name.replace(/,/g, ' '); // Remover vírgulas do nome
            const email = p.email;
            const createdAt = formatDate(p.created_at);
            const dates = p.availability_dates.map(d => formatShortDate(d)).join('; ');
            
            csv += `"${name}","${email}","${createdAt}","${dates}"\n`;
        }
        
        // Criar blob e link para download
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', `survey_${surveyData.survey.title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.csv`);
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    /**
     * Copia o conteúdo de um input para a área de transferência
     * @param {string} elementId - ID do elemento input a ser copiado
     */
    window.copyToClipboard = function(elementId) {
        const element = document.getElementById(elementId);
        element.select();
        document.execCommand('copy');
        
        // Feedback visual
        const button = element.nextElementSibling;
        const originalHTML = button.innerHTML;
        button.innerHTML = '<i class="bi bi-check"></i>';
        
        setTimeout(() => {
            button.innerHTML = originalHTML;
        }, 2000);
    };
    
    /**
     * Configura os eventos de interface do dashboard
     */
    function setupEventListeners() {
        // Evento para exportar dados
        document.getElementById('export-btn').addEventListener('click', exportToCSV);
        
        // Evento para compartilhar
        document.getElementById('share-btn').addEventListener('click', function() {
            const link = document.getElementById('survey-link').value;
            
            if (navigator.share) {
                navigator.share({
                    title: 'Pesquisa de Disponibilidade',
                    text: `Por favor, participe da pesquisa de disponibilidade: ${surveyData.survey.title}`,
                    url: link
                })
                .catch(err => {
                    console.log('Erro ao compartilhar:', err);
                    copyToClipboard('survey-link');
                });
            } else {
                copyToClipboard('survey-link');
            }
        });
        
        // Evento para busca de participantes
        participantSearch.addEventListener('input', function() {
            if (surveyData) {
                updateParticipantsList(surveyData.participants, this.value);
            }
        });
        
        // Evento para destacar disponibilidades
        highlightSwitch.addEventListener('change', function() {
            const dayElements = document.querySelectorAll('.highlight-participants');
            dayElements.forEach(el => {
                if (this.checked) {
                    el.classList.add('active');
                } else {
                    el.classList.remove('active');
                }
            });
        });
    }
    
    /**
     * Carrega os dados da survey da API e atualiza a interface
     */
    async function loadSurveyData() {
        try {
            const response = await fetch(`/api/survey-data/${surveyToken}`, {
                headers: {
                    'X-CSRFToken': csrfToken // Global definido em base.html
                }
            });
            
            if (response.ok) {
                surveyData = await response.json();
                
                // Atualizar informações
                const participants = surveyData.participants;
                participantsCount.textContent = Object.keys(participants).length;
                creationDate.textContent = formatDate(surveyData.survey.created_at);
                expiryDate.textContent = formatDate(surveyData.survey.expires_at);
                
                // Verificar se está expirada
                if (surveyData.is_expired) {
                    const alertMessage = document.createElement('div');
                    alertMessage.className = 'alert alert-warning alert-dismissible fade show mb-4';
                    alertMessage.setAttribute('role', 'alert');
                    alertMessage.innerHTML = `
                        <strong>Atenção!</strong> Esta survey está expirada. Os participantes não podem mais responder.
                        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>
                    `;
                    document.querySelector('main > .container > .row').prepend(alertMessage);
                }
                
                // Inicializar calendário
                initCalendar(surveyData);
                
                // Atualizar lista de participantes
                updateParticipantsList(participants);
            } else {
                // Erro na API
                const errorData = await response.json();
                showErrorMessage(errorData.error || 'Erro desconhecido ao carregar dados.');
            }
        } catch (error) {
            console.error('Erro:', error);
            showErrorMessage('Erro ao comunicar com o servidor. Verifique sua conexão de internet.');
        }
    }
    
    /**
     * Exibe uma mensagem de erro na interface
     * @param {string} message - Mensagem de erro a ser exibida
     */
    function showErrorMessage(message) {
        const alertContainer = document.querySelector('.card-body');
        
        // Criar elemento de alerta
        const alertElement = document.createElement('div');
        alertElement.className = 'alert alert-danger alert-dismissible fade show mb-4';
        alertElement.setAttribute('role', 'alert');
        
        alertElement.innerHTML = `
            <strong>Erro!</strong> ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>
        `;
        
        // Inserir no início do container
        alertContainer.prepend(alertElement);
        
        // Auto-remover após 5 segundos
        setTimeout(() => {
            alertElement.classList.remove('show');
            setTimeout(() => alertElement.remove(), 300);
        }, 5000);
    }
    
    // Inicializar
    setupEventListeners();
    loadSurveyData();
});
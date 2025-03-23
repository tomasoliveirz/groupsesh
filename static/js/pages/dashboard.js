/**
 * dashboard.js - Lógica do dashboard/administrador com inicialização otimizada
 */
(function() {
    // Função global para permitir reinicialização após transições AJAX
    window.initDashboard = function() {
        console.log("Inicializando dashboard...");
        
        // Elementos do DOM
        const calendarEl = document.getElementById('calendar');
        const participantsList = document.getElementById('participants-list');
        const participantsCount = document.getElementById('participants-count');
        const creationDate = document.getElementById('creation-date');
        const expiryDate = document.getElementById('expiry-date');
        
        // Verificação defensiva
        if (!calendarEl) {
            console.warn("Elemento do calendário não encontrado, abortando inicialização");
            return;
        }
        
        // Extrair token da URL
        const pathParts = window.location.pathname.split('/');
        const surveyToken = pathParts[pathParts.length - 1];
        if (!surveyToken) {
            UI.showError('Token da survey não encontrado', document.querySelector('.card-body'));
            return;
        }
        
        // Variáveis globais
        let surveyData = null;
        let calendar = null;
        
        // Inicializar usando configuração inicial, se disponível
        const initialConfig = window.DASHBOARD_CONFIG || {};
        
        // Inicializar dashboard
        initDashboard();
        
        /**
         * Inicializa o dashboard com otimização de carregamento:
         * 1. Utiliza dados já disponíveis no template quando possível
         * 2. Carrega dados completos em segundo plano
         * 3. Garante que o criador seja sempre considerado participante
         */
        async function initDashboard() {
            UI.loading(true);
            
            try {
                // Utilizar dados iniciais, se disponíveis
                if (initialConfig.survey && Object.keys(initialConfig.survey).length > 0) {
                    // Atualizar informações básicas imediatamente
                    updateBasicInfoFromConfig(initialConfig.survey);
                    
                    // Inicializar calendário vazio
                    initEmptyCalendar();
                } else {
                    // FASE 1: Carregar informações básicas se não estiverem disponíveis
                    console.log("Dados iniciais não disponíveis, buscando da API...");
                    try {
                        const surveyInfo = await API.getSurveyInfo(surveyToken);
                        updateBasicInfo(surveyInfo);
                        initEmptyCalendar();
                    } catch (apiError) {
                        console.error("Erro ao buscar informações da survey:", apiError);
                        throw new Error("Não foi possível obter informações básicas da survey.");
                    }
                }
                
                // FASE 2: Carregar dados completos
                try {
                    surveyData = await API.getSurveyData(surveyToken);
                    
                    // Verificar se os dados estão completos
                    if (!surveyData || !surveyData.survey || !surveyData.participants) {
                        throw new Error("Dados da survey incompletos ou malformados.");
                    }
                    
                    // Verificar se o admin está nos participantes, e adicionar se necessário
                    ensureAdminIsParticipant(surveyData);
                    
                    // Atualizar contadores
                    if (participantsCount) {
                        participantsCount.textContent = Object.keys(surveyData.participants).length;
                    }
                    
                    // Atualizar calendário com dados
                    updateCalendarWithData(surveyData);
                    
                    // Atualizar lista de participantes
                    updateParticipantsList(surveyData.participants);
                    
                    // Configurar eventos
                    setupEventListeners();
                } catch (dataError) {
                    console.error("Erro ao carregar dados completos:", dataError);
                    throw new Error("Não foi possível carregar os dados completos da survey.");
                }
            } catch (error) {
                console.error("Erro no dashboard:", error);
                UI.showError(error.message || 'Erro ao carregar dados', document.querySelector('.card-body'));
            } finally {
                UI.loading(false);
            }
        }
        
        /**
         * Garante que o admin da survey sempre aparece como participante
         * mesmo se não tiver registrado sua disponibilidade
         */
        function ensureAdminIsParticipant(data) {
            // Verificar se dados necessários estão presentes
            if (!data || !data.survey || !data.participants || 
                !data.survey.admin_email || !data.survey.admin_name) {
                console.warn("Dados insuficientes para garantir admin como participante");
                return;
            }
            
            // Verificar se já existe um participante com o email do admin
            const adminEmail = data.survey.admin_email.toLowerCase();
            const adminExists = Object.values(data.participants).some(
                p => p && p.email && p.email.toLowerCase() === adminEmail && p.is_admin
            );
            
            if (!adminExists) {
                console.log("Admin não está entre os participantes, adicionando...");
                
                // Criar um ID único para o admin
                const adminId = `admin_${Date.now()}`;
                
                // Adicionar admin como participante sem disponibilidades
                data.participants[adminId] = {
                    id: adminId,
                    name: data.survey.admin_name,
                    email: data.survey.admin_email,
                    created_at: data.survey.created_at,
                    is_admin: true,
                    availability_dates: []
                };
            }
        }
        
        /**
         * Atualiza informações básicas da survey a partir do modelo
         */
        function updateBasicInfoFromConfig(surveyConfig) {
            if (!surveyConfig || !surveyConfig.title) {
                console.warn("Configuração da survey incompleta");
                return;
            }
            
            // Atualizar título da página
            document.title = `${surveyConfig.title} - Dashboard`;
            
            // Atualizar título na interface
            const titleEl = document.querySelector('.card-header h2');
            if (titleEl) titleEl.textContent = surveyConfig.title;
            
            // Atualizar datas se necessário
            if (creationDate && surveyConfig.created_at) {
                creationDate.textContent = DateUtils.formatDate(surveyConfig.created_at, true);
            }
            
            if (expiryDate && surveyConfig.expires_at) {
                expiryDate.textContent = DateUtils.formatDate(surveyConfig.expires_at, true);
            }
        }
        
        /**
         * Atualiza informações básicas da survey a partir da resposta da API
         */
        function updateBasicInfo(surveyInfo) {
            if (!surveyInfo || !surveyInfo.title) {
                console.warn("Informações da survey incompletas");
                return;
            }
            
            // Atualizar título
            document.title = `${surveyInfo.title} - Dashboard`;
            
            const titleEl = document.querySelector('.card-header h2');
            if (titleEl) titleEl.textContent = surveyInfo.title;
            
            // Atualizar datas
            if (creationDate && surveyInfo.created_at) {
                creationDate.textContent = DateUtils.formatDate(surveyInfo.created_at, true);
            }
            
            if (expiryDate && surveyInfo.expires_at) {
                expiryDate.textContent = DateUtils.formatDate(surveyInfo.expires_at, true);
            }
            
            // Atualizar link para participação
            const surveyLinkInput = document.getElementById('survey-link');
            if (surveyLinkInput && surveyInfo.token) {
                const baseUrl = window.location.origin;
                const lang = document.documentElement.lang || 'pt-BR';
                surveyLinkInput.value = `${baseUrl}/${lang.substring(0, 2)}/survey/${surveyInfo.token}`;
            }
        }
        
        /**
         * Inicializa calendário vazio com configurações básicas
         */
        function initEmptyCalendar() {
            try {
                console.log("Inicializando calendário vazio...");
                calendar = DateUtils.initCalendar(calendarEl);
                console.log("Calendário inicializado com sucesso");
            } catch (error) {
                console.error("Erro ao inicializar calendário:", error);
                // Adicionar feedback visual de erro
                const errorDiv = document.createElement('div');
                errorDiv.className = 'alert alert-danger';
                
                // Usar textContent em vez de innerHTML para maior segurança
                const errorTitle = document.createElement('strong');
                errorTitle.textContent = 'Erro ao carregar calendário: ';
                errorDiv.appendChild(errorTitle);
                
                const errorMessage = document.createTextNode(error.message);
                errorDiv.appendChild(errorMessage);
                
                if (calendarEl.parentNode) {
                    calendarEl.parentNode.insertBefore(errorDiv, calendarEl);
                }
            }
        }
        
        /**
         * Atualiza o calendário com dados de disponibilidade
         */
        function updateCalendarWithData(data) {
            if (!calendar) {
                console.warn("Calendário não inicializado, impossível atualizar com dados");
                return;
            }
            
            if (!data || !data.availability_by_date) {
                console.warn("Dados de disponibilidade ausentes ou malformados");
                return;
            }
            
            try {
                console.log("Atualizando calendário com dados de disponibilidade...");
                
                // Limpar eventos existentes
                calendar.removeAllEvents();
                
                // Preparar eventos
                const events = [];
                for (const dateStr in data.availability_by_date) {
                    if (Object.prototype.hasOwnProperty.call(data.availability_by_date, dateStr)) {
                        const participants = data.availability_by_date[dateStr];
                        if (Array.isArray(participants)) {
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
                calendar.addEventSource(events);
                
                // Configurar handler de click
                calendar.setOption('dateClick', function(info) {
                    const dateStr = info.dateStr;
                    const participants = data.availability_by_date[dateStr] || [];
                    
                    if (participants.length > 0) {
                        showParticipantsModal(dateStr, participants);
                    }
                });
                
                // Configurar renderização de eventos
                calendar.setOption('eventDidMount', function(info) {
                    if (info.event.extendedProps && info.event.extendedProps.count) {
                        const count = info.event.extendedProps.count;
                        const dayElement = info.el.closest('.fc-daygrid-day');
                        
                        if (!dayElement) {
                            console.warn("Elemento do dia não encontrado");
                            return;
                        }
                        
                        // Adicionar classe para styling
                        dayElement.classList.add('fc-day-has-participants');
                        
                        // Adicionar contador
                        const dayFrame = info.el.closest('.fc-daygrid-day-frame');
                        if (dayFrame) {
                            const countEl = document.createElement('div');
                            countEl.className = 'participant-count';
                            countEl.textContent = count;
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
                calendar.render();
                
                // Atualizar destaque se ativado
                const highlightSwitch = document.getElementById('highlight-switch');
                if (highlightSwitch && highlightSwitch.checked) {
                    setTimeout(() => {
                        document.querySelectorAll('.highlight-participants').forEach(el => {
                            el.classList.add('active');
                        });
                    }, 100);
                }
                
                console.log("Calendário atualizado com sucesso");
            } catch (error) {
                console.error("Erro ao atualizar calendário:", error);
                const parent = calendarEl.parentNode;
                if (parent) {
                    UI.showError("Falha ao atualizar o calendário com os dados: " + error.message, parent);
                }
            }
        }
        
        /**
         * Atualiza a lista de participantes
         */
        function updateParticipantsList(participants, filter = '') {
            if (!participantsList) return;
            
            // Limpar lista atual
            participantsList.innerHTML = '';
            
            // Verificar se temos participantes
            if (!participants || typeof participants !== 'object') {
                UI.showError("Dados de participantes inválidos", participantsList);
                return;
            }
            
            const participantIds = Object.keys(participants);
            
            if (participantIds.length === 0) {
                // Criar um elemento div para a mensagem
                const messageDiv = document.createElement('div');
                messageDiv.className = 'text-center py-5';
                
                // Ícone
                const iconDiv = document.createElement('div');
                iconDiv.className = 'display-4 text-muted mb-3';
                const icon = document.createElement('i');
                icon.className = 'bi bi-people';
                iconDiv.appendChild(icon);
                
                // Texto
                const leadP = document.createElement('p');
                leadP.className = 'lead';
                leadP.textContent = 'Nenhum participante ainda.';
                
                const mutedP = document.createElement('p');
                mutedP.className = 'text-muted';
                mutedP.textContent = 'Compartilhe o link da survey para receber respostas.';
                
                // Montar a mensagem
                messageDiv.appendChild(iconDiv);
                messageDiv.appendChild(leadP);
                messageDiv.appendChild(mutedP);
                
                participantsList.appendChild(messageDiv);
                return;
            }
            
            // Filtrar participantes
            let filteredIds = participantIds;
            if (filter) {
                const lowerFilter = filter.toLowerCase();
                filteredIds = participantIds.filter(id => {
                    const p = participants[id];
                    if (!p || !p.name || !p.email) return false;
                    
                    return p.name.toLowerCase().includes(lowerFilter) || 
                           p.email.toLowerCase().includes(lowerFilter);
                });
            }
            
            if (filteredIds.length === 0) {
                const messageDiv = document.createElement('div');
                messageDiv.className = 'text-center py-3';
                
                const messageP = document.createElement('p');
                messageP.textContent = `Nenhum participante encontrado com o termo "${filter}".`;
                
                messageDiv.appendChild(messageP);
                participantsList.appendChild(messageDiv);
                return;
            }
            
            // Ordenar por: 1) Admin primeiro, 2) Nome alfabeticamente
            filteredIds.sort((a, b) => {
                const pA = participants[a] || {};
                const pB = participants[b] || {};
                
                // Admin sempre primeiro
                if (pA.is_admin && !pB.is_admin) return -1;
                if (!pA.is_admin && pB.is_admin) return 1;
                
                // Depois por nome
                return (pA.name || '').localeCompare(pB.name || '');
            });
            
            // Criar lista
            const list = document.createElement('div');
            list.className = 'list-group';
            
            filteredIds.forEach(id => {
                const participant = participants[id];
                if (!participant) return;
                
                // Verificar dados obrigatórios
                const name = participant.name || 'Nome indisponível';
                const email = participant.email || 'Email indisponível';
                const createdAt = participant.created_at || new Date().toISOString();
                const datesCount = Array.isArray(participant.availability_dates) ? 
                                  participant.availability_dates.length : 0;
                
                // Destacar admin
                const isAdmin = !!participant.is_admin;
                
                // Criar elementos
                const item = document.createElement('a');
                item.href = '#';
                item.className = 'list-group-item list-group-item-action participant-card';
                if (isAdmin) item.classList.add('admin-participant');
                
                // Cabeçalho com nome e data
                const header = document.createElement('div');
                header.className = 'd-flex w-100 justify-content-between';
                
                const nameHeading = document.createElement('h6');
                nameHeading.className = 'mb-1';
                nameHeading.textContent = name;
                
                if (isAdmin) {
                    const adminBadge = document.createElement('span');
                    adminBadge.className = 'admin-badge';
                    adminBadge.textContent = 'Admin';
                    nameHeading.appendChild(adminBadge);
                }
                
                const dateSmall = document.createElement('small');
                dateSmall.textContent = DateUtils.formatDate(createdAt);
                
                header.appendChild(nameHeading);
                header.appendChild(dateSmall);
                
                // Email
                const emailP = document.createElement('p');
                emailP.className = 'mb-1';
                emailP.textContent = email;
                
                // Contagem de dias
                const daysSmall = document.createElement('small');
                daysSmall.className = 'text-muted';
                daysSmall.textContent = `${datesCount} ${datesCount === 1 ? 'dia disponível' : 'dias disponíveis'}`;
                
                // Montar item
                item.appendChild(header);
                item.appendChild(emailP);
                item.appendChild(daysSmall);
                
                // Evento para mostrar detalhes
                item.addEventListener('click', function(e) {
                    e.preventDefault();
                    showParticipantDetails(participant);
                });
                
                list.appendChild(item);
            });
            
            participantsList.appendChild(list);
        }
        
        /**
         * Mostra modal com detalhes de participantes de uma data
         */
        function showParticipantsModal(dateStr, participants) {
            const modalDate = document.getElementById('modal-date');
            const modalParticipantsList = document.getElementById('modal-participants-list');
            
            if (!modalDate || !modalParticipantsList) {
                console.warn("Elementos do modal não encontrados");
                return;
            }
            
            // Formatar data
            modalDate.textContent = DateUtils.formatDate(dateStr);
            
            // Limpar lista
            modalParticipantsList.innerHTML = '';
            
            // Verificar se temos participantes
            if (!Array.isArray(participants) || participants.length === 0) {
                const noParticipantsDiv = document.createElement('div');
                noParticipantsDiv.className = 'text-center py-3';
                noParticipantsDiv.textContent = 'Nenhum participante disponível neste dia.';
                modalParticipantsList.appendChild(noParticipantsDiv);
            } else {
                // Verificar se temos dados completos
                if (!surveyData || !surveyData.participants) {
                    const errorDiv = document.createElement('div');
                    errorDiv.className = 'alert alert-warning';
                    errorDiv.textContent = 'Dados completos não disponíveis. Tente recarregar a página.';
                    modalParticipantsList.appendChild(errorDiv);
                    return;
                }
                
                // Processar cada participante
                participants.forEach(participant => {
                    if (!participant || !participant.participant_id) return;
                    
                    const participantId = participant.participant_id;
                    const fullParticipant = surveyData.participants[participantId];
                    
                    if (!fullParticipant) {
                        console.warn(`Participante ${participantId} não encontrado nos dados completos`);
                        return;
                    }
                    
                    // Criar item da lista
                    const item = document.createElement('a');
                    item.href = '#';
                    item.className = 'list-group-item list-group-item-action';
                    
                    // Destacar admin
                    const isAdmin = !!fullParticipant.is_admin;
                    if (isAdmin) item.classList.add('admin-participant');
                    
                    // Cabeçalho com nome
                    const header = document.createElement('div');
                    header.className = 'd-flex w-100 justify-content-between';
                    
                    const nameHeading = document.createElement('h6');
                    nameHeading.className = 'mb-1';
                    nameHeading.textContent = participant.name || 'Nome indisponível';
                    
                    if (isAdmin) {
                        const adminBadge = document.createElement('span');
                        adminBadge.className = 'admin-badge';
                        adminBadge.textContent = 'Admin';
                        nameHeading.appendChild(adminBadge);
                    }
                    
                    header.appendChild(nameHeading);
                    
                    // Email
                    const emailP = document.createElement('p');
                    emailP.className = 'mb-1';
                    emailP.textContent = participant.email || 'Email indisponível';
                    
                    // Montar item
                    item.appendChild(header);
                    item.appendChild(emailP);
                    
                    // Evento para mostrar detalhes
                    item.addEventListener('click', function(e) {
                        e.preventDefault();
                        showParticipantDetails(fullParticipant);
                    });
                    
                    modalParticipantsList.appendChild(item);
                });
            }
            
            // Mostrar modal
            try {
                const participantsModal = new bootstrap.Modal(document.getElementById('participants-modal'));
                participantsModal.show();
            } catch (error) {
                console.error("Erro ao exibir modal:", error);
                alert("Não foi possível exibir os detalhes dos participantes.");
            }
        }
        
        /**
         * Mostra modal com detalhes de um participante
         */
        function showParticipantDetails(participant) {
            if (!participant) {
                console.warn("Dados do participante não fornecidos");
                return;
            }
            
            const participantInfo = document.getElementById('participant-info');
            const datesList = document.getElementById('participant-dates');
            
            if (!participantInfo || !datesList) {
                console.warn("Elementos do modal de detalhes não encontrados");
                return;
            }
            
            // Fechar modal de participantes da data
            try {
                const participantsModal = bootstrap.Modal.getInstance(document.getElementById('participants-modal'));
                if (participantsModal) participantsModal.hide();
            } catch (error) {
                console.warn("Erro ao fechar modal anterior:", error);
                // Continuar mesmo se houver erro
            }
            
            // Criar card de informações
            participantInfo.innerHTML = '';
            
            const cardDiv = document.createElement('div');
            cardDiv.className = 'card';
            
            const cardBody = document.createElement('div');
            cardBody.className = 'card-body';
            
            // Nome com badge de admin
            const nameTitle = document.createElement('h5');
            nameTitle.className = 'card-title';
            nameTitle.textContent = participant.name || 'Nome indisponível';
            
            if (participant.is_admin) {
                const adminBadge = document.createElement('span');
                adminBadge.className = 'admin-badge';
                adminBadge.textContent = 'Admin';
                nameTitle.appendChild(adminBadge);
            }
            
            // Email
            const emailSubtitle = document.createElement('h6');
            emailSubtitle.className = 'card-subtitle mb-2 text-muted';
            emailSubtitle.textContent = participant.email || 'Email indisponível';
            
            // Data de criação
            const createdText = document.createElement('p');
            createdText.className = 'card-text';
            
            const createdSmall = document.createElement('small');
            createdSmall.className = 'text-muted';
            createdSmall.textContent = 'Resposta enviada em: ' + 
                                      DateUtils.formatDate(participant.created_at || new Date().toISOString(), true);
            
            createdText.appendChild(createdSmall);
            
            // Montar card
            cardBody.appendChild(nameTitle);
            cardBody.appendChild(emailSubtitle);
            cardBody.appendChild(createdText);
            cardDiv.appendChild(cardBody);
            participantInfo.appendChild(cardDiv);
            
            // Preencher lista de datas
            datesList.innerHTML = '';
            
            if (!Array.isArray(participant.availability_dates) || participant.availability_dates.length === 0) {
                const noDatesDiv = document.createElement('div');
                noDatesDiv.className = 'text-center py-3';
                noDatesDiv.textContent = 'Nenhuma data selecionada.';
                datesList.appendChild(noDatesDiv);
            } else {
                // Ordenar datas
                const sortedDates = [...participant.availability_dates].sort();
                
                // Criar itens para cada data
                sortedDates.forEach(dateStr => {
                    const item = document.createElement('div');
                    item.className = 'list-group-item';
                    item.textContent = DateUtils.formatDate(dateStr);
                    datesList.appendChild(item);
                });
            }
            
            // Mostrar modal
            try {
                const participantDetailModal = new bootstrap.Modal(document.getElementById('participant-detail-modal'));
                participantDetailModal.show();
            } catch (error) {
                console.error("Erro ao exibir modal de detalhes:", error);
                alert("Não foi possível exibir os detalhes do participante.");
            }
        }
        
        /**
         * Configura eventos da interface
         */
        function setupEventListeners() {
            // Exportar dados
            const exportBtn = document.getElementById('export-btn');
            if (exportBtn) {
                exportBtn.addEventListener('click', exportToCSV);
            }
            
            const exportResultsBtn = document.getElementById('export-results-btn');
            if (exportResultsBtn) {
                exportResultsBtn.addEventListener('click', exportToCSV);
            }
            
            // Compartilhar link
            const shareBtn = document.getElementById('share-btn');
            if (shareBtn) {
                shareBtn.addEventListener('click', shareSurvey);
            }
            
            const shareSurveyBtn = document.getElementById('share-survey-btn');
            if (shareSurveyBtn) {
                shareSurveyBtn.addEventListener('click', shareSurvey);
            }
            
            // Busca de participantes
            const participantSearch = document.getElementById('participant-search');
            if (participantSearch) {
                participantSearch.addEventListener('input', function() {
                    if (surveyData && surveyData.participants) {
                        updateParticipantsList(surveyData.participants, this.value);
                    }
                });
            }
            
            // Destaque de disponibilidades
            const highlightSwitch = document.getElementById('highlight-switch');
            if (highlightSwitch) {
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
            
            // Navegação do calendário
            const prevMonthBtn = document.getElementById('prev-month-btn');
            if (prevMonthBtn) {
                prevMonthBtn.addEventListener('click', () => {
                    if (calendar) calendar.prev();
                });
            }
            
            const todayBtn = document.getElementById('today-btn');
            if (todayBtn) {
                todayBtn.addEventListener('click', () => {
                    if (calendar) calendar.today();
                });
            }
            
            const nextMonthBtn = document.getElementById('next-month-btn');
            if (nextMonthBtn) {
                nextMonthBtn.addEventListener('click', () => {
                    if (calendar) calendar.next();
                });
            }
        }
        
        /**
         * Função auxiliar para escapar strings CSV
         */
        function escapeCSV(str) {
            if (typeof str !== 'string') return '';
            
            // Se a string contém aspas, vírgulas ou quebras de linha, precisamos escapá-la
            if (/[",\n\r]/.test(str)) {
                // Substituir aspas por aspas duplas e envolver em aspas
                return '"' + str.replace(/"/g, '""') + '"';
            }
            return str;
        }
        
        /**
         * Exporta dados para CSV
         */
        function exportToCSV() {
            if (!surveyData || !surveyData.participants) {
                alert("Dados não disponíveis para exportação");
                return;
            }
            
            try {
                // Criar cabeçalho do CSV
                let csv = 'Nome,Email,Data de Resposta,Dias Disponíveis\n';
                
                // Adicionar dados de cada participante
                for (const id in surveyData.participants) {
                    if (Object.prototype.hasOwnProperty.call(surveyData.participants, id)) {
                        const p = surveyData.participants[id];
                        if (!p) continue;
                        
                        const name = p.name || '';
                        const email = p.email || '';
                        const createdAt = p.created_at ? DateUtils.formatDate(p.created_at, true) : '';
                        
                        let dates = '';
                        if (Array.isArray(p.availability_dates)) {
                            dates = p.availability_dates
                                    .map(d => DateUtils.formatDate(d))
                                    .join('; ');
                        }
                        
                        // Escapar campos e adicionar linha
                        csv += [
                            escapeCSV(name),
                            escapeCSV(email),
                            escapeCSV(createdAt),
                            escapeCSV(dates)
                        ].join(',') + '\n';
                    }
                }
                
                // Gerar nome de arquivo seguro
                let filename = 'survey_export_' + new Date().toISOString().slice(0, 10) + '.csv';
                if (surveyData.survey && surveyData.survey.title) {
                    // Substituir caracteres não permitidos em nomes de arquivo
                    const safeTitle = surveyData.survey.title.replace(/[^\w\s-]/g, '_');
                    filename = `survey_${safeTitle}_${new Date().toISOString().slice(0, 10)}.csv`;
                }
                
                // Criar blob e link para download
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                
                // Usar URL.createObjectURL para compatibilidade com navegadores modernos
                if (window.navigator && window.navigator.msSaveOrOpenBlob) {
                    // Para IE
                    window.navigator.msSaveOrOpenBlob(blob, filename);
                } else {
                    // Para outros navegadores
                    link.href = URL.createObjectURL(blob);
                    link.setAttribute('download', filename);
                    link.style.display = 'none';
                    document.body.appendChild(link);
                    link.click();
                    
                    // Limpar
                    setTimeout(() => {
                        document.body.removeChild(link);
                        URL.revokeObjectURL(link.href);
                    }, 100);
                }
            } catch (error) {
                console.error("Erro ao exportar CSV:", error);
                alert("Não foi possível exportar os dados. Erro: " + error.message);
            }
        }
        
        /**
         * Compartilha link da survey
         */
        function shareSurvey() {
            const surveyLinkInput = document.getElementById('survey-link');
            if (!surveyLinkInput) {
                console.warn("Campo de link da survey não encontrado");
                return;
            }
            
            const link = surveyLinkInput.value;
            if (!link) {
                console.warn("Link da survey vazio");
                return;
            }
            
            try {
                if (navigator.share) {
                    // API Web Share (móveis modernos)
                    navigator.share({
                        title: 'Pesquisa de Disponibilidade',
                        text: `Por favor, participe da pesquisa de disponibilidade: ${surveyData?.survey?.title || 'GroupSesh'}`,
                        url: link
                    })
                    .catch(err => {
                        console.log('Erro ao compartilhar:', err);
                        // Fallback para área de transferência
                        UI.copyToClipboard('survey-link');
                    });
                } else {
                    // Fallback para área de transferência
                    UI.copyToClipboard('survey-link');
                }
            } catch (error) {
                console.error("Erro ao compartilhar:", error);
                alert("Não foi possível compartilhar o link. Copie manualmente.");
            }
        }
    };
    
    // Executar inicialização quando o DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', window.initDashboard);
    } else {
        // O DOM já está pronto
        window.initDashboard();
    }
})();
/**
 * create.js - Lógica da página de criação de survey com inicialização resiliente
 */
(function() {
    'use strict';

    // Garantir que os namespaces necessários existam
    window.GroupSesh = window.GroupSesh || {};
    window.GroupSesh.Core = window.GroupSesh.Core || {};
    window.GroupSesh.Utils = window.GroupSesh.Utils || {};
    
    // Conjunto para armazenar datas selecionadas
    window.selectedDates = window.selectedDates || new Set();
    // Instância do calendário
    window.calendar = window.calendar || null;
    
    // ===================================================
    // DEFINIR FUNÇÕES UTILITÁRIAS CRÍTICAS LOCALMENTE
    // para garantir que estejam sempre disponíveis
    // ===================================================
    
    // Implementação local segura de isPastDate
    function isPastDate(date) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const checkDate = date instanceof Date ? date : new Date(date);
        checkDate.setHours(0, 0, 0, 0);
        
        return checkDate < today;
    }
    
    // Verificar se o CSS do calendário unificado existe, senão injetar
    function ensureCalendarCSS() {
        if (document.getElementById('calendar-unified-css')) {
            return;
        }
        
        console.log('[CreateSurvey] Injetando CSS unificado para calendário');
        const style = document.createElement('style');
        style.id = 'calendar-unified-css';
        style.textContent = `
        /* Células dos Dias */
        .fc-daygrid-day {
            transition: background-color 0.25s ease;
        }

        .fc-day-future {
            cursor: pointer !important;
            position: relative;
        }

        .fc-day-future:hover {
            background-color: rgba(13, 110, 253, 0.05);
        }

        /* Altura mínima das células */
        .fc-daygrid-day-frame {
            min-height: 80px;
            transition: background-color 0.25s ease;
        }

        /* Dias Selecionados - Create Survey */
        .fc-day-selected {
            background-color: rgba(13, 110, 253, 0.25) !important;
            position: relative;
            z-index: 1;
        }

        /* Dias passados */
        .fc-day-past {
            background-color: #f8f9fa;
            cursor: not-allowed !important;
        }

        .theme-dark .fc-day-past {
            background-color: #2a2a2a;
        }
        `;
        document.head.appendChild(style);
    }
    
    // Verificar se o ambiente está pronto para inicialização
    function checkEnvironmentReady() {
        console.log('[CreateSurvey] checkEnvironmentReady called');
        
        // Verificar se estamos realmente na página de criação de survey
        const form = document.getElementById('create-survey-form');
        const calendarEl = document.getElementById('calendar');
        
        if (!form || !calendarEl) {
            console.log('[CreateSurvey] Não estamos na página de criação de survey, ignorando inicialização');
            return;
        }
        
        // Verificar se o FullCalendar está disponível
        if (typeof FullCalendar === 'undefined') {
            console.warn('[CreateSurvey] FullCalendar não disponível. Tentando novamente em 100ms...');
            setTimeout(checkEnvironmentReady, 100);
            return;
        }
        
        console.log("[CreateSurvey] Ambiente básico verificado, prosseguindo com inicialização");
        
        // Garantir que o CSS do calendário existe
        ensureCalendarCSS();
        
        // Inicializar fallbacks para dependências essenciais
        ensureCriticalDependencies();
        
        // Inicializar
        init();
    }
    
    // Garantir que dependências críticas existam, mesmo que como stubs
    function ensureCriticalDependencies() {
        // Fallback para DateUtils se não estiver disponível
        if (typeof DateUtils === 'undefined' && !GroupSesh.Utils.DateUtils) {
            console.warn("[CreateSurvey] DateUtils não encontrado, criando implementação básica");
            
            // Implementação mínima necessária
            window.DateUtils = {
                isPastDate: isPastDate,
                initCalendar: function(element, options = {}) {
                    if (!element) return null;
                    
                    try {
                        const defaultOptions = {
                            initialView: 'dayGridMonth',
                            height: 'auto',
                            locale: document.documentElement.lang?.substring(0, 2) || 'pt'
                        };
                        
                        const mergedOptions = Object.assign({}, defaultOptions, options);
                        const calendar = new FullCalendar.Calendar(element, mergedOptions);
                        calendar.render();
                        return calendar;
                    } catch (error) {
                        console.error('[CreateSurvey] Erro ao inicializar calendário:', error);
                        return null;
                    }
                }
            };
            
            // Também adicionar ao namespace correto
            GroupSesh.Utils.DateUtils = window.DateUtils;
        } else {
            // Se DateUtils existe, garantir que isPastDate existe
            if (typeof DateUtils !== 'undefined' && typeof DateUtils.isPastDate !== 'function') {
                console.warn("[CreateSurvey] DateUtils existe, mas isPastDate não está definido. Aplicando patch...");
                DateUtils.isPastDate = isPastDate;
            }
            
            if (GroupSesh.Utils.DateUtils && typeof GroupSesh.Utils.DateUtils.isPastDate !== 'function') {
                console.warn("[CreateSurvey] GroupSesh.Utils.DateUtils existe, mas isPastDate não está definido. Aplicando patch...");
                GroupSesh.Utils.DateUtils.isPastDate = isPastDate;
            }
        }
        
        // Verificar se API está disponível, senão criar stub
        if (!GroupSesh.Utils.API && typeof API === 'undefined') {
            console.warn("[CreateSurvey] API não encontrada, criando adaptador para APIClient");
            
            // Tentar usar APIClient se disponível
            const client = window.APIClient || {};
            
            // Implementação mínima
            window.API = {
                createSurvey: client.createSurvey 
                    ? client.createSurvey.bind(client) 
                    : async () => { throw new Error('API não disponível'); },
                
                joinSurvey: client.joinSurvey 
                    ? client.joinSurvey.bind(client) 
                    : async () => { throw new Error('API não disponível'); }
            };
            
            // Adicionar ao namespace
            GroupSesh.Utils.API = window.API;
        }
        
        // Verificar se UI está disponível
        if (!GroupSesh.Utils.UIUtils && typeof UI === 'undefined') {
            console.warn("[CreateSurvey] UIUtils não encontrado, criando implementação básica");
            
            // Implementação mínima
            window.UI = {
                showError: function(message, container) {
                    console.error("Erro:", message);
                    
                    if (container) {
                        const alert = document.createElement('div');
                        alert.className = 'alert alert-danger';
                        alert.textContent = message;
                        container.prepend(alert);
                    }
                },
                
                showSuccess: function(message, container) {
                    console.log("Sucesso:", message);
                    
                    if (container) {
                        const alert = document.createElement('div');
                        alert.className = 'alert alert-success';
                        alert.textContent = message;
                        container.prepend(alert);
                    }
                }
            };
            
            // Adicionar ao namespace
            GroupSesh.Utils.UIUtils = window.UI;
        }
    }
    
    // Inicialização principal
    function init() {
        console.log('[CreateSurvey] Inicializando módulo de criação de survey...');
        
        // Verificar novamente se estamos na página de criação de survey
        const form = document.getElementById('create-survey-form');
        const calendarEl = document.getElementById('calendar');
        
        if (!form || !calendarEl) {
            console.log('[CreateSurvey] Não estamos na página de criação de survey, abortando inicialização');
            return;
        }
        
        // Limpar qualquer instância anterior de calendário
        if (window.calendar && typeof window.calendar.destroy === 'function') {
            console.log('[CreateSurvey] Destruindo instância anterior do calendário');
            window.calendar.destroy();
            window.calendar = null;
        }
        
        // Resetar selectedDates para garantir um estado limpo
        // window.selectedDates.clear(); // Comentado para manter seleções entre inicializações
        
        // Elementos DOM principais
        const submitButton = document.getElementById('submit-button');
        const resultContainer = document.getElementById('survey-result');
        const selectedDatesInput = document.getElementById('selected-dates');
        const selectedDaysCounter = document.getElementById('selected-days-counter');
        
        if (!submitButton || !resultContainer) {
            console.error('[CreateSurvey] Elementos DOM essenciais não encontrados. Verificar estrutura HTML.');
            return;
        }
        
        // Inicializar componentes
        initFormValidation(form);
        initializeCalendar(calendarEl);
        setupCalendarNavigation();
        setupFormSubmission(form, submitButton, resultContainer);
        
        console.log('[CreateSurvey] Inicialização concluída com sucesso.');
    }
    
    // Inicialização do formulário
    function initFormValidation(form) {
        if (!form) return;
        
        // Ao digitar, remove a classe de erro
        form.querySelectorAll('input, textarea, select').forEach(field => {
            field.addEventListener('input', function() {
                this.classList.remove('is-invalid');
                
                // Limpar mensagens de erro
                const feedback = this.nextElementSibling;
                if (feedback && feedback.classList.contains('invalid-feedback')) {
                    feedback.style.display = 'none';
                }
            });
        });
    }
    
    // Handler para clique em data no calendário
    function handleDateClick(info) {
        console.log('[CreateSurvey] Clique em data:', info.dateStr);
        
        const dateStr = info.dateStr;
        const dayEl = info.dayEl;
        
        // Usar a função isPastDate local e segura
        if (isPastDate(info.date)) {
            console.log('[CreateSurvey] Data passada, ignorando clique');
            return;
        }
        
        // Toggle seleção
        if (window.selectedDates.has(dateStr)) {
            console.log('[CreateSurvey] Removendo data da seleção:', dateStr);
            window.selectedDates.delete(dateStr);
            dayEl.classList.remove('fc-day-selected');
        } else {
            console.log('[CreateSurvey] Adicionando data à seleção:', dateStr);
            window.selectedDates.add(dateStr);
            dayEl.classList.add('fc-day-selected');
        }
        
        // Atualizar UI
        updateSelectedDatesUI();
    }
    
    /**
     * Handler para o evento datesSet do FullCalendar
     * Este evento é disparado quando a visualização do calendário muda (mudança de mês, ano, etc.)
     * Usamos para reaplciar as classes visuais aos dias que estão selecionados
     */
    function handleDatesSet(info) {
        console.log('[CreateSurvey] Visualização do calendário mudou, reaplicando seleções visuais');
        
        // Se não há dias selecionados, não precisa fazer nada
        if (!window.selectedDates || window.selectedDates.size === 0) {
            return;
        }
        
        // Para cada data selecionada, encontrar o elemento do dia correspondente e adicionar a classe
        setTimeout(() => {
            window.selectedDates.forEach(dateStr => {
                // Encontrar o elemento do dia usando o seletor correto
                // FullCalendar usa atributos data-date para identificar os dias
                const dayEl = document.querySelector(`.fc-daygrid-day[data-date="${dateStr}"]`);
                if (dayEl) {
                    console.log(`[CreateSurvey] Reaplicando classe de seleção visual ao dia ${dateStr}`);
                    dayEl.classList.add('fc-day-selected');
                }
            });
        }, 10); // Pequeno timeout para garantir que o DOM foi atualizado
    }
    
    // Inicialização do calendário
    function initializeCalendar(calendarEl) {
        if (!calendarEl) {
            console.error('[CreateSurvey] Elemento do calendário não encontrado');
            return null;
        }
        
        try {
            console.log('[CreateSurvey] Inicializando calendário...');
            
            // Garantir que o CSS do calendário existe
            ensureCalendarCSS();
            
            // Destruir qualquer instância existente
            if (window.calendar && typeof window.calendar.destroy === 'function') {
                window.calendar.destroy();
                window.calendar = null;
            }
            
            // Criar nova instância diretamente
            window.calendar = new FullCalendar.Calendar(calendarEl, {
                initialView: 'dayGridMonth',
                height: 'auto',
                locale: document.documentElement.lang?.substring(0, 2) || 'pt',
                dateClick: handleDateClick,  // Usar nossa função diretamente
                datesSet: handleDatesSet,    // NOVO: Adicionar handler para evento datesSet
                selectable: true,
                dayMaxEvents: true,
                fixedWeekCount: false
            });
            
            window.calendar.render();
            console.log('[CreateSurvey] Calendário inicializado com sucesso');
            
            // Restaurar seleções visuais
            // Isso vai ser chamado automaticamente pelo evento datesSet quando o calendário for renderizado
            
            return window.calendar;
        } catch (error) {
            console.error('[CreateSurvey] Erro crítico na inicialização do calendário:', error);
            showCalendarError(error.message, calendarEl);
            return null;
        }
    }
    
    // Restaura os estilos visuais das datas selecionadas no calendário atual
    function applySelectedDatesVisuals() {
        if (!window.selectedDates || window.selectedDates.size === 0 || !window.calendar) {
            return;
        }
        
        console.log('[CreateSurvey] Aplicando estilos visuais para', window.selectedDates.size, 'dias selecionados');
        
        // Para cada data selecionada, encontrar o elemento do dia no calendário atual e marcar
        window.selectedDates.forEach(dateStr => {
            const dayEl = document.querySelector(`.fc-daygrid-day[data-date="${dateStr}"]`);
            if (dayEl) {
                dayEl.classList.add('fc-day-selected');
            }
        });
    }
    
    // Configuração dos botões de navegação do calendário
    function setupCalendarNavigation() {
        const prevMonthBtn = document.getElementById('prev-month-btn');
        const nextMonthBtn = document.getElementById('next-month-btn');
        const todayBtn = document.getElementById('today-btn');
        
        if (prevMonthBtn) {
            prevMonthBtn.addEventListener('click', function() {
                if (window.calendar) {
                    window.calendar.prev();
                    // Não é necessário chamar applySelectedDatesVisuals aqui,
                    // pois o evento datesSet será disparado automaticamente
                }
            });
        }
        
        if (nextMonthBtn) {
            nextMonthBtn.addEventListener('click', function() {
                if (window.calendar) {
                    window.calendar.next();
                    // Não é necessário chamar applySelectedDatesVisuals aqui,
                    // pois o evento datesSet será disparado automaticamente
                }
            });
        }
        
        if (todayBtn) {
            todayBtn.addEventListener('click', function() {
                if (window.calendar) {
                    window.calendar.today();
                    // Não é necessário chamar applySelectedDatesVisuals aqui,
                    // pois o evento datesSet será disparado automaticamente
                }
            });
        }
    }
    
    // Atualiza interface com datas selecionadas
    function updateSelectedDatesUI() {
        const daysCounter = document.getElementById('selected-days-counter');
        const datesInput = document.getElementById('selected-dates');
        
        if (daysCounter) {
            daysCounter.textContent = window.selectedDates.size;
        }
        
        if (datesInput) {
            datesInput.value = Array.from(window.selectedDates).join(',');
        }
        
        const calendarFeedback = document.getElementById('calendar-feedback');
        if (calendarFeedback) {
            calendarFeedback.style.display = window.selectedDates.size > 0 ? 'none' : 'block';
        }
        
        console.log('[CreateSurvey] Datas selecionadas atualizadas, total:', window.selectedDates.size);
    }
    
    // Exibe erro do calendário
    function showCalendarError(message, container) {
        const errorMsg = document.createElement('div');
        errorMsg.className = 'alert alert-danger mt-3';
        errorMsg.innerHTML = `
            <strong>Erro ao inicializar calendário:</strong> ${message}
            <button class="btn btn-sm btn-outline-danger mt-2" onclick="location.reload()">
                Recarregar página
            </button>
        `;
        
        if (container && container.parentNode) {
            container.parentNode.appendChild(errorMsg);
        } else {
            // Fallback se o container não estiver disponível
            document.querySelector('.calendar-container')?.appendChild(errorMsg);
        }
    }
    
    // Configuração do envio do formulário
    function setupFormSubmission(form, submitButton, resultContainer) {
        if (!form || !submitButton || !resultContainer) return;
        
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            if (!validateForm(form)) {
                console.warn('[CreateSurvey] Formulário inválido. Corrigindo erros antes de prosseguir.');
                return;
            }
            
            if (window.selectedDates.size === 0) {
                const calendarFeedback = document.getElementById('calendar-feedback');
                if (calendarFeedback) calendarFeedback.style.display = 'block';
                console.warn('[CreateSurvey] Nenhuma data selecionada. Seleção de datas é obrigatória.');
                return;
            }
            
            // Atualizar UI para estado de carregamento
            submitButton.disabled = true;
            submitButton.innerHTML = `<span class="spinner-border spinner-border-sm"></span> ${window.APP_CONFIG?.messages?.creating || 'Criando...'}`;
            
            try {
                console.log('[CreateSurvey] Iniciando submissão de formulário...');
                
                // Preparar dados da survey
                const surveyData = {
                    title: document.getElementById('title').value.trim(),
                    description: document.getElementById('description').value.trim(),
                    admin_name: document.getElementById('admin_name').value.trim(),
                    admin_email: document.getElementById('admin_email').value
                };
                
                console.log('[CreateSurvey] Dados da survey:', surveyData);
                
                // Obter módulo API adequado
                const apiModule = GroupSesh.Utils.API || window.API || window.APIClient;
                
                if (!apiModule || typeof apiModule.createSurvey !== 'function') {
                    throw new Error('Módulo API não disponível ou inválido');
                }
                
                // Criar survey
                console.log('[CreateSurvey] Chamando API.createSurvey...');
                const surveyResponse = await apiModule.createSurvey(surveyData);
                console.log('[CreateSurvey] Survey criada com sucesso:', surveyResponse);
                
                // Dados de disponibilidade
                const availabilityData = {
                    name: surveyData.admin_name,
                    email: surveyData.admin_email,
                    availability_dates: Array.from(window.selectedDates)
                };
                
                // Registrar disponibilidade
                console.log('[CreateSurvey] Registrando disponibilidade do administrador...');
                await apiModule.joinSurvey(surveyResponse.survey.token, availabilityData);
                console.log('[CreateSurvey] Disponibilidade registrada com sucesso');
                
                // Atualizar links na interface
                const participantLinkInput = document.getElementById('participant-link');
                const adminLinkInput = document.getElementById('admin-link');
                const dashboardLink = document.getElementById('go-to-dashboard');
                
                if (participantLinkInput) participantLinkInput.value = surveyResponse.participant_url;
                if (adminLinkInput) adminLinkInput.value = surveyResponse.admin_url;
                if (dashboardLink) dashboardLink.href = surveyResponse.admin_url;
                
                // Animação de transição
                form.style.opacity = '0';
                form.style.transform = 'translateY(-10px)';
                
                setTimeout(() => {
                    form.classList.add('d-none');
                    resultContainer.classList.remove('d-none');
                    
                    setTimeout(() => {
                        resultContainer.style.opacity = '1';
                        resultContainer.style.transform = 'translateY(0)';
                    }, 50);
                    
                    // Persistir dados no localStorage
                    try {
                        localStorage.setItem('lastSurveyTitle', surveyData.title);
                        localStorage.setItem('lastSurveyAdminEmail', surveyData.admin_email);
                        localStorage.setItem('lastSurveyAdminName', surveyData.admin_name);
                        localStorage.setItem('lastSurveyToken', surveyResponse.survey.token);
                    } catch (storageError) {
                        console.warn('[CreateSurvey] Erro ao salvar no localStorage:', storageError);
                    }
                }, 300);
            } catch (error) {
                console.error('[CreateSurvey] Erro na submissão do formulário:', error);
                
                // Obter módulo UI adequado
                const uiModule = GroupSesh.Utils.UIUtils || window.UI;
                
                if (uiModule && typeof uiModule.showError === 'function') {
                    uiModule.showError(
                        error.message || window.APP_CONFIG?.messages?.errorUnknown || 'Erro ao criar survey', 
                        form.parentNode
                    );
                } else {
                    // Fallback manual caso o módulo UI não esteja disponível
                    const errorEl = document.createElement('div');
                    errorEl.className = 'alert alert-danger';
                    errorEl.textContent = error.message || 'Erro desconhecido ao criar survey';
                    form.parentNode.insertBefore(errorEl, form);
                }
            } finally {
                // Restaurar estado do botão
                submitButton.disabled = false;
                submitButton.innerHTML = `<i class="bi bi-calendar-check me-2"></i>${window.APP_CONFIG?.messages?.createSurvey || 'Criar Survey'}`;
            }
        });
    }
    
    // Validação do formulário
    function validateForm(form) {
        if (!form) return false;
        
        let isValid = true;
        
        // Validar campos obrigatórios
        form.querySelectorAll('[required]').forEach(field => {
            if (!field.value.trim()) {
                field.classList.add('is-invalid');
                isValid = false;
            } else {
                field.classList.remove('is-invalid');
            }
        });
        
        return isValid;
    }
    
    // Função para resetar o formulário
    window.resetForm = function() {
        const form = document.getElementById('create-survey-form');
        const resultContainer = document.getElementById('survey-result');
        
        if (!form || !resultContainer) return;
        
        // Resetar formulário
        form.reset();
        
        // Limpar seleções do calendário
        window.selectedDates.clear();
        document.querySelectorAll('.fc-day-selected').forEach(day => {
            day.classList.remove('fc-day-selected');
        });
        
        // Atualizar UI
        updateSelectedDatesUI();
        
        // Animação de transição
        resultContainer.style.opacity = '0';
        resultContainer.style.transform = 'translateY(-10px)';
        
        setTimeout(() => {
            resultContainer.classList.add('d-none');
            form.classList.remove('d-none');
            
            setTimeout(() => {
                form.style.opacity = '1';
                form.style.transform = 'translateY(0)';
            }, 50);
        }, 300);
    };
    
    // Função para compartilhar links
    window.shareLink = function(method) {
        const link = document.getElementById('participant-link')?.value;
        if (!link) return;
        
        const title = document.getElementById('title')?.value || 'Disponibilidade';
        const subject = window.APP_CONFIG?.messages?.emailSubject || 'Sondagem de Disponibilidade';
        const body = (window.APP_CONFIG?.messages?.emailBody || 'Participe desta sondagem: ') + link;
        
        switch (method) {
            case 'email':
                window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
                break;
            case 'whatsapp':
                window.open(`https://wa.me/?text=${encodeURIComponent(body)}`);
                break;
            case 'copy':
                navigator.clipboard.writeText(link)
                    .then(() => alert(window.APP_CONFIG?.messages?.copied || 'Link copiado!'))
                    .catch(err => console.error('[CreateSurvey] Erro ao copiar link:', err));
                break;
        }
    };
    
    // Verificar se estamos realmente na página de create-survey antes de adicionar o
    // evento pageContentUpdated, para evitar execução desnecessária em outras páginas
    function isCreateSurveyPage() {
        return !!document.getElementById('create-survey-form');
    }
    
    // Manipulador de evento para pageContentUpdated
    function handlePageContentUpdated(event) {
        // Verifica se o evento inclui detalhes sobre o tipo de página
        if (event.detail && event.detail.pageType) {
            // Só inicializa se for explicitamente a página create-survey
            if (event.detail.pageType === 'create-survey') {
                console.log('[CreateSurvey] Evento pageContentUpdated para create-survey recebido. Reinicializando...');
                checkEnvironmentReady();
            }
        } else {
            // Verificação de segurança para eventos sem tipo específico
            if (isCreateSurveyPage()) {
                console.log('[CreateSurvey] Evento pageContentUpdated recebido. Verificando se estamos na página create-survey...');
                checkEnvironmentReady();
            }
        }
    }
    
    // Verificação adicional para garantir clicabilidade do calendário
    function ensureCalendarClickability() {
        if (!isCreateSurveyPage()) return;
        
        // Se o calendário já existir, verificar eventos
        if (window.calendar) {
            console.log('[CreateSurvey] Verificando se o calendário tem eventos de clique...');
            
            // Se o calendário já existe mas não tem handler de clique, configurá-lo
            if (!window.calendar._handlers || !window.calendar._handlers.dateClick) {
                console.log('[CreateSurvey] Adicionando handler de clique ao calendário existente');
                window.calendar.setOption('dateClick', handleDateClick);
            }
            
            // Se o calendário não tem handler de mudança de visualização, configurá-lo
            if (!window.calendar._handlers || !window.calendar._handlers.datesSet) {
                console.log('[CreateSurvey] Adicionando handler datesSet ao calendário existente');
                window.calendar.setOption('datesSet', handleDatesSet);
            }
            
            // Aplicar estilos visuais para datas selecionadas
            applySelectedDatesVisuals();
        }
    }
    
    // Garantir eventos ao carregar a página
    setTimeout(ensureCalendarClickability, 500);
    setTimeout(applySelectedDatesVisuals, 500); // Aplicar estilos visuais após meio segundo
    setTimeout(applySelectedDatesVisuals, 1000); // E novamente após um segundo para garantir
    
    // Exportar função para janela global (uso em HTML)
    window.initializeCalendar = initializeCalendar;
    window.checkEnvironmentReady = checkEnvironmentReady;
    window.handleDateClick = handleDateClick; // Expor para possível uso direto
    window.handleDatesSet = handleDatesSet; // Expor o handler de mudança de visualização
    window.applySelectedDatesVisuals = applySelectedDatesVisuals; // Expor função para aplicar estilos
    window.isPastDate = isPastDate; // Expor nossa função segura
    
    // Iniciar verificação quando o DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            // Só inicializa se estivermos na página de create-survey
            if (isCreateSurveyPage()) {
                checkEnvironmentReady();
            }
        });
    } else {
        // DOM já está carregado, verificar se estamos na página certa
        if (isCreateSurveyPage()) {
            checkEnvironmentReady();
        }
    }
    
    // Adicionar ouvinte para o evento pageContentUpdated
    document.removeEventListener('pageContentUpdated', handlePageContentUpdated); // Remove ouvintes duplicados
    document.addEventListener('pageContentUpdated', handlePageContentUpdated);
})();
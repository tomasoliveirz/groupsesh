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
    let selectedDates = new Set();
    // Instância do calendário
    let calendar = null;
    
    // Verificar se o ambiente está pronto para inicialização
    function checkEnvironmentReady() {
        // Verificar se o FullCalendar está disponível
        if (typeof FullCalendar === 'undefined') {
            console.warn('FullCalendar não disponível. Tentando novamente em 100ms...');
            setTimeout(checkEnvironmentReady, 100);
            return;
        }
        
        console.log("Ambiente básico verificado, prosseguindo com inicialização");
        
        // Inicializar fallbacks para dependências essenciais
        ensureCriticalDependencies();
        
        // Inicializar
        init();
    }
    
    // Garantir que dependências críticas existam, mesmo que como stubs
    function ensureCriticalDependencies() {
        // Fallback para DateUtils se não estiver disponível
        if (typeof DateUtils === 'undefined' && !GroupSesh.Utils.DateUtils) {
            console.warn("DateUtils não encontrado, criando implementação básica");
            
            // Implementação mínima necessária
            window.DateUtils = {
                isPastDate: function(date) {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    
                    const checkDate = date instanceof Date ? date : new Date(date);
                    checkDate.setHours(0, 0, 0, 0);
                    
                    return checkDate < today;
                },
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
                        console.error('Erro ao inicializar calendário:', error);
                        return null;
                    }
                }
            };
            
            // Também adicionar ao namespace correto
            GroupSesh.Utils.DateUtils = window.DateUtils;
        }
        
        // Verificar se API está disponível, senão criar stub
        if (!GroupSesh.Utils.API && typeof API === 'undefined') {
            console.warn("API não encontrada, criando adaptador para APIClient");
            
            // Tentar usar APIClient se disponível
            const client = window.APIClient || {};
            
            // Implementação mínima
            window.API = {
                createSurvey: client.createSurvey ? 
                    client.createSurvey.bind(client) : 
                    async () => { throw new Error('API não disponível'); },
                
                joinSurvey: client.joinSurvey ?
                    client.joinSurvey.bind(client) :
                    async () => { throw new Error('API não disponível'); }
            };
            
            // Adicionar ao namespace
            GroupSesh.Utils.API = window.API;
        }
        
        // Verificar se UI está disponível
        if (!GroupSesh.Utils.UIUtils && typeof UI === 'undefined') {
            console.warn("UIUtils não encontrado, criando implementação básica");
            
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
        console.log('Inicializando módulo de criação de survey...');
        
        // Elementos DOM principais
        const form = document.getElementById('create-survey-form');
        const submitButton = document.getElementById('submit-button');
        const resultContainer = document.getElementById('survey-result');
        const selectedDatesInput = document.getElementById('selected-dates');
        const selectedDaysCounter = document.getElementById('selected-days-counter');
        const calendarEl = document.getElementById('calendar');
        
        if (!form || !submitButton || !resultContainer || !calendarEl) {
            console.error('Elementos DOM essenciais não encontrados. Verificar estrutura HTML.');
            return;
        }
        
        // Inicializar componentes
        initFormValidation(form);
        initializeCalendar(calendarEl);
        setupCalendarNavigation();
        setupFormSubmission(form, submitButton, resultContainer);
        
        console.log('Inicialização concluída com sucesso.');
    }
    
    // Inicialização do formulário
    function initFormValidation(form) {
        if (!form) return;
        
        // Adicionar eventos para limpar estados de validação ao digitar
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
    
    // Inicialização do calendário
    function initializeCalendar(calendarEl) {
        if (!calendarEl) {
            console.error('Elemento do calendário não encontrado');
            return null;
        }
        
        try {
            console.log('Inicializando calendário...');
            
            // Obter a implementação de DateUtils mais adequada
            const dateUtilsModule = GroupSesh.Utils.DateUtils || window.DateUtils;
            
            if (!dateUtilsModule || typeof dateUtilsModule.initCalendar !== 'function') {
                throw new Error('DateUtils não possui método initCalendar válido');
            }
            
            // Inicializar calendário
            calendar = dateUtilsModule.initCalendar(calendarEl, {
                dateClick: handleDateClick,
                initialView: 'dayGridMonth',
                height: 'auto'
            });
            
            if (!calendar) {
                throw new Error('Falha ao inicializar objeto calendário');
            }
            
            // Disponibilizar globalmente para acesso pelo DOM
            window.calendar = calendar;
            
            console.log('Calendário inicializado com sucesso');
            return calendar;
        } catch (error) {
            console.error('Erro crítico na inicialização do calendário:', error);
            showCalendarError(error.message, calendarEl);
            return null;
        }
    }
    
    // Configuração dos botões de navegação do calendário
    function setupCalendarNavigation() {
        const prevMonthBtn = document.getElementById('prev-month-btn');
        const nextMonthBtn = document.getElementById('next-month-btn');
        const todayBtn = document.getElementById('today-btn');
        
        if (prevMonthBtn) {
            prevMonthBtn.addEventListener('click', function() {
                if (calendar) calendar.prev();
            });
        }
        
        if (nextMonthBtn) {
            nextMonthBtn.addEventListener('click', function() {
                if (calendar) calendar.next();
            });
        }
        
        if (todayBtn) {
            todayBtn.addEventListener('click', function() {
                if (calendar) calendar.today();
            });
        }
    }
    
    // Handler para clique em data no calendário
    function handleDateClick(info) {
        const dateStr = info.dateStr;
        const dayEl = info.dayEl;
        
        // Obter implementação adequada de DateUtils
        const dateUtilsModule = GroupSesh.Utils.DateUtils || window.DateUtils;
        
        // Ignorar datas passadas
        if (dateUtilsModule.isPastDate(info.date)) return;
        
        // Toggle seleção
        if (selectedDates.has(dateStr)) {
            selectedDates.delete(dateStr);
            dayEl.classList.remove('fc-day-selected');
        } else {
            selectedDates.add(dateStr);
            dayEl.classList.add('fc-day-selected');
        }
        
        // Atualizar UI
        updateSelectedDatesUI();
    }
    
    // Atualiza interface com datas selecionadas
    function updateSelectedDatesUI() {
        const daysCounter = document.getElementById('selected-days-counter');
        const datesInput = document.getElementById('selected-dates');
        
        if (daysCounter) {
            daysCounter.textContent = selectedDates.size;
        }
        
        if (datesInput) {
            datesInput.value = Array.from(selectedDates).join(',');
        }
        
        const calendarFeedback = document.getElementById('calendar-feedback');
        if (calendarFeedback) {
            calendarFeedback.style.display = selectedDates.size > 0 ? 'none' : 'block';
        }
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
                console.warn('Formulário inválido. Corrigindo erros antes de prosseguir.');
                return;
            }
            
            if (selectedDates.size === 0) {
                const calendarFeedback = document.getElementById('calendar-feedback');
                if (calendarFeedback) calendarFeedback.style.display = 'block';
                console.warn('Nenhuma data selecionada. Seleção de datas é obrigatória.');
                return;
            }
            
            // Atualizar UI para estado de carregamento
            submitButton.disabled = true;
            submitButton.innerHTML = `<span class="spinner-border spinner-border-sm"></span> ${window.APP_CONFIG?.messages?.creating || 'Criando...'}`;
            
            try {
                console.log('Iniciando submissão de formulário...');
                
                // Preparar dados da survey
                const surveyData = {
                    title: document.getElementById('title').value.trim(),
                    description: document.getElementById('description').value.trim(),
                    admin_name: document.getElementById('admin_name').value.trim(),
                    admin_email: document.getElementById('admin_email').value
                };
                
                console.log('Dados da survey:', surveyData);
                
                // Obter módulo API adequado
                const apiModule = GroupSesh.Utils.API || window.API || window.APIClient;
                
                if (!apiModule || typeof apiModule.createSurvey !== 'function') {
                    throw new Error('Módulo API não disponível ou inválido');
                }
                
                // Criar survey
                console.log('Chamando API.createSurvey...');
                const surveyResponse = await apiModule.createSurvey(surveyData);
                console.log('Survey criada com sucesso:', surveyResponse);
                
                // Dados de disponibilidade
                const availabilityData = {
                    name: surveyData.admin_name,
                    email: surveyData.admin_email,
                    availability_dates: Array.from(selectedDates)
                };
                
                // Registrar disponibilidade
                console.log('Registrando disponibilidade do administrador...');
                await apiModule.joinSurvey(surveyResponse.survey.token, availabilityData);
                console.log('Disponibilidade registrada com sucesso');
                
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
                        console.warn('Erro ao salvar no localStorage:', storageError);
                    }
                }, 300);
            } catch (error) {
                console.error('Erro na submissão do formulário:', error);
                
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
        selectedDates.clear();
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
                    .catch(err => console.error('Erro ao copiar link:', err));
                break;
        }
    };
    
    // Exportar função para janela global (uso em HTML)
    window.initializeCalendar = initializeCalendar;
    
    // Iniciar verificação quando o DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkEnvironmentReady);
    } else {
        // DOM já está carregado, verificar dependências
        checkEnvironmentReady();
    }
})();
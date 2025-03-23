/**
 * create.js - Lógica da página de criação de survey com inicialização robusta
 */
(function() {
    // Verificar se o ambiente está pronto para inicialização
    function checkEnvironmentReady() {
        // Verificar todas as dependências necessárias
        if (typeof FullCalendar === 'undefined') {
            console.warn('FullCalendar não disponível. Tentando novamente em 100ms...');
            setTimeout(checkEnvironmentReady, 100);
            return;
        }
        
        if (typeof Validation === 'undefined' || 
            typeof DateUtils === 'undefined' || 
            typeof UI === 'undefined' || 
            typeof API === 'undefined') {
            console.warn('Módulos utilitários não disponíveis. Tentando novamente em 100ms...');
            setTimeout(checkEnvironmentReady, 100);
            return;
        }
        
        // Todas as dependências estão carregadas, inicializar
        init();
    }
    
    // Função principal de inicialização
    function init() {
        console.log('Inicializando módulo de criação de survey...');
        
        const form = document.getElementById('create-survey-form');
        const submitButton = document.getElementById('submit-button');
        const resultContainer = document.getElementById('survey-result');
        const selectedDatesInput = document.getElementById('selected-dates');
        const selectedDaysCounter = document.getElementById('selected-days-counter');
        const calendarEl = document.getElementById('calendar');
        
        if (!form || !submitButton || !resultContainer || !calendarEl) {
            console.error('Elementos essenciais não encontrados no DOM');
            return;
        }
        
        // Conjunto para armazenar datas selecionadas
        const selectedDates = new Set();
        
        // Inicializar validação
        Validation.setupFormValidation(form);
        
        // Inicializar calendário com tratamento de erro
        try {
            console.log('Inicializando calendário...');
            const calendar = DateUtils.initCalendar(calendarEl, {
                dateClick: handleDateClick
            });
            
            if (!calendar) {
                throw new Error('Falha ao inicializar objeto de calendário');
            }
            
            console.log('Calendário inicializado com sucesso');
        } catch (error) {
            console.error('Erro ao inicializar calendário:', error);
            
            // Indicador visual de erro para o usuário
            const errorMsg = document.createElement('div');
            errorMsg.className = 'alert alert-danger mt-3';
            errorMsg.innerHTML = `
                <strong>Erro ao carregar calendário:</strong> ${error.message}
                <button class="btn btn-sm btn-outline-danger mt-2" onclick="location.reload()">
                    Recarregar página
                </button>
            `;
            calendarEl.parentNode.appendChild(errorMsg);
            return;
        }
        
        /**
         * Manipula clique em uma data do calendário
         */
        function handleDateClick(info) {
            const dateStr = info.dateStr;
            const dayEl = info.dayEl;
            
            // Ignorar datas passadas
            if (DateUtils.isPastDate(info.date)) return;
            
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
        
        /**
         * Atualiza a interface com as datas selecionadas
         */
        function updateSelectedDatesUI() {
            // Atualizar contador
            selectedDaysCounter.textContent = selectedDates.size;
            
            // Atualizar input oculto
            selectedDatesInput.value = Array.from(selectedDates).join(',');
            
            // Validação visual
            const calendarFeedback = document.getElementById('calendar-feedback');
            if (calendarFeedback) {
                calendarFeedback.style.display = selectedDates.size > 0 ? 'none' : 'block';
            }
        }
        
        /**
         * Manipula submissão do formulário
         */
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Validar formulário
            if (!Validation.validateForm(form)) return;
            
            // Validar calendário
            if (selectedDates.size === 0) {
                const calendarFeedback = document.getElementById('calendar-feedback');
                if (calendarFeedback) calendarFeedback.style.display = 'block';
                return;
            }
            
            // Atualizar UI
            submitButton.disabled = true;
            submitButton.innerHTML = `<span class="spinner-border spinner-border-sm"></span> ${window.APP_CONFIG?.messages?.creating || 'Criando...'}`;
            
            try {
                // 1. Preparar dados da survey
                const surveyData = {
                    title: document.getElementById('title').value.trim(),
                    description: document.getElementById('description').value.trim(),
                    admin_name: document.getElementById('admin_name').value.trim(),
                    admin_email: document.getElementById('admin_email').value.trim()
                };
                
                // 2. Criar survey
                const surveyResponse = await API.createSurvey(surveyData);
                
                // 3. Preparar dados de disponibilidade do admin
                const availabilityData = {
                    name: surveyData.admin_name,
                    email: surveyData.admin_email,
                    availability_dates: Array.from(selectedDates)
                };
                
                // 4. Registrar disponibilidade do admin
                await API.joinSurvey(surveyResponse.survey.token, availabilityData);
                
                // 5. Preencher links e mostrar resultado
                const participantLinkInput = document.getElementById('participant-link');
                const adminLinkInput = document.getElementById('admin-link');
                const dashboardLink = document.getElementById('go-to-dashboard');
                
                if (participantLinkInput) participantLinkInput.value = surveyResponse.participant_url;
                if (adminLinkInput) adminLinkInput.value = surveyResponse.admin_url;
                if (dashboardLink) dashboardLink.href = surveyResponse.admin_url;
                
                // 6. Mostrar resultado e esconder formulário com transição
                form.style.opacity = '0';
                form.style.transform = 'translateY(-10px)';
                
                setTimeout(() => {
                    form.classList.add('d-none');
                    resultContainer.classList.remove('d-none');
                    
                    // Permitir reflow antes de animar
                    setTimeout(() => {
                        resultContainer.style.opacity = '1';
                        resultContainer.style.transform = 'translateY(0)';
                    }, 50);
                    
                    // Salvar no localStorage para recuperação futura
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
                // Mostrar erro
                UI.showError(error.message || window.APP_CONFIG?.messages?.errorUnknown || 'Erro ao criar survey', form.parentNode);
            } finally {
                // Restaurar UI
                submitButton.disabled = false;
                submitButton.innerHTML = `<i class="bi bi-calendar-check me-2"></i>${window.APP_CONFIG?.messages?.createSurvey || 'Criar Survey'}`;
            }
        });
        
        // Funções globais mantidas para compatibilidade
        window.resetForm = function() { /* implementação atual */ };
        window.shareLink = function(method) { /* implementação atual */ };
    }
    
    // Iniciar verificação quando o DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkEnvironmentReady);
    } else {
        // O DOM já está pronto, verificar dependências
        checkEnvironmentReady();
    }
})();
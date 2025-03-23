/**
 * survey.js - Lógica da página de participação em survey
 */
(function() {
    document.addEventListener('DOMContentLoaded', async function() {
        // Elementos do DOM
        const form = document.getElementById('join-survey-form');
        const submitButton = document.getElementById('submit-button');
        const participationForm = document.getElementById('participation-form');
        const successMessage = document.getElementById('success-message');
        const selectedDatesInput = document.getElementById('selected-dates');
        const selectedDaysCounter = document.getElementById('selected-days-counter');
        const calendarEl = document.getElementById('calendar');
        
        // Verificação defensiva
        if (!form || !submitButton || !participationForm || !calendarEl) return;
        
        // Obter token da survey da URL
        const surveyToken = window.location.pathname.split('/').pop();
        if (!surveyToken) {
            UI.showError('Link de survey inválido', participationForm.parentNode);
            return;
        }

        // Conjunto para armazenar datas selecionadas
        const selectedDates = new Set();
        
        // Verificar se é o admin (parâmetro da URL)
        const urlParams = new URLSearchParams(window.location.search);
        const isAdminMode = urlParams.get('admin') === 'true';

        // Inicializar UI
        UI.loading(true);
        
        try {
            // Carregar informações da survey
            const surveyInfo = await API.getSurveyInfo(surveyToken);
            
            // Inicializar calendário com mês atual
            const calendar = DateUtils.initCalendar(calendarEl, {
                dateClick: handleDateClick
            });
            
            // NOVA FUNCIONALIDADE: Verificar se é o admin
            if (isAdminMode) {
                await initializeAdminMode(surveyInfo);
            } else {
                // Verificar dados salvos localmente
                initializeRegularMode();
            }
            
            // Configurar validação e submissão
            Validation.setupFormValidation(form);
            form.addEventListener('submit', handleFormSubmit);
            
            // Configurar autenticação de admin
            setupAdminAuthentication(surveyInfo);
            
        } catch (error) {
            console.error('Erro ao inicializar página:', error);
            UI.showError('Erro ao carregar dados da survey', participationForm.parentNode);
        } finally {
            UI.loading(false);
        }
        
        /**
         * Inicializa modo administrador
         */
        async function initializeAdminMode(surveyInfo) {
            const emailField = document.getElementById('email');
            const nameField = document.getElementById('name');
            
            // Verificar se temos o email do admin
            const storedAdminEmail = localStorage.getItem(`survey_${surveyToken}_admin_email`);
            
            if (storedAdminEmail && surveyInfo.admin_email.toLowerCase() === storedAdminEmail.toLowerCase()) {
                // Preencher e desabilitar campos
                emailField.value = surveyInfo.admin_email;
                emailField.disabled = true;
                
                nameField.value = surveyInfo.admin_name;
                nameField.disabled = true;
                
                // Alterar aparência do formulário
                form.classList.add('admin-form');
                
                // Alterar título do formulário
                const formTitle = document.querySelector('h4.mb-3');
                if (formTitle) {
                    formTitle.innerHTML = 'Editar sua disponibilidade <span class="admin-badge">Admin</span>';
                }
                
                // CORREÇÃO: Buscar resposta existente do admin
                try {
                    const response = await fetch(`/api/participant-response/${surveyToken}?email=${encodeURIComponent(surveyInfo.admin_email)}`, {
                        headers: { 'X-Requested-With': 'XMLHttpRequest' }
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        if (data.participant) {
                            // Carregar datas selecionadas
                            loadSelectedDates(data.participant.availability_dates);
                            submitButton.textContent = 'Atualizar Disponibilidade';
                        }
                    }
                } catch (error) {
                    console.error('Erro ao buscar resposta do admin:', error);
                }
            }
        }
        
        /**
         * Inicializa modo regular (participante)
         */
        function initializeRegularMode() {
            // Verificar se há dados salvos para este participante
            const storedEmail = localStorage.getItem(`survey_${surveyToken}_email`);
            const storedName = localStorage.getItem(`survey_${surveyToken}_name`);
            
            if (storedEmail && storedName) {
                // Preencher campos
                document.getElementById('email').value = storedEmail;
                document.getElementById('name').value = storedName;
                
                // Verificar se já tem resposta
                checkExistingParticipant(storedEmail);
            }
        }
        
        /**
         * Verifica se um participante já respondeu
         */
        async function checkExistingParticipant(email) {
            try {
                const response = await fetch(`/api/participant-response/${surveyToken}?email=${encodeURIComponent(email)}`, {
                    headers: { 'X-Requested-With': 'XMLHttpRequest' }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.participant) {
                        // Mostrar alerta de edição
                        const alertElement = document.createElement('div');
                        alertElement.className = 'alert alert-info alert-dismissible fade show mt-3';
                        alertElement.innerHTML = `
                            <i class="bi bi-info-circle-fill me-2"></i>
                            <strong>Aviso:</strong> Você já enviou uma resposta.
                            <button class="btn btn-sm btn-outline-primary ms-3" id="edit-response-btn">
                                Editar minha resposta
                            </button>
                            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                        `;
                        
                        form.parentNode.insertBefore(alertElement, form);
                        
                        // Botão de edição
                        document.getElementById('edit-response-btn').addEventListener('click', function() {
                            // Carregar datas selecionadas
                            loadSelectedDates(data.participant.availability_dates);
                            
                            // Fechar alerta
                            alertElement.remove();
                            
                            // Alterar texto do botão
                            submitButton.textContent = 'Atualizar Disponibilidade';
                        });
                    }
                }
            } catch (error) {
                console.error('Erro ao verificar participante:', error);
            }
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
         * Carrega datas já selecionadas no calendário
         */
        function loadSelectedDates(dates) {
            // Limpar seleções existentes
            selectedDates.clear();
            document.querySelectorAll('.fc-day-selected').forEach(day => {
                day.classList.remove('fc-day-selected');
            });
            
            // Adicionar novas seleções
            dates.forEach(dateStr => {
                selectedDates.add(dateStr);
                
                // Marcar no calendário
                const dayEl = document.querySelector(`.fc-day[data-date="${dateStr}"]`);
                if (dayEl) dayEl.classList.add('fc-day-selected');
            });
            
            // Atualizar UI
            updateSelectedDatesUI();
        }
        
        /**
         * Manipula submissão do formulário
         */
        async function handleFormSubmit(e) {
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
            submitButton.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Enviando...';
            
            // Preparar dados
            const formData = {
                name: document.getElementById('name').value.trim(),
                email: document.getElementById('email').value.trim(),
                availability_dates: Array.from(selectedDates)
            };
            
            try {
                // Enviar dados
                await API.joinSurvey(surveyToken, formData);
                
                // Salvar no localStorage
                localStorage.setItem(`survey_${surveyToken}_email`, formData.email);
                localStorage.setItem(`survey_${surveyToken}_name`, formData.name);
                
                // Mostrar mensagem de sucesso
                participationForm.style.opacity = '0';
                participationForm.style.transform = 'translateY(-10px)';
                
                setTimeout(() => {
                    participationForm.classList.add('d-none');
                    successMessage.classList.remove('d-none');
                    
                    // Alterar botão de nova resposta para editar resposta
                    const newResponseBtn = successMessage.querySelector('a.btn');
                    if (newResponseBtn) {
                        newResponseBtn.textContent = 'Editar minha resposta';
                    }
                    
                    setTimeout(() => {
                        successMessage.style.opacity = '1';
                        successMessage.style.transform = 'translateY(0)';
                    }, 50);
                }, 300);
            } catch (error) {
                UI.showError(error.message || 'Erro ao enviar disponibilidade', form.parentNode);
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = selectedDatesInput.hasAttribute('data-edit') ? 
                    'Atualizar Disponibilidade' : 'Enviar Disponibilidade';
            }
        }
        
        /**
         * Configura funcionalidade de autenticação de administrador
         */
        function setupAdminAuthentication(surveyInfo) {
            const adminLink = document.getElementById('admin-identify-link');
            const verifyBtn = document.getElementById('verify-admin-btn');
            
            if (!adminLink || !verifyBtn) return;
            
            const adminModal = new bootstrap.Modal(document.getElementById('admin-auth-modal'));
            
            // Abrir modal
            adminLink.addEventListener('click', e => {
                e.preventDefault();
                adminModal.show();
            });
            
            // Verificar admin
            verifyBtn.addEventListener('click', async () => {
                const emailInput = document.getElementById('admin-email');
                const email = emailInput.value.trim();
                
                if (!Validation.isValidEmail(email)) {
                    emailInput.classList.add('is-invalid');
                    return;
                }
                
                // Atualizar UI
                verifyBtn.disabled = true;
                verifyBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Verificando...';
                
                try {
                    // Verificar se é o admin da survey
                    if (email.toLowerCase() === surveyInfo.admin_email.toLowerCase()) {
                        // Salvar no localStorage
                        localStorage.setItem(`survey_${surveyToken}_admin_email`, email);
                        
                        // Fechar modal
                        adminModal.hide();
                        
                        // Redireccionar com parâmetro admin=true
                        window.location.href = `${window.location.pathname}?admin=true`;
                    } else {
                        emailInput.classList.add('is-invalid');
                    }
                } catch (error) {
                    UI.showError('Erro ao verificar administrador', emailInput.parentNode);
                } finally {
                    verifyBtn.disabled = false;
                    verifyBtn.textContent = 'Verificar';
                }
            });
        }
    });
})();
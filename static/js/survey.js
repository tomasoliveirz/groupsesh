/**
 * survey.js - Funcionalidades da página de participação na survey
 * 
 * Este script gerencia a seleção de datas no calendário, a validação do formulário
 * e o envio das disponibilidades do usuário.
 */

document.addEventListener('DOMContentLoaded', function() {
    // Elementos do DOM
    const form = document.getElementById('join-survey-form');
    const submitButton = document.getElementById('submit-button');
    const participationForm = document.getElementById('participation-form');
    const successMessage = document.getElementById('success-message');
    const selectedDatesInput = document.getElementById('selected-dates');
    const selectedDaysCounter = document.getElementById('selected-days-counter');
    
    // Token da survey extraído da URL
    const surveyToken = window.location.pathname.split('/').pop();
    
    // Conjunto para armazenar as datas selecionadas
    const selectedDates = new Set();
    
    /**
     * Inicializa o calendário FullCalendar com as configurações necessárias
     */
    function initializeCalendar() {
        const calendarEl = document.getElementById('calendar');
        const calendar = new FullCalendar.Calendar(calendarEl, {
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
            selectable: false,
            dateClick: function(info) {
                handleDateClick(info);
            }
        });
        
        calendar.render();
        return calendar;
    }
    
    /**
     * Manipula o clique em uma data no calendário
     * @param {Object} info - Informações sobre a data clicada
     */
    function handleDateClick(info) {
        const dateStr = info.dateStr;
        const dayEl = info.dayEl;
        
        // Ignorar datas passadas
        if (info.date < new Date().setHours(0, 0, 0, 0)) {
            return;
        }
        
        // Toggle seleção
        if (selectedDates.has(dateStr)) {
            selectedDates.delete(dateStr);
            dayEl.classList.remove('fc-day-selected');
        } else {
            selectedDates.add(dateStr);
            dayEl.classList.add('fc-day-selected');
        }
        
        // Atualizar contador e input oculto
        updateSelectedDatesUI();
    }
    
    /**
     * Atualiza a interface com as informações das datas selecionadas
     */
    function updateSelectedDatesUI() {
        // Atualizar contador
        selectedDaysCounter.textContent = selectedDates.size;
        
        // Atualizar input oculto
        selectedDatesInput.value = Array.from(selectedDates).join(',');
        
        // Validação visual
        if (selectedDates.size > 0) {
            document.getElementById('calendar-feedback').style.display = 'none';
        }
    }
    
    /**
     * Valida os campos do formulário antes do envio
     * @returns {boolean} Retorna true se o formulário for válido, false caso contrário
     */
    function validateForm() {
        let isValid = true;
        const requiredFields = form.querySelectorAll('[required]');
        
        // Validar campos obrigatórios
        requiredFields.forEach(field => {
            if (field.id !== 'selected-dates' && !field.value.trim()) {
                field.classList.add('is-invalid');
                isValid = false;
            } else {
                field.classList.remove('is-invalid');
            }
        });
        
        // Validação do e-mail
        const emailField = document.getElementById('email');
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (emailField.value && !emailRegex.test(emailField.value)) {
            emailField.classList.add('is-invalid');
            isValid = false;
        }
        
        // Validação das datas selecionadas
        if (selectedDates.size === 0) {
            document.getElementById('calendar-feedback').style.display = 'block';
            isValid = false;
        }
        
        return isValid;
    }
    
    /**
     * Manipulador de evento para submissão do formulário
     * @param {Event} e - Evento de submissão do formulário
     */
    function handleFormSubmit(e) {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        // Desabilitar botão e mostrar loading
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Enviando...';
        
        // Obter dados do formulário
        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        
        // Preparar dados
        const formData = {
            name: name,
            email: email,
            availability_dates: Array.from(selectedDates)
        };
        
        // Enviar dados para a API
        submitAvailability(formData);
    }
    
    /**
     * Envia os dados de disponibilidade para a API
     * @param {Object} data - Dados do formulário a serem enviados
     */
    async function submitAvailability(data) {
        try {
            // Enviar requisição
            const response = await fetch(`/api/join-survey/${surveyToken}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken // Global definido em base.html
                },
                body: JSON.stringify(data)
            });
            
            // Processar resposta
            if (response.ok) {
                // Salvar dados no localStorage para permitir edição futura
                localStorage.setItem(`survey_${surveyToken}_email`, data.email);
                localStorage.setItem(`survey_${surveyToken}_name`, data.name);
                
                // Mostrar mensagem de sucesso
                participationForm.classList.add('d-none');
                successMessage.classList.remove('d-none');
            } else {
                // Erro na API
                const errorData = await response.json();
                showErrorMessage(errorData.error || 'Erro desconhecido ao registrar disponibilidade.');
            }
        } catch (error) {
            console.error('Erro:', error);
            showErrorMessage('Erro ao comunicar com o servidor. Verifique sua conexão de internet.');
        } finally {
            // Restaurar botão
            submitButton.disabled = false;
            submitButton.innerHTML = 'Enviar Disponibilidade';
        }
    }
    
    /**
     * Exibe uma mensagem de erro na interface
     * @param {string} message - Mensagem de erro a ser exibida
     */
    function showErrorMessage(message) {
        // Criar elemento de alerta
        const alertElement = document.createElement('div');
        alertElement.className = 'alert alert-danger alert-dismissible fade show';
        alertElement.setAttribute('role', 'alert');
        
        alertElement.innerHTML = `
            <strong>Erro!</strong> ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>
        `;
        
        // Inserir antes do formulário
        form.parentNode.insertBefore(alertElement, form);
        
        // Auto-remover após 5 segundos
        setTimeout(() => {
            alertElement.classList.remove('show');
            setTimeout(() => alertElement.remove(), 300);
        }, 5000);
    }
    
    /**
     * Inicializa o formulário com dados salvos anteriormente (se houver)
     */
    function initializeWithSavedData() {
        // Verificar se já respondeu antes (usando localStorage)
        const storedEmail = localStorage.getItem(`survey_${surveyToken}_email`);
        const storedName = localStorage.getItem(`survey_${surveyToken}_name`);
        
        if (storedEmail && storedName) {
            document.getElementById('email').value = storedEmail;
            document.getElementById('name').value = storedName;
        }
    }
    
    // Inicializar o calendário
    const calendar = initializeCalendar();
    
    // Inicializar com dados salvos (se houver)
    initializeWithSavedData();
    
    // Adicionar handler de submissão do formulário
    form.addEventListener('submit', handleFormSubmit);
    
    // Eventos adicionais para melhorar a UX
    document.querySelectorAll('input').forEach(input => {
        // Remover classe de inválido ao começar a digitar
        input.addEventListener('input', function() {
            this.classList.remove('is-invalid');
        });
    });
});
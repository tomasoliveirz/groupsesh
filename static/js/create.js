/**
 * create.js - Funcionalidades da página de criação de survey
 * 
 * Este script gerencia a validação do formulário, o envio da requisição AJAX
 * e a exibição dos resultados na página de criação de survey.
 */

document.addEventListener('DOMContentLoaded', function() {
    // Elementos do DOM
    const form = document.getElementById('create-survey-form');
    const submitButton = document.getElementById('submit-button');
    const resultContainer = document.getElementById('survey-result');
    
    /**
     * Valida os campos do formulário antes do envio
     * @returns {boolean} Retorna true se o formulário for válido, false caso contrário
     */
    function validateForm() {
        let isValid = true;
        const requiredFields = form.querySelectorAll('[required]');
        
        // Validar campos obrigatórios
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                field.classList.add('is-invalid');
                isValid = false;
            } else {
                field.classList.remove('is-invalid');
            }
        });
        
        // Validação adicional para e-mail
        const emailField = document.getElementById('admin_email');
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (emailField.value && !emailRegex.test(emailField.value)) {
            emailField.classList.add('is-invalid');
            isValid = false;
        }
        
        return isValid;
    }
    
    /**
     * Manipulador de evento para submissão do formulário
     * @param {Event} e - Evento de submissão do formulário
     */
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        // Desabilitar botão e mostrar loading
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Criando...';
        
        // Preparar dados do formulário
        const formData = {
            title: document.getElementById('title').value.trim(),
            description: document.getElementById('description').value.trim(),
            admin_name: document.getElementById('admin_name').value.trim(),
            admin_email: document.getElementById('admin_email').value.trim()
        };
        
        try {
            // Enviar requisição para a API
            const response = await fetch('/api/create-survey', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken // Global definido em base.html
                },
                body: JSON.stringify(formData)
            });
            
            // Processar resposta
            if (response.ok) {
                const data = await response.json();
                
                // Preencher links nos inputs
                document.getElementById('participant-link').value = data.participant_url;
                document.getElementById('admin-link').value = data.admin_url;
                document.getElementById('go-to-dashboard').href = data.admin_url;
                
                // Mostrar resultado e esconder formulário
                form.classList.add('d-none');
                resultContainer.classList.remove('d-none');
                
                // Salvar links no localStorage para fácil recuperação
                localStorage.setItem('lastSurveyAdminUrl', data.admin_url);
                localStorage.setItem('lastSurveyParticipantUrl', data.participant_url);
            } else {
                // Erro na API
                const errorData = await response.json();
                showErrorMessage(errorData.error || 'Erro desconhecido ao criar survey.');
            }
        } catch (error) {
            console.error('Erro:', error);
            showErrorMessage('Erro ao comunicar com o servidor. Verifique sua conexão de internet.');
        } finally {
            // Restaurar botão
            submitButton.disabled = false;
            submitButton.innerHTML = 'Criar Pesquisa';
        }
    });
    
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
     * Reseta o formulário e volta para o estado inicial
     */
    window.resetForm = function() {
        form.reset();
        form.classList.remove('d-none');
        resultContainer.classList.add('d-none');
        
        // Remover classes de validação
        form.querySelectorAll('.is-invalid').forEach(el => {
            el.classList.remove('is-invalid');
        });
    };
    
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
        const originalText = button.innerText;
        button.innerText = 'Copiado!';
        setTimeout(() => {
            button.innerText = originalText;
        }, 2000);
    };
    
    // Eventos adicionais para melhorar a UX
    document.querySelectorAll('input, textarea').forEach(input => {
        // Remover classe de inválido ao começar a digitar
        input.addEventListener('input', function() {
            this.classList.remove('is-invalid');
        });
    });
});
/**
 * validation.js - Funções para validação de formulários e dados
 */
const Validation = {
    /**
     * Valida um formulário com base em atributos required e tipos específicos
     * @param {HTMLFormElement} form - Formulário a validar
     * @returns {boolean} true se válido, false caso contrário
     */
    validateForm(form) {
        if (!form) return false;
        
        let isValid = true;
        const requiredFields = form.querySelectorAll('[required]');
        
        // Limpa validações anteriores
        form.querySelectorAll('.is-invalid').forEach(field => {
            field.classList.remove('is-invalid');
        });
        
        // Valida campos obrigatórios
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                field.classList.add('is-invalid');
                isValid = false;
            }
        });
        
        // Valida emails
        const emailFields = form.querySelectorAll('input[type="email"]');
        emailFields.forEach(field => {
            if (field.value.trim() && !this.isValidEmail(field.value)) {
                field.classList.add('is-invalid');
                isValid = false;
            }
        });
        
        return isValid;
    },
    
    /**
     * Valida formato de email
     * @param {string} email - Email para validar
     * @returns {boolean} true se válido, false caso contrário
     */
    isValidEmail(email) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailPattern.test(email);
    },
    
    /**
     * Configura handlers para remover classes de inválido ao digitar
     * @param {HTMLFormElement} form - Formulário a configurar
     */
    setupFormValidation(form) {
        if (!form) return;
        
        form.querySelectorAll('input, textarea, select').forEach(field => {
            field.addEventListener('input', function() {
                this.classList.remove('is-invalid');
                
                // Também esconde mensagens de erro associadas
                const feedback = this.nextElementSibling;
                if (feedback && feedback.classList.contains('invalid-feedback')) {
                    feedback.style.display = 'none';
                }
            });
        });
    }
};
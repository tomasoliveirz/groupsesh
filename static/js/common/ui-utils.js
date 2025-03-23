/**
 * ui-utils.js - Componentes e utilidades de interface reutilizáveis
 */
const UI = {
    /**
     * Mostra um indicador de carregamento na página
     * @param {boolean} show - Mostrar ou esconder o indicador
     */
    loading(show) {
        let loader = document.getElementById('page-loading-indicator');
        
        if (show) {
            if (!loader) {
                loader = document.createElement('div');
                loader.id = 'page-loading-indicator';
                loader.innerHTML = `
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Carregando...</span>
                    </div>
                `;
                
                Object.assign(loader.style, {
                    position: 'fixed',
                    top: '0',
                    left: '0',
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(255, 255, 255, 0.7)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: '9999',
                    opacity: '0',
                    transition: 'opacity 0.2s ease'
                });
                
                document.body.appendChild(loader);
                
                // Trigger reflow
                loader.offsetHeight;
                loader.style.opacity = '1';
            } else {
                loader.style.display = 'flex';
                loader.style.opacity = '1';
            }
        } else if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.style.display = 'none';
            }, 200);
        }
    },

    /**
     * Mostra uma mensagem de erro
     * @param {string} message - Mensagem de erro
     * @param {HTMLElement} container - Container onde mostrar o erro
     * @param {number} duration - Duração em ms (0 para não auto-remover)
     */
    showError(message, container, duration = 5000) {
        // Remover alertas existentes
        const existingAlert = container.querySelector('.alert-danger');
        if (existingAlert) existingAlert.remove();
        
        const alertElement = document.createElement('div');
        alertElement.className = 'alert alert-danger alert-dismissible fade show';
        alertElement.innerHTML = `
            <i class="bi bi-exclamation-triangle-fill me-2"></i>
            <strong>Erro:</strong> ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        
        container.insertAdjacentElement('afterbegin', alertElement);
        
        // Auto-remover após o tempo especificado
        if (duration > 0) {
            setTimeout(() => {
                if (alertElement.parentNode) {
                    alertElement.classList.remove('show');
                    setTimeout(() => alertElement.remove(), 300);
                }
            }, duration);
        }
        
        return alertElement;
    },

    /**
     * Mostra uma mensagem de sucesso
     * @param {string} message - Mensagem de sucesso
     * @param {HTMLElement} container - Container onde mostrar o sucesso
     * @param {number} duration - Duração em ms (0 para não auto-remover)
     */
    showSuccess(message, container, duration = 3000) {
        const alertElement = document.createElement('div');
        alertElement.className = 'alert alert-success alert-dismissible fade show';
        alertElement.innerHTML = `
            <i class="bi bi-check-circle-fill me-2"></i>
            <strong>Sucesso:</strong> ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        
        container.insertAdjacentElement('afterbegin', alertElement);
        
        // Auto-remover após o tempo especificado
        if (duration > 0) {
            setTimeout(() => {
                if (alertElement.parentNode) {
                    alertElement.classList.remove('show');
                    setTimeout(() => alertElement.remove(), 300);
                }
            }, duration);
        }
        
        return alertElement;
    },

    /**
     * Copia texto para a área de transferência
     * @param {string} elementId - ID do elemento input
     * @returns {boolean} Sucesso da operação
     */
    copyToClipboard(elementId) {
        const element = document.getElementById(elementId);
        if (!element) return false;
        
        element.select();
        element.setSelectionRange(0, 99999);
        
        try {
            // Método moderno
            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(element.value);
            } else {
                // Fallback
                document.execCommand('copy');
            }
            
            // Feedback visual
            const button = element.nextElementSibling;
            if (button) {
                const originalHTML = button.innerHTML;
                button.innerHTML = '<i class="bi bi-check"></i>';
                setTimeout(() => {
                    button.innerHTML = originalHTML;
                }, 2000);
            }
            
            return true;
        } catch (err) {
            console.error('Erro ao copiar:', err);
            return false;
        }
    }
};
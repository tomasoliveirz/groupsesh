/**
 * notifications.js - Sistema de notificações e alertas
 */
const Notifications = {
    /**
     * Tipos de notificação disponíveis
     * @readonly
     * @enum {string}
     */
    TYPES: {
        SUCCESS: 'success',
        ERROR: 'danger',
        WARNING: 'warning',
        INFO: 'info'
    },
    
    /**
     * Mostra um indicador de carregamento global na página
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
     * @returns {HTMLElement} Elemento criado
     */
    showError(message, container, duration = 5000) {
        return this.show(message, container, this.TYPES.ERROR, duration);
    },

    /**
     * Mostra uma mensagem de sucesso
     * @param {string} message - Mensagem de sucesso
     * @param {HTMLElement} container - Container onde mostrar o sucesso
     * @param {number} duration - Duração em ms (0 para não auto-remover)
     * @returns {HTMLElement} Elemento criado
     */
    showSuccess(message, container, duration = 3000) {
        return this.show(message, container, this.TYPES.SUCCESS, duration);
    },
    
    /**
     * Mostra uma mensagem de aviso
     * @param {string} message - Mensagem de aviso
     * @param {HTMLElement} container - Container onde mostrar o aviso
     * @param {number} duration - Duração em ms (0 para não auto-remover)
     * @returns {HTMLElement} Elemento criado
     */
    showWarning(message, container, duration = 4000) {
        return this.show(message, container, this.TYPES.WARNING, duration);
    },
    
    /**
     * Mostra uma mensagem informativa
     * @param {string} message - Mensagem informativa
     * @param {HTMLElement} container - Container onde mostrar a informação
     * @param {number} duration - Duração em ms (0 para não auto-remover)
     * @returns {HTMLElement} Elemento criado
     */
    showInfo(message, container, duration = 3000) {
        return this.show(message, container, this.TYPES.INFO, duration);
    },
    
    /**
     * Mostra uma notificação genérica
     * @param {string} message - Mensagem a exibir
     * @param {HTMLElement} container - Elemento container
     * @param {string} type - Tipo de notificação (de TYPES)
     * @param {number} duration - Duração em ms (0 para não auto-remover)
     * @returns {HTMLElement} Elemento criado
     */
    show(message, container, type = this.TYPES.INFO, duration = 3000) {
        if (!container) {
            console.warn('Notification container not provided');
            return null;
        }
        
        // Remover alertas existentes do mesmo tipo
        const existingAlert = container.querySelector(`.alert-${type}`);
        if (existingAlert) existingAlert.remove();
        
        // Criar elemento alert
        const alertElement = document.createElement('div');
        alertElement.className = `alert alert-${type} alert-dismissible fade show`;
        
        // Ícone baseado no tipo
        let iconClass;
        switch (type) {
            case this.TYPES.SUCCESS:
                iconClass = 'bi-check-circle-fill';
                break;
            case this.TYPES.ERROR:
                iconClass = 'bi-exclamation-triangle-fill';
                break;
            case this.TYPES.WARNING:
                iconClass = 'bi-exclamation-circle-fill';
                break;
            default: // INFO
                iconClass = 'bi-info-circle-fill';
                break;
        }
        
        // Título baseado no tipo
        let title;
        switch (type) {
            case this.TYPES.SUCCESS:
                title = 'Sucesso:';
                break;
            case this.TYPES.ERROR:
                title = 'Erro:';
                break;
            case this.TYPES.WARNING:
                title = 'Atenção:';
                break;
            default: // INFO
                title = 'Informação:';
                break;
        }
        
        alertElement.innerHTML = `
            <i class="bi ${iconClass} me-2"></i>
            <strong>${title}</strong> ${message}
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
     * Exibe um toast flutuante
     * @param {string} message - Mensagem a exibir
     * @param {string} type - Tipo de toast (de TYPES)
     * @param {number} duration - Duração em ms
     */
    toast(message, type = this.TYPES.INFO, duration = 3000) {
        // Verificar disponibilidade de Bootstrap
        if (typeof bootstrap === 'undefined' || !bootstrap.Toast) {
            // Fallback para alert
            alert(message);
            return;
        }
        
        // Criar elemento toast
        const toastEl = document.createElement('div');
        toastEl.className = `toast align-items-center text-white bg-${type} border-0 position-fixed bottom-0 end-0 m-3`;
        toastEl.setAttribute('role', 'alert');
        toastEl.setAttribute('aria-live', 'assertive');
        toastEl.setAttribute('aria-atomic', 'true');
        
        // Ícone baseado no tipo
        let iconClass;
        switch (type) {
            case this.TYPES.SUCCESS:
                iconClass = 'bi-check-circle-fill';
                break;
            case this.TYPES.ERROR:
                iconClass = 'bi-exclamation-triangle-fill';
                break;
            case this.TYPES.WARNING:
                iconClass = 'bi-exclamation-circle-fill';
                break;
            default: // INFO
                iconClass = 'bi-info-circle-fill';
                break;
        }
        
        // Conteúdo do toast
        toastEl.innerHTML = `
            <div class="toast-body d-flex align-items-center">
                <i class="bi ${iconClass} me-2"></i>
                ${message}
            </div>
        `;
        
        // Adicionar ao documento
        document.body.appendChild(toastEl);
        
        // Exibir toast
        const toast = new bootstrap.Toast(toastEl, {
            autohide: true,
            delay: duration
        });
        
        toast.show();
        
        // Remover do DOM após esconder
        toastEl.addEventListener('hidden.bs.toast', () => {
            if (toastEl.parentNode) {
                toastEl.parentNode.removeChild(toastEl);
            }
        });
    }
};

// Compatibilidade com código legado
// Usar temporariamente até atualização completa para novo sistema
if (!window.UI) window.UI = {};
window.UI.showError = Notifications.showError.bind(Notifications);
window.UI.showSuccess = Notifications.showSuccess.bind(Notifications);
window.UI.loading = Notifications.loading.bind(Notifications);
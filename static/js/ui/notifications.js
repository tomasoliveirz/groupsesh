/**
 * notifications.js - Sistema de notificações e alertas
 * Exposto como GroupSesh.UI.Notifications
 */
(function() {
    'use strict';
    
    // Garante o namespace
    window.GroupSesh = window.GroupSesh || {};
    window.GroupSesh.UI = window.GroupSesh.UI || {};

    // Se já existir algo no Notifications, não sobrescreve
    if (window.GroupSesh.UI.Notifications) {
        console.log('GroupSesh.UI.Notifications já existente, usando versão atual');
        return;
    }

    /**
     * Módulo de notificações
     */
    const Notifications = {
        TYPES: {
            SUCCESS: 'success',
            ERROR: 'danger',
            WARNING: 'warning',
            INFO: 'info'
        },
        
        /**
         * Mostra ou esconde um indicador de carregamento global
         * @param {boolean} show - Mostrar ou esconder
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
         * @param {string} message
         * @param {HTMLElement} container
         * @param {number} duration
         */
        showError(message, container, duration = 5000) {
            return this.show(message, container, this.TYPES.ERROR, duration);
        },

        /**
         * Mostra uma mensagem de sucesso
         * @param {string} message
         * @param {HTMLElement} container
         * @param {number} duration
         */
        showSuccess(message, container, duration = 3000) {
            return this.show(message, container, this.TYPES.SUCCESS, duration);
        },
        
        /**
         * Mostra uma mensagem de aviso
         * @param {string} message
         * @param {HTMLElement} container
         * @param {number} duration
         */
        showWarning(message, container, duration = 4000) {
            return this.show(message, container, this.TYPES.WARNING, duration);
        },
        
        /**
         * Mostra uma mensagem informativa
         * @param {string} message
         * @param {HTMLElement} container
         * @param {number} duration
         */
        showInfo(message, container, duration = 3000) {
            return this.show(message, container, this.TYPES.INFO, duration);
        },
        
        /**
         * Mostra uma notificação genérica
         */
        show(message, container, type = 'info', duration = 3000) {
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
            
            // Ícone e título
            let iconClass;
            let title;
            switch (type) {
                case this.TYPES.SUCCESS:
                    iconClass = 'bi-check-circle-fill';
                    title = 'Sucesso:';
                    break;
                case this.TYPES.ERROR:
                    iconClass = 'bi-exclamation-triangle-fill';
                    title = 'Erro:';
                    break;
                case this.TYPES.WARNING:
                    iconClass = 'bi-exclamation-circle-fill';
                    title = 'Atenção:';
                    break;
                default:
                    iconClass = 'bi-info-circle-fill';
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
         * @param {string} message
         * @param {string} type
         * @param {number} duration
         */
        toast(message, type = 'info', duration = 3000) {
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
                default:
                    iconClass = 'bi-info-circle-fill';
                    break;
            }
            
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

    // Exportar para o namespace
    window.GroupSesh.UI.Notifications = Notifications;

    // Compatibilidade com código legado
    if (!window.UI) window.UI = {};
    window.UI.showError = Notifications.showError.bind(Notifications);
    window.UI.showSuccess = Notifications.showSuccess.bind(Notifications);
    window.UI.loading = Notifications.loading.bind(Notifications);

    console.log('UI Notifications inicializado com sucesso');
})();

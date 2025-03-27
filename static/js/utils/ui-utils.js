/**
 * ui-utils.js - Adaptador UI com tratamento de falhas e compatibilidade
 */
(function() {
    'use strict';
    
    // Inicialização defensiva do namespace
    window.GroupSesh = window.GroupSesh || {};
    window.GroupSesh.Utils = window.GroupSesh.Utils || {};
    
    // Evitar redefinição se já existir
    if (GroupSesh.Utils.UIUtils) {
        console.log('GroupSesh.Utils.UIUtils já existente, utilizando versão atual');
        return;
    }
    
    /**
     * Implementação de UIUtils com foco em robustez
     */
    const UIUtils = {
        showError: function(message, container, duration = 5000) {
            console.error('UI Error:', message);
            return this._createAlert(message, container, 'danger', duration);
        },
        
        showSuccess: function(message, container, duration = 3000) {
            return this._createAlert(message, container, 'success', duration);
        },
        
        _createAlert: function(message, container, type, duration) {
            if (!container) {
                console.warn('Container não especificado para alerta');
                return null;
            }
            
            const alertEl = document.createElement('div');
            alertEl.className = `alert alert-${type} alert-dismissible fade show`;
            alertEl.innerHTML = `
                <div>${message}</div>
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            `;
            
            container.insertAdjacentElement('afterbegin', alertEl);
            
            if (duration > 0) {
                setTimeout(() => {
                    if (alertEl.parentNode) {
                        alertEl.classList.remove('show');
                        setTimeout(() => alertEl.remove(), 300);
                    }
                }, duration);
            }
            
            return alertEl;
        }
    };
    
    // Exportar para namespace estruturado
    GroupSesh.Utils.UIUtils = UIUtils;
    
    // Compatibilidade com código legado
    if (!window.UI) {
        window.UI = {
            showError: UIUtils.showError.bind(UIUtils),
            showSuccess: UIUtils.showSuccess.bind(UIUtils)
        };
    }
    
    console.log('UIUtils inicializado com sucesso');
})();
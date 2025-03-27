/**
 * dashboard.js - Ponto de entrada para o dashboard
 * Inicializa todos os componentes e coordena a funcionalidade
 * 
 * @requires Core/Base
 * @requires Core/Events
 * @requires Utils/DOMUtils
 * @requires Dashboard/Core
 */
(function() {
    'use strict';
    
    // Verificar se todos os módulos necessários estão disponíveis
    const checkDependencies = function() {
        const requiredModules = [
            { path: 'GroupSesh.Core.Base', name: 'Core Base' },
            { path: 'GroupSesh.Core.Events', name: 'Core Events' },
            { path: 'GroupSesh.Utils.DateUtils', name: 'DateUtils' },
            { path: 'GroupSesh.Utils.DOMUtils', name: 'DOMUtils' },
            { path: 'GroupSesh.Services.APIClient', name: 'API Client' },
            { path: 'GroupSesh.UI.Notifications', name: 'UI Notifications' },
            { path: 'GroupSesh.UI.Modals', name: 'UI Modals' },
            { path: 'GroupSesh.Dashboard.CalendarManager', name: 'Calendar Manager' },
            { path: 'GroupSesh.Dashboard.ParticipantList', name: 'Participant List' },
            { path: 'GroupSesh.Dashboard.ExportTools', name: 'Export Tools' },
            { path: 'GroupSesh.Dashboard.Core', name: 'Dashboard Core' }
        ];
        
        const missingModules = [];
        
        // Verificar cada módulo
        requiredModules.forEach(module => {
            // Função para acessar valor de objeto com notação de caminho em string
            const getNestedValue = (obj, path) => {
                return path.split('.').reduce((prev, curr) => 
                    prev && prev[curr] ? prev[curr] : undefined, window);
            };
            
            if (!getNestedValue(window, module.path)) {
                missingModules.push(module.name);
            }
        });
        
        return {
            success: missingModules.length === 0,
            missing: missingModules
        };
    };
    
    /**
     * Inicializa o dashboard
     */
    const initDashboard = function() {
        // Verificar dependências
        const deps = checkDependencies();
        if (!deps.success) {
            console.error(`Cannot initialize dashboard. Missing modules: ${deps.missing.join(', ')}`);
            
            // Adicionar alerta na interface
            const container = document.querySelector('.card-body') || document.body;
            const errorDiv = document.createElement('div');
            errorDiv.className = 'alert alert-danger';
            errorDiv.textContent = `Error initializing dashboard: Missing dependencies (${deps.missing.join(', ')})`;
            container.prepend(errorDiv);
            
            return;
        }
        
        // Inicializar o dashboard
        GroupSesh.Dashboard.Core.init(window.DASHBOARD_CONFIG);
        
        // Registrar evento de atualização de página (para recarregar após transições AJAX)
        document.addEventListener('pageContentUpdated', function() {
            console.log('Page content updated, reinitializing dashboard');
            GroupSesh.Dashboard.Core.init(window.DASHBOARD_CONFIG);
        });
        
        // Registrar manipulador de eventos para notificações importantes
        GroupSesh.Core.Events.subscribe('dashboard:error', function(error) {
            console.error('Dashboard error event:', error);
            
            const container = document.querySelector('.card-body');
            if (container) {
                GroupSesh.UI.Notifications.showError(
                    error.message || 'An error occurred in the dashboard', 
                    container
                );
            }
        });
    };
    
    // Expor função de inicialização globalmente
    window.initDashboard = initDashboard;
    
    // Inicializar quando o DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDashboard);
    } else {
        // O DOM já está pronto
        initDashboard();
    }
})();
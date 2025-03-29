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
    
    // Verifica se estamos na página de dashboard
    const isDashboardPage = function() {
        // Verifica se o pathname contém "/dashboard/" e se o elemento do calendário existe
        const isDashPath = window.location.pathname.includes('/dashboard/');
        const hasCalendar = !!document.getElementById('calendar');
        const hasDashboardTabs = !!document.getElementById('dashboard-tabs');
        
        return isDashPath && (hasCalendar || hasDashboardTabs);
    };
    
    /**
     * Inicializa o dashboard
     */
    const initDashboard = function() {
        // Primeiro verificamos se estamos realmente em uma página de dashboard
        if (!isDashboardPage()) {
            console.log('Não estamos em uma página de dashboard, ignorando inicialização');
            return;
        }
        
        console.log('Initializing dashboard core...');
        
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
        
        // Extrair o token da URL se estivermos na página do dashboard
        const extractTokenFromURL = function() {
            const pathname = window.location.pathname;
            if (pathname.includes('/dashboard/')) {
                const parts = pathname.split('/');
                return parts[parts.length - 1];
            }
            return null;
        };
        
        // Se não tivermos configuração mas tivermos um token na URL, criar uma configuração básica
        if (!window.DASHBOARD_CONFIG && isDashboardPage()) {
            const token = extractTokenFromURL();
            if (token) {
                console.log(`Creating dashboard config with token: ${token}`);
                window.DASHBOARD_CONFIG = {
                    survey: { token: token },
                    paths: {
                        survey_info: `/api/survey-info/${token}`,
                        survey_data: `/api/survey-data/${token}`
                    }
                };
            }
        }
        
        // Inicializar o dashboard
        GroupSesh.Dashboard.Core.init(window.DASHBOARD_CONFIG);
    };
    
    // Handler específico para o evento pageContentUpdated
    const handlePageContentUpdated = function(event) {
        // Verificar se o evento tem informações específicas sobre o tipo de página
        if (event.detail && event.detail.pageType === 'dashboard') {
            console.log('Page content updated for dashboard page, reinitializing dashboard');
            initDashboard();
        } else if (isDashboardPage()) {
            // Caso o evento não tenha informações específicas, verificamos manualmente
            console.log('Page content updated, checking if we are on a dashboard page');
            initDashboard();
        }
    };
    
    // Remover ouvintes duplicados
    document.removeEventListener('pageContentUpdated', handlePageContentUpdated);
    
    // Registrar evento de atualização de página (para recarregar após transições AJAX)
    document.addEventListener('pageContentUpdated', handlePageContentUpdated);
    
    // Expor função de inicialização globalmente
    window.initDashboard = initDashboard;
    
    // Inicializar quando o DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            if (isDashboardPage()) {
                initDashboard();
            }
        });
    } else {
        // O DOM já está pronto
        if (isDashboardPage()) {
            initDashboard();
        }
    }
})();
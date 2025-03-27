/**
 * api.js - Adaptador para APIClient existente
 */
(function() {
    'use strict';
    
    // Inicialização defensiva do namespace
    window.GroupSesh = window.GroupSesh || {};
    window.GroupSesh.Utils = window.GroupSesh.Utils || {};
    
    // Verificar se API já existe no namespace
    if (GroupSesh.Utils.API) {
        console.log('GroupSesh.Utils.API já existente, utilizando versão atual');
        return;
    }
    
    // Verificar APIClient existente
    if (!window.APIClient && !window.API) {
        console.warn('APIClient não encontrado, isso pode causar erros em operações de rede');
    }
    
    // Utilizar a instância existente de APIClient
    const apiInstance = window.APIClient || window.API || {
        // Implementação mínima de fallback
        createSurvey: async function() {
            throw new Error('API não disponível');
        },
        joinSurvey: async function() {
            throw new Error('API não disponível');
        }
    };
    
    // Exportar para o namespace
    GroupSesh.Utils.API = apiInstance;
    
    // Garantir disponibilidade global
    if (!window.API) {
        window.API = apiInstance;
    }
    
    console.log('Adaptador API inicializado com sucesso');
})();
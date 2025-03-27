/**
 * api.js - Adaptador para APIClient existente
 * 
 * Garante que GroupSesh.Utils.API aponte para window.APIClient,
 * e também que window.API exista, evitando o erro "API não disponível".
 */
(function() {
    'use strict';
  
    // Inicialização defensiva do namespace
    window.GroupSesh = window.GroupSesh || {};
    window.GroupSesh.Utils = window.GroupSesh.Utils || {};
  
    // Se já existir algo em GroupSesh.Utils.API, não sobrescreve.
    if (GroupSesh.Utils.API) {
      console.log('GroupSesh.Utils.API já existente, utilizando versão atual');
      return;
    }
  
    // Verificar se APIClient existe em window
    if (!window.APIClient) {
      console.warn('APIClient não encontrado! Criando fallback que lança erros...');
      // Fallback mínimo
      window.APIClient = {
        async createSurvey() {
          throw new Error('API não disponível');
        },
        async joinSurvey() {
          throw new Error('API não disponível');
        }
      };
    }
  
    // Ajustar o namespace GroupSesh.Utils.API para o que tiver em window.APIClient
    GroupSesh.Utils.API = window.APIClient;
  
    // Para compatibilidade adicional, se window.API não existir, aponta para o mesmo objeto
    if (!window.API) {
      window.API = window.APIClient;
    }
  
    console.log('Adaptador API inicializado com sucesso');
  })();
  
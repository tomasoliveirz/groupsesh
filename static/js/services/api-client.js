/**
 * api-client.js - Cliente unificado de API
 * Centraliza todas as chamadas à API.
 * 
 * Este script deve ser carregado antes de api.js (adaptador) e do create.js.
 */
(function() {
  'use strict';

  // Garante o namespace Services
  window.GroupSesh = window.GroupSesh || {};
  window.GroupSesh.Services = window.GroupSesh.Services || {};

  /**
   * Objeto que realiza as chamadas de API
   */
  const APIClient = {
    /**
     * Retorna configuração padrão de headers, 
     * incluindo CSRF e X-Requested-With.
     */
    defaultConfig() {
      return {
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'),
          'X-Requested-With': 'XMLHttpRequest'
        }
      };
    },

    /**
     * Cria uma nova survey (chamada ao endpoint /api/create-survey).
     * @param {Object} surveyData - Dados da survey
     * @returns {Promise<Object>} Resposta da API em formato JSON
     */
    async createSurvey(surveyData) {
      try {
        const response = await fetch('/api/create-survey', {
          method: 'POST',
          ...this.defaultConfig(),
          body: JSON.stringify(surveyData)
        });
        return await this._processResponse(response);
      } catch (error) {
        console.error('API Error:', error);
        throw error;
      }
    },

    /**
     * Registra participação em uma survey (/api/join-survey/:token).
     * @param {string} token - Token da survey
     * @param {Object} participantData - { name, email, availability_dates }
     * @returns {Promise<Object>} Resposta da API em formato JSON
     */
    async joinSurvey(token, participantData) {
      try {
        const response = await fetch(`/api/join-survey/${token}`, {
          method: 'POST',
          ...this.defaultConfig(),
          body: JSON.stringify(participantData)
        });
        return await this._processResponse(response);
      } catch (error) {
        console.error('API Error:', error);
        throw error;
      }
    },

    /**
     * Obtém informações básicas de uma survey (/api/survey-info/:token).
     * @param {string} token - Token da survey
     * @returns {Promise<Object>} Resposta JSON
     */
    async getSurveyInfo(token) {
      try {
        const response = await fetch(`/api/survey-info/${token}`, this.defaultConfig());
        return await this._processResponse(response);
      } catch (error) {
        console.error('API Error:', error);
        throw error;
      }
    },

    /**
     * Obtém dados completos de uma survey (para o dashboard).
     * @param {string} token - Token da survey
     * @returns {Promise<Object>} Resposta JSON
     */
    async getSurveyData(token) {
      try {
        const response = await fetch(`/api/survey-data/${token}`, this.defaultConfig());
        return await this._processResponse(response);
      } catch (error) {
        console.error('API Error:', error);
        throw error;
      }
    },

    /**
     * Verifica se o e-mail informado é o administrador de uma survey.
     * @param {string} token - Token da survey
     * @param {string} email - Email para verificar
     * @returns {Promise<Object>}
     */
    async verifyAdmin(token, email) {
      try {
        const response = await fetch('/api/verify-admin', {
          method: 'POST',
          ...this.defaultConfig(),
          body: JSON.stringify({ token, email })
        });
        return await this._processResponse(response);
      } catch (error) {
        console.error('API Error:', error);
        throw error;
      }
    },

    /**
     * Obtém informações do usuário atual (se estiver logado).
     * @returns {Promise<Object>} { name, email, ... }
     */
    async getCurrentUser() {
      try {
        const response = await fetch('/api/user-info', this.defaultConfig());
        return await this._processResponse(response);
      } catch (error) {
        console.error('API Error:', error);
        throw error;
      }
    },

    /**
     * Método privado para processar a resposta de cada fetch
     * e lançar erro se response.ok for falso.
     * @param {Response} response
     * @returns {Promise<Object>} 
     * @private
     */
    async _processResponse(response) {
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
      }
      return response.json();
    }
  };

  // Expor no namespace
  window.GroupSesh.Services.APIClient = APIClient;

  // Opcionalmente, se quiser compatibilidade no window global:
  if (!window.APIClient) {
    window.APIClient = APIClient;
  }

  if (!window.API) {
    window.API = APIClient; // Legado
  }

  console.log('API Client inicializado com sucesso');
})();

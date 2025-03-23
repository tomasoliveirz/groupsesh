/**
 * api.js - Centraliza todas as chamadas à API
 */
const API = {
    /**
     * Configuração padrão para requisições
     * @returns {Object} Configuração com headers adequados
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
     * Cria uma nova survey
     * @param {Object} surveyData - Dados da survey
     * @returns {Promise<Object>} Resposta da API
     */
    async createSurvey(surveyData) {
        try {
            const response = await fetch('/api/create-survey', {
                method: 'POST',
                ...this.defaultConfig(),
                body: JSON.stringify(surveyData)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erro ao criar survey');
            }
            
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    /**
     * Registra participação em uma survey
     * @param {string} token - Token da survey
     * @param {Object} participantData - Dados do participante
     * @returns {Promise<Object>} Resposta da API
     */
    async joinSurvey(token, participantData) {
        try {
            const response = await fetch(`/api/join-survey/${token}`, {
                method: 'POST',
                ...this.defaultConfig(),
                body: JSON.stringify(participantData)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erro ao registrar participação');
            }
            
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    /**
     * Obtém informações básicas de uma survey
     * @param {string} token - Token da survey
     * @returns {Promise<Object>} Resposta da API
     */
    async getSurveyInfo(token) {
        try {
            const response = await fetch(`/api/survey-info/${token}`, this.defaultConfig());
            
            if (!response.ok) {
                throw new Error(`Erro ${response.status}: Falha ao obter informações da survey`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    /**
     * Obtém dados completos de uma survey (para dashboard)
     * @param {string} token - Token da survey
     * @returns {Promise<Object>} Resposta da API
     */
    async getSurveyData(token) {
        try {
            const response = await fetch(`/api/survey-data/${token}`, this.defaultConfig());
            
            if (!response.ok) {
                throw new Error(`Erro ${response.status}: Falha ao obter dados da survey`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    /**
     * Verifica se um email é o administrador de uma survey
     * @param {string} token - Token da survey
     * @param {string} email - Email para verificar
     * @returns {Promise<Object>} Resposta da API
     */
    async verifyAdmin(token, email) {
        try {
            const response = await fetch('/api/verify-admin', {
                method: 'POST',
                ...this.defaultConfig(),
                body: JSON.stringify({ token, email })
            });
            
            if (!response.ok) {
                throw new Error(`Erro ${response.status}: Falha na verificação de administrador`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }
};
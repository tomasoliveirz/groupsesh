/**
 * api-client.js - Cliente unificado de API
 * Centraliza todas as chamadas à API
 */
const APIClient = {
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
     * Processa resposta da API
     * @param {Response} response - Resposta da requisição fetch
     * @returns {Promise<Object>} Dados da resposta
     * @private
     */
    async _processResponse(response) {
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
        }
        
        return response.json();
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
            
            return await this._processResponse(response);
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },



    /**
     * Tratamento específico para erros de autenticação
     * @param {Response} response - Resposta da requisição
     * @private
     */
    async _handleAuthErrors(response) {
        if (response.status === 401) {
            // Usuário não autenticado
            const errorData = await response.json().catch(() => ({}));
            const message = errorData.error || 'Você precisa estar logado para realizar esta ação.';
            
            // Obter o idioma atual
            const langCode = document.documentElement.lang || 'pt';
            
            // Salvar URL atual para redirecionamento após login
            const currentUrl = encodeURIComponent(window.location.pathname);
            
            // Definir timeout para não interromper o fluxo imediatamente
            setTimeout(() => {
                // Mostrar mensagem e redirecionar para login
                alert(message);
                window.location.href = `/${langCode}/auth/login?next=${currentUrl}`;
            }, 100);
            
            throw new Error(message);
        }
    },

    /**
     * Processa resposta da API
     * @param {Response} response - Resposta da requisição fetch
     * @returns {Promise<Object>} Dados da resposta
     * @private
     */
    async _processResponse(response) {
        // Verificar erros de autenticação
        if (response.status === 401) {
            await this._handleAuthErrors(response);
            return null; // Nunca será alcançado devido ao throw acima
        }
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
        }
        
        return response.json();
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
            
            return await this._processResponse(response);
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
            return await this._processResponse(response);
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
            return await this._processResponse(response);
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
            
            return await this._processResponse(response);
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },
    
    /**
     * Obtém informação sobre o usuário atual
     * @returns {Promise<Object>} Informações do usuário
     */
    async getCurrentUser() {
        try {
            const response = await fetch('/api/user-info', this.defaultConfig());
            return await this._processResponse(response);
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }
};

// Compatibilidade com código legado
// Usar apenas temporariamente até atualização completa
const API = APIClient;
/**
 * participant-list.js - Gerenciamento da lista de participantes
 * @module Dashboard/ParticipantList
 * @requires Core/Base
 * @requires Core/Events
 * @requires Utils/DateUtils
 * @requires Utils/DOMUtils
 * @requires UI/Modals
 */
window.GroupSesh = window.GroupSesh || {};
GroupSesh.Dashboard = GroupSesh.Dashboard || {};

(function() {
    'use strict';

    /**
     * Gerenciamento da lista de participantes
     * @namespace
     */
    const ParticipantList = {
        /**
         * Dados dos participantes
         * @type {Object}
         * @private
         */
        _participantsData: null,
        
        /**
         * Filtro atual
         * @type {string}
         * @private
         */
        _currentFilter: '',
        
        /**
         * Container da lista
         * @type {HTMLElement}
         * @private
         */
        _listContainer: null,
        
        /**
         * Inicializa o gerenciador de participantes
         * @param {HTMLElement} container - Container da lista
         * @param {Function} detailsHandler - Handler para clique em participante
         */
        init(container, detailsHandler) {
            if (!container) {
                console.warn('Participant list container not found');
                return;
            }
            
            this._listContainer = container;
            this._detailsHandler = detailsHandler;
            
            // Configurar campo de busca
            this._setupSearchField();
        },
        
        /**
         * Configura o campo de busca
         * @private
         */
        _setupSearchField() {
            const DOMUtils = GroupSesh.Utils.DOMUtils;
            const searchField = DOMUtils.getElementById('participant-search');
            
            if (searchField) {
                DOMUtils.addEventListener(searchField, 'input', (event) => {
                    this._currentFilter = event.target.value.trim();
                    this.renderList();
                });
            }
        },
        
        /**
         * Atualiza dados dos participantes
         * @param {Object} participantsData - Dados dos participantes
         */
        updateData(participantsData) {
            this._participantsData = participantsData;
            this.renderList();
        },
        
        /**
         * Renderiza a lista com filtro atual
         */
        renderList() {
            if (!this._listContainer) return;
            
            const DOMUtils = GroupSesh.Utils.DOMUtils;
            const isEnglish = GroupSesh.Core.Base.isEnglishLocale();
            
            // Limpar lista atual
            DOMUtils.clearChildren(this._listContainer);
            
            // Verificar se temos dados
            if (!this._participantsData || typeof this._participantsData !== 'object') {
                const errorDiv = DOMUtils.createElement('div', {
                    className: 'alert alert-danger'
                }, isEnglish ? 'Invalid participant data' : 'Dados de participantes inválidos');
                
                this._listContainer.appendChild(errorDiv);
                return;
            }
            
            const participantIds = Object.keys(this._participantsData);
            
            // Verificar se há participantes
            if (participantIds.length === 0) {
                const messageDiv = DOMUtils.createElement('div', {
                    className: 'text-center py-5'
                });
                
                const iconDiv = DOMUtils.createElement('div', {
                    className: 'display-4 text-muted mb-3'
                });
                
                const icon = DOMUtils.createElement('i', {
                    className: 'bi bi-people'
                });
                
                const leadP = DOMUtils.createElement('p', {
                    className: 'lead'
                }, isEnglish ? 'No participants yet.' : 'Nenhum participante ainda.');
                
                const mutedP = DOMUtils.createElement('p', {
                    className: 'text-muted'
                }, isEnglish ? 'Share the survey link to receive responses.' : 'Compartilhe o link da survey para receber respostas.');
                
                iconDiv.appendChild(icon);
                messageDiv.appendChild(iconDiv);
                messageDiv.appendChild(leadP);
                messageDiv.appendChild(mutedP);
                
                this._listContainer.appendChild(messageDiv);
                return;
            }
            
            // Filtrar participantes
            let filteredIds = participantIds;
            if (this._currentFilter) {
                const lowerFilter = this._currentFilter.toLowerCase();
                filteredIds = participantIds.filter(id => {
                    const p = this._participantsData[id];
                    if (!p || !p.name || !p.email) return false;
                    
                    return p.name.toLowerCase().includes(lowerFilter) || 
                           p.email.toLowerCase().includes(lowerFilter);
                });
            }
            
            // Verificar se há resultados após filtro
            if (filteredIds.length === 0) {
                const messageDiv = DOMUtils.createElement('div', {
                    className: 'text-center py-3'
                });
                
                const messageP = DOMUtils.createElement('p', {}, 
                    isEnglish ? 
                    `No participant found with the term "${this._currentFilter}".` : 
                    `Nenhum participante encontrado com o termo "${this._currentFilter}".`
                );
                
                messageDiv.appendChild(messageP);
                this._listContainer.appendChild(messageDiv);
                return;
            }
            
            // Ordenar participantes: 1) Admin primeiro, 2) Nome alfabeticamente
            filteredIds.sort((a, b) => {
                const pA = this._participantsData[a] || {};
                const pB = this._participantsData[b] || {};
                
                // Admin sempre primeiro
                if (pA.is_admin && !pB.is_admin) return -1;
                if (!pA.is_admin && pB.is_admin) return 1;
                
                // Depois por nome
                return (pA.name || '').localeCompare(pB.name || '');
            });
            
            // Criar lista
            const listGroup = DOMUtils.createElement('div', {
                className: 'list-group'
            });
            
            // Adicionar itens
            filteredIds.forEach(id => {
                this._renderParticipantItem(listGroup, this._participantsData[id]);
            });
            
            this._listContainer.appendChild(listGroup);
        },
        
        /**
         * Renderiza um item de participante
         * @param {HTMLElement} container - Container onde inserir o item
         * @param {Object} participant - Dados do participante
         * @private
         */
        _renderParticipantItem(container, participant) {
            if (!participant) return;
            
            const DOMUtils = GroupSesh.Utils.DOMUtils;
            const DateUtils = GroupSesh.Utils.DateUtils;
            const isEnglish = GroupSesh.Core.Base.isEnglishLocale();
            
            // Extrair dados com fallbacks seguros
            const name = participant.name || 'Nome indisponível';
            const email = participant.email || 'Email indisponível';
            const createdAt = participant.created_at || new Date().toISOString();
            const datesCount = Array.isArray(participant.availability_dates) ? 
                              participant.availability_dates.length : 0;
            const isAdmin = !!participant.is_admin;
            
            // Criar item
            const item = DOMUtils.createElement('a', {
                href: '#',
                className: `list-group-item list-group-item-action participant-card${isAdmin ? ' admin-participant' : ''}`
            });
            
            // Cabeçalho com nome e data
            const header = DOMUtils.createElement('div', {
                className: 'd-flex w-100 justify-content-between'
            });
            
            const nameHeading = DOMUtils.createElement('h6', {
                className: 'mb-1'
            }, name);
            
            // Badge de admin
            if (isAdmin) {
                const adminBadge = DOMUtils.createElement('span', {
                    className: 'admin-badge'
                }, 'Admin');
                
                nameHeading.appendChild(adminBadge);
            }
            
            const dateSmall = DOMUtils.createElement('small', {}, 
                DateUtils.formatDate(createdAt)
            );
            
            header.appendChild(nameHeading);
            header.appendChild(dateSmall);
            
            // Email
            const emailP = DOMUtils.createElement('p', {
                className: 'mb-1'
            }, email);
            
            // Contagem de dias disponíveis
            const daysSmall = DOMUtils.createElement('small', {
                className: 'text-muted'
            }, `${datesCount} ${datesCount === 1 ? 
                (isEnglish ? 'day available' : 'dia disponível') : 
                (isEnglish ? 'days available' : 'dias disponíveis')}`);
            
            // Montar item
            item.appendChild(header);
            item.appendChild(emailP);
            item.appendChild(daysSmall);
            
            // Evento para mostrar detalhes
            if (typeof this._detailsHandler === 'function') {
                DOMUtils.addEventListener(item, 'click', (e) => {
                    e.preventDefault();
                    this._detailsHandler(participant);
                });
            }
            
            container.appendChild(item);
        },
        
        /**
         * Obtém participante por ID
         * @param {string} participantId - ID do participante
         * @returns {Object|null} Dados do participante ou null
         */
        getParticipantById(participantId) {
            if (!this._participantsData || !participantId) {
                return null;
            }
            
            return this._participantsData[participantId] || null;
        },
        
        /**
         * Obtém participante por email
         * @param {string} email - Email do participante
         * @returns {Object|null} Dados do participante ou null
         */
        getParticipantByEmail(email) {
            if (!this._participantsData || !email) {
                return null;
            }
            
            const lowerEmail = email.toLowerCase();
            
            return Object.values(this._participantsData).find(
                p => p && p.email && p.email.toLowerCase() === lowerEmail
            ) || null;
        },
        
        /**
         * Verifica se um participante é administrador
         * @param {Object|string} participant - Objeto ou ID do participante
         * @returns {boolean} Verdadeiro se for admin
         */
        isAdmin(participant) {
            if (!participant) return false;
            
            // Se for ID, buscar objeto
            if (typeof participant === 'string') {
                participant = this.getParticipantById(participant);
                if (!participant) return false;
            }
            
            return !!participant.is_admin;
        }
    };
    
    // Exportar o módulo
    GroupSesh.Dashboard.ParticipantList = ParticipantList;
})();
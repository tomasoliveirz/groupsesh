/**
 * dashboard-core.js - Lógica principal do dashboard
 * @module Dashboard/Core
 * @requires Core/Base
 * @requires Core/Events
 * @requires Services/APIClient
 * @requires Utils/DateUtils
 * @requires Utils/DOMUtils
 * @requires UI/Notifications
 * @requires UI/Modals
 * @requires Dashboard/CalendarManager
 * @requires Dashboard/ParticipantList
 * @requires Dashboard/ExportTools
 */
(function() {
    'use strict';

    // Garantir namespace
    window.GroupSesh = window.GroupSesh || {};
    window.GroupSesh.Dashboard = window.GroupSesh.Dashboard || {};

    // Se já existir, não redefine
    if (window.GroupSesh.Dashboard.Core) {
        console.log('GroupSesh.Dashboard.Core já existente, usando versão atual');
        return;
    }

    /**
     * Núcleo de gerenciamento do dashboard
     * @namespace
     */
    const DashboardCore = {
        _config: null,
        _surveyData: null,
        _surveyToken: null,

        /**
         * Inicializa o dashboard
         * @param {Object} [config] - Configuração opcional do dashboard
         */
        async init(config = null) {
            console.log('Initializing dashboard core...');

            try {
                // Usar configuração fornecida ou buscar do escopo global
                this._config = config || window.DASHBOARD_CONFIG || {};

                // Extrair token
                this._surveyToken = this._getSurveyTokenFromConfig() || this._getSurveyTokenFromURL();
                if (!this._surveyToken) {
                    throw new Error('Survey token not found');
                }

                // Mostrar indicador de carregamento
                this._showLoading(true);

                // Inicializar componentes
                this._initComponents();

                // Carregar dados
                await this._loadData();

                // Configurar eventos
                this._setupEventListeners();

                // Conclusão
                console.log('Dashboard initialized successfully');
                GroupSesh.Core.Events.publish('dashboard:ready', true);

            } catch (error) {
                console.error('Dashboard initialization error:', error);
                const container = document.querySelector('.card-body');
                if (container) {
                    GroupSesh.UI.Notifications.showError(
                        error.message || 'Error initializing dashboard',
                        container
                    );
                }
            } finally {
                // Esconder indicador de carregamento
                this._showLoading(false);
            }
        },

        /**
         * Extrai token da survey da configuração
         * @returns {string|null} Token da survey
         * @private
         */
        _getSurveyTokenFromConfig() {
            return this._config.survey?.token || null;
        },

        /**
         * Extrai token da survey da URL
         * @returns {string|null} Token da survey
         * @private
         */
        _getSurveyTokenFromURL() {
            const pathParts = window.location.pathname.split('/');
            return pathParts[pathParts.length - 1] || null;
        },

        /**
         * Inicializa os componentes do dashboard (calendário, lista de participantes, etc.)
         * @private
         */
        _initComponents() {
            const DOMUtils = GroupSesh.Utils.DOMUtils;

            // Inicializar calendário
            const calendarEl = DOMUtils.getElementById('calendar');
            if (calendarEl) {
                GroupSesh.Dashboard.CalendarManager.init(calendarEl);
            }

            // Inicializar lista de participantes
            const participantsList = DOMUtils.getElementById('participants-list');
            if (participantsList) {
                GroupSesh.Dashboard.ParticipantList.init(
                    participantsList,
                    this._showParticipantDetails.bind(this)
                );
            }
        },

        /**
         * Carrega dados da survey e preenche o dashboard
         * @private
         */
        async _loadData() {
            try {
                // Usar informações básicas do config se disponível
                if (this._config.survey && Object.keys(this._config.survey).length > 0) {
                    this._updateBasicInfoFromConfig(this._config.survey);
                } else {
                    // Carregar informações básicas da API
                    const surveyInfo = await GroupSesh.Services.APIClient.getSurveyInfo(this._surveyToken);
                    this._updateBasicInfo(surveyInfo);
                }

                // Carregar dados completos
                this._surveyData = await GroupSesh.Services.APIClient.getSurveyData(this._surveyToken);

                // Validar dados
                if (!this._surveyData || !this._surveyData.survey || !this._surveyData.participants) {
                    throw new Error('Invalid survey data received from API');
                }

                // Garantir que o admin está nos participantes
                this._ensureAdminIsParticipant();

                // Atualizar contadores
                this._updateParticipantCount();

                // Atualizar calendário
                GroupSesh.Dashboard.CalendarManager.updateWithData(
                    this._surveyData,
                    this._showParticipantsForDate.bind(this)
                );

                // Atualizar lista de participantes
                GroupSesh.Dashboard.ParticipantList.updateData(this._surveyData.participants);

                return true;
            } catch (error) {
                console.error('Error loading survey data:', error);
                throw new Error('Failed to load survey data: ' + error.message);
            }
        },

        /**
         * Atualiza informações básicas a partir da configuração
         * @param {Object} surveyConfig - Config da survey
         * @private
         */
        _updateBasicInfoFromConfig(surveyConfig) {
            if (!surveyConfig || !surveyConfig.title) {
                console.warn('Incomplete survey configuration');
                return;
            }
            const DOMUtils = GroupSesh.Utils.DOMUtils;
            const DateUtils = GroupSesh.Utils.DateUtils;

            // Título da página
            document.title = `${surveyConfig.title} - Dashboard`;

            // Título na interface
            const titleEl = document.querySelector('.card-header h2');
            if (titleEl) {
                titleEl.textContent = surveyConfig.title;
            }

            // Datas
            const creationDate = DOMUtils.getElementById('creation-date');
            if (creationDate && surveyConfig.created_at) {
                creationDate.textContent = DateUtils.formatDate(surveyConfig.created_at, true);
            }

            const expiryDate = DOMUtils.getElementById('expiry-date');
            if (expiryDate && surveyConfig.expires_at) {
                expiryDate.textContent = DateUtils.formatDate(surveyConfig.expires_at, true);
            }
        },

        /**
         * Atualiza informações básicas a partir da resposta da API
         * @param {Object} surveyInfo - Info da survey
         * @private
         */
        _updateBasicInfo(surveyInfo) {
            if (!surveyInfo || !surveyInfo.title) {
                console.warn('Incomplete survey information');
                return;
            }
            const DOMUtils = GroupSesh.Utils.DOMUtils;
            const DateUtils = GroupSesh.Utils.DateUtils;

            // Título
            document.title = `${surveyInfo.title} - Dashboard`;
            const titleEl = document.querySelector('.card-header h2');
            if (titleEl) {
                titleEl.textContent = surveyInfo.title;
            }

            // Datas
            const creationDate = DOMUtils.getElementById('creation-date');
            if (creationDate && surveyInfo.created_at) {
                creationDate.textContent = DateUtils.formatDate(surveyInfo.created_at, true);
            }
            const expiryDate = DOMUtils.getElementById('expiry-date');
            if (expiryDate && surveyInfo.expires_at) {
                expiryDate.textContent = DateUtils.formatDate(surveyInfo.expires_at, true);
            }

            // Link de participação
            const surveyLinkInput = DOMUtils.getElementById('survey-link');
            if (surveyLinkInput && surveyInfo.token) {
                const baseUrl = window.location.origin;
                const lang = GroupSesh.Core.Base.getCurrentLocale().substring(0, 2);
                surveyLinkInput.value = `${baseUrl}/${lang}/survey/${surveyInfo.token}`;
            }
        },

        /**
         * Garante que o admin da survey é incluído nos participantes
         * @private
         */
        _ensureAdminIsParticipant() {
            if (!this._surveyData 
                || !this._surveyData.survey 
                || !this._surveyData.participants 
                || !this._surveyData.survey.admin_email 
                || !this._surveyData.survey.admin_name) {
                console.warn('Insufficient data to ensure admin is a participant');
                return;
            }

            const adminEmail = this._surveyData.survey.admin_email.toLowerCase();
            const adminExists = Object.values(this._surveyData.participants).some(
                p => p && p.email && p.email.toLowerCase() === adminEmail && p.is_admin
            );

            if (!adminExists) {
                console.log('Admin not found among participants, adding...');
                const adminId = `admin_${Date.now()}`;
                this._surveyData.participants[adminId] = {
                    id: adminId,
                    name: this._surveyData.survey.admin_name,
                    email: this._surveyData.survey.admin_email,
                    created_at: this._surveyData.survey.created_at,
                    is_admin: true,
                    availability_dates: []
                };
            }
        },

        /**
         * Atualiza a contagem de participantes na UI
         * @private
         */
        _updateParticipantCount() {
            const DOMUtils = GroupSesh.Utils.DOMUtils;
            const participantCount = DOMUtils.getElementById('participants-count');
            if (participantCount && this._surveyData && this._surveyData.participants) {
                const count = Object.keys(this._surveyData.participants).length;
                participantCount.textContent = count;
            }
        },

        /**
         * Configura os listeners de eventos
         * @private
         */
        _setupEventListeners() {
            const DOMUtils = GroupSesh.Utils.DOMUtils;

            // Botões de export
            const exportBtn = DOMUtils.getElementById('export-btn');
            if (exportBtn) {
                DOMUtils.addEventListener(exportBtn, 'click', () => {
                    GroupSesh.Dashboard.ExportTools.exportToCSV(this._surveyData);
                });
            }

            const exportResultsBtn = DOMUtils.getElementById('export-results-btn');
            if (exportResultsBtn) {
                DOMUtils.addEventListener(exportResultsBtn, 'click', () => {
                    GroupSesh.Dashboard.ExportTools.exportToCSV(this._surveyData);
                });
            }

            // Compartilhar link
            const shareBtn = DOMUtils.getElementById('share-btn');
            if (shareBtn) {
                DOMUtils.addEventListener(shareBtn, 'click', this._shareSurvey.bind(this));
            }

            const shareSurveyBtn = DOMUtils.getElementById('share-survey-btn');
            if (shareSurveyBtn) {
                DOMUtils.addEventListener(shareSurveyBtn, 'click', this._shareSurvey.bind(this));
            }
        },

        /**
         * Compartilha link da survey
         * @private
         */
        _shareSurvey() {
            const DOMUtils = GroupSesh.Utils.DOMUtils;
            const surveyLinkInput = DOMUtils.getElementById('survey-link');
            if (!surveyLinkInput) {
                console.warn('Survey link input not found');
                return;
            }

            const link = surveyLinkInput.value;
            if (!link) {
                console.warn('Empty survey link');
                return;
            }

            try {
                const isEnglish = GroupSesh.Core.Base.isEnglishLocale();
                if (navigator.share) {
                    // API Web Share
                    navigator.share({
                        title: isEnglish ? 'Availability Survey' : 'Pesquisa de Disponibilidade',
                        text: isEnglish
                            ? `Please participate in the availability survey: ${this._surveyData?.survey?.title || 'Survey'}`
                            : `Por favor, participe da pesquisa de disponibilidade: ${this._surveyData?.survey?.title || 'GroupSesh'}`,
                        url: link
                    }).catch(err => {
                        console.log('Share error:', err);
                        DOMUtils.copyToClipboard('survey-link');
                    });
                } else {
                    // Fallback
                    if (DOMUtils.copyToClipboard('survey-link')) {
                        GroupSesh.UI.Notifications.toast(
                            isEnglish ? 'Link copied to clipboard!' : 'Link copiado para área de transferência!',
                            GroupSesh.UI.Notifications.TYPES.SUCCESS
                        );
                    }
                }
            } catch (error) {
                console.error('Error sharing survey:', error);
                const isEnglish = GroupSesh.Core.Base.isEnglishLocale();
                alert(isEnglish
                    ? "Could not share link. Copy it manually."
                    : "Não foi possível compartilhar o link. Copie manualmente."
                );
            }
        },

        /**
         * Exibe modal com participantes para uma data
         * @param {string} dateStr
         * @param {Array} participants
         * @private
         */
        _showParticipantsForDate(dateStr, participants) {
            const DOMUtils = GroupSesh.Utils.DOMUtils;
            const modalDate = DOMUtils.getElementById('modal-date');
            const modalParticipantsList = DOMUtils.getElementById('modal-participants-list');
            
            if (!modalDate || !modalParticipantsList) {
                console.warn('Modal elements not found for participants-by-date');
                return;
            }
            
            modalDate.textContent = GroupSesh.Utils.DateUtils.formatDate(dateStr);
            DOMUtils.clearChildren(modalParticipantsList);

            if (!Array.isArray(participants) || participants.length === 0) {
                const isEnglish = GroupSesh.Core.Base.isEnglishLocale();
                const noParticipantsDiv = DOMUtils.createElement('div', {
                    className: 'text-center py-3'
                }, isEnglish 
                    ? 'No participants available on this day.'
                    : 'Nenhum participante disponível neste dia.'
                );
                modalParticipantsList.appendChild(noParticipantsDiv);
            } else {
                // Verificar se temos dados completos
                if (!this._surveyData || !this._surveyData.participants) {
                    const isEnglish = GroupSesh.Core.Base.isEnglishLocale();
                    const errorDiv = DOMUtils.createElement('div', {
                        className: 'alert alert-warning'
                    }, isEnglish
                        ? 'Complete data not available. Try reloading the page.'
                        : 'Dados completos não disponíveis. Tente recarregar a página.'
                    );
                    modalParticipantsList.appendChild(errorDiv);
                    return;
                }

                // Listar participantes
                participants.forEach(participant => {
                    if (!participant || !participant.participant_id) return;
                    const participantId = participant.participant_id;
                    const fullParticipant = this._surveyData.participants[participantId];
                    if (!fullParticipant) {
                        console.warn(`Participant ${participantId} not found in full data`);
                        return;
                    }

                    // Criar item
                    const item = DOMUtils.createElement('a', {
                        href: '#',
                        className: 'list-group-item list-group-item-action'
                          + (fullParticipant.is_admin ? ' admin-participant' : '')
                    });

                    // Header
                    const header = DOMUtils.createElement('div', {
                        className: 'd-flex w-100 justify-content-between'
                    });
                    const nameHeading = DOMUtils.createElement('h6', {
                        className: 'mb-1'
                    }, participant.name || 'Nome indisponível');

                    if (fullParticipant.is_admin) {
                        const adminBadge = DOMUtils.createElement('span', {
                            className: 'admin-badge'
                        }, 'Admin');
                        nameHeading.appendChild(adminBadge);
                    }
                    header.appendChild(nameHeading);

                    // Email
                    const emailP = DOMUtils.createElement('p', {
                        className: 'mb-1'
                    }, participant.email || 'Email indisponível');

                    item.appendChild(header);
                    item.appendChild(emailP);

                    // Clique => detalhes do participante
                    DOMUtils.addEventListener(item, 'click', (e) => {
                        e.preventDefault();
                        this._showParticipantDetails(fullParticipant);
                    });

                    modalParticipantsList.appendChild(item);
                });
            }

            // Mostrar modal
            GroupSesh.UI.Modals.open('participants-modal');
        },

        /**
         * Exibe modal com detalhes de um participante
         * @param {Object} participant
         * @private
         */
        _showParticipantDetails(participant) {
            if (!participant) {
                console.warn('Participant data not provided');
                return;
            }

            // Fechar modal anterior se aberto
            GroupSesh.UI.Modals.close('participants-modal');

            const DOMUtils = GroupSesh.Utils.DOMUtils;
            const participantInfo = DOMUtils.getElementById('participant-info');
            const datesList = DOMUtils.getElementById('participant-dates');

            if (!participantInfo || !datesList) {
                console.warn('Participant detail modal elements not found');
                return;
            }

            // Limpar conteúdo
            DOMUtils.clearChildren(participantInfo);
            DOMUtils.clearChildren(datesList);

            const DateUtils = GroupSesh.Utils.DateUtils;
            const isEnglish = GroupSesh.Core.Base.isEnglishLocale();

            // Card principal
            const cardDiv = DOMUtils.createElement('div', { className: 'card' });
            const cardBody = DOMUtils.createElement('div', { className: 'card-body' });

            // Nome
            const nameTitle = DOMUtils.createElement('h5', { className: 'card-title' },
                participant.name || 'Nome indisponível'
            );

            // Admin badge
            if (participant.is_admin) {
                const adminBadge = DOMUtils.createElement('span', { className: 'admin-badge' }, 'Admin');
                nameTitle.appendChild(adminBadge);
            }

            // Email
            const emailSubtitle = DOMUtils.createElement('h6', {
                className: 'card-subtitle mb-2 text-muted'
            }, participant.email || 'Email indisponível');

            // Data de criação
            const createdText = DOMUtils.createElement('p', { className: 'card-text' });
            const createdSmall = DOMUtils.createElement('small', {
                className: 'text-muted'
            }, (isEnglish ? 'Response submitted on: ' : 'Resposta enviada em: ')
                + DateUtils.formatDate(participant.created_at || new Date().toISOString(), true));
            createdText.appendChild(createdSmall);

            cardBody.appendChild(nameTitle);
            cardBody.appendChild(emailSubtitle);
            cardBody.appendChild(createdText);
            cardDiv.appendChild(cardBody);
            participantInfo.appendChild(cardDiv);

            // Lista de datas
            if (!Array.isArray(participant.availability_dates) || participant.availability_dates.length === 0) {
                const noDatesDiv = DOMUtils.createElement('div', {
                    className: 'text-center py-3'
                }, isEnglish 
                    ? 'No date selected.'
                    : 'Nenhuma data selecionada.'
                );
                datesList.appendChild(noDatesDiv);
            } else {
                // Ordenar datas
                if (typeof DateUtils.sortDates === 'function') {
                    const sortedDates = DateUtils.sortDates(participant.availability_dates);
                    sortedDates.forEach(dateStr => {
                        const item = DOMUtils.createElement('div', {
                            className: 'list-group-item'
                        }, DateUtils.formatDate(dateStr));
                        datesList.appendChild(item);
                    });
                } else {
                    // Se não houver sortDates, apenas listar
                    participant.availability_dates.forEach(dateStr => {
                        const item = DOMUtils.createElement('div', {
                            className: 'list-group-item'
                        }, DateUtils.formatDate(dateStr));
                        datesList.appendChild(item);
                    });
                }
            }

            // Abrir modal
            GroupSesh.UI.Modals.open('participant-detail-modal');
        },

        /**
         * Controla o indicador de carregamento (ex.: spinner)
         * @param {boolean} isLoading
         * @private
         */
        _showLoading(isLoading) {
            const existingSpinner = document.getElementById('loading-spinner');
            if (existingSpinner) {
                existingSpinner.remove();
            }

            if (isLoading) {
                const spinner = GroupSesh.Utils.DOMUtils.createElement('div', {
                    id: 'loading-spinner',
                    className: 'loading-overlay'
                });
                const spinnerInner = GroupSesh.Utils.DOMUtils.createElement('div', {
                    className: 'spinner-border text-primary',
                    role: 'status'
                });
                const spinnerText = GroupSesh.Utils.DOMUtils.createElement('span', {
                    className: 'visually-hidden'
                }, 'Carregando...');
                
                spinnerInner.appendChild(spinnerText);
                spinner.appendChild(spinnerInner);
                document.body.appendChild(spinner);
            }
        },

        /**
         * Retorna os dados completos da survey
         * @returns {Object|null}
         */
        getSurveyData() {
            return this._surveyData;
        },

        /**
         * Libera recursos e prepara para destruição
         */
        destroy() {
            // Destruir gerenciador de calendário
            GroupSesh.Dashboard.CalendarManager.destroy();

            // Limpar dados
            this._surveyData = null;
            this._config = null;

            console.log('Dashboard resources released');
        }
    };

    // Exportar o módulo
    window.GroupSesh.Dashboard.Core = DashboardCore;
    console.log('Dashboard Core inicializado com sucesso');
})();

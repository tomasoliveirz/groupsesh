/**
 * modals.js - Gerenciador de modais
 * @module UI/Modals
 * @requires Core/Base
 * @requires Utils/DOMUtils
 */
(function() {
    'use strict';

    // Garantir namespace
    window.GroupSesh = window.GroupSesh || {};
    window.GroupSesh.UI = window.GroupSesh.UI || {};

    // Evitar redefinição caso já exista
    if (window.GroupSesh.UI.Modals) {
        console.log('GroupSesh.UI.Modals já existente, utilizando versão atual');
        return;
    }

    /**
     * Gerenciador de modais Bootstrap
     * @namespace
     */
    const Modals = {
        /**
         * Abre um modal do Bootstrap
         * @param {string} modalId - ID do elemento modal
         * @returns {Object|null} Instância do modal ou null se falhar
         */
        open(modalId) {
            try {
                const modalElement = document.getElementById(modalId);
                if (!modalElement) {
                    console.warn(`Modal element with id "${modalId}" not found`);
                    return null;
                }
                
                // Verificar se a API do Bootstrap está disponível
                if (typeof bootstrap === 'undefined' || !bootstrap.Modal) {
                    console.error('Bootstrap Modal API is not available');
                    return null;
                }
                
                // Tentar obter instância existente ou criar nova
                let modalInstance = bootstrap.Modal.getInstance(modalElement);
                if (!modalInstance) {
                    modalInstance = new bootstrap.Modal(modalElement);
                }
                
                modalInstance.show();
                return modalInstance;
            } catch (error) {
                console.error('Error opening modal:', error);
                return null;
            }
        },
        
        /**
         * Fecha um modal do Bootstrap
         * @param {string} modalId - ID do elemento modal
         * @returns {boolean} Sucesso da operação
         */
        close(modalId) {
            try {
                const modalElement = document.getElementById(modalId);
                if (!modalElement) {
                    console.warn(`Modal element with id "${modalId}" not found`);
                    return false;
                }
                
                // Verificar se a API do Bootstrap está disponível
                if (typeof bootstrap === 'undefined' || !bootstrap.Modal) {
                    console.error('Bootstrap Modal API is not available');
                    return false;
                }
                
                const modalInstance = bootstrap.Modal.getInstance(modalElement);
                if (!modalInstance) {
                    console.warn(`No modal instance found for id "${modalId}"`);
                    return false;
                }
                
                modalInstance.hide();
                return true;
            } catch (error) {
                console.error('Error closing modal:', error);
                return false;
            }
        },
        
        /**
         * Retorna instância de um modal existente
         * @param {string} modalId - ID do elemento modal
         * @returns {Object|null} Instância do modal ou null
         */
        getInstance(modalId) {
            try {
                const modalElement = document.getElementById(modalId);
                if (!modalElement) return null;
                
                return bootstrap.Modal.getInstance(modalElement);
            } catch (error) {
                console.error('Error getting modal instance:', error);
                return null;
            }
        },
        
        /**
         * Cria um modal de confirmação dinâmico
         * @param {Object} options - Opções do modal
         * @param {string} options.title - Título do modal
         * @param {string} options.message - Mensagem do modal
         * @param {string} options.confirmText - Texto do botão de confirmação
         * @param {string} options.cancelText - Texto do botão de cancelamento
         * @param {string} options.confirmClass - Classe do botão de confirmação
         * @param {Function} options.onConfirm - Callback para confirmação
         * @param {Function} options.onCancel - Callback para cancelamento
         * @returns {Object} Objeto com open(), close() e modalElement
         */
        confirm(options) {
            // Configurar opções padrão
            const isEnglish = GroupSesh.Core.Base.isEnglishLocale();
            
            const defaultOptions = {
                title: isEnglish ? 'Confirmation' : 'Confirmação',
                message: isEnglish ? 'Are you sure?' : 'Você tem certeza?',
                confirmText: isEnglish ? 'Confirm' : 'Confirmar',
                cancelText: isEnglish ? 'Cancel' : 'Cancelar',
                confirmClass: 'btn-primary',
                onConfirm: () => {},
                onCancel: () => {}
            };
            
            // Mesclar opções
            const config = Object.assign({}, defaultOptions, options);
            
            // Gerar ID único para o modal
            const modalId = `confirm-modal-${Date.now()}`;
            
            // Criar elementos do modal dinamicamente
            const DOMUtils = GroupSesh.Utils.DOMUtils;
            
            // Criar elemento modal
            const modalElement = DOMUtils.createElement('div', {
                id: modalId,
                className: 'modal fade',
                tabindex: '-1',
                'aria-hidden': 'true'
            });
            
            // Conteúdo do modal
            const modalContent = `
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">${config.title}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <p>${config.message}</p>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary cancel-btn" data-bs-dismiss="modal">${config.cancelText}</button>
                            <button type="button" class="btn ${config.confirmClass} confirm-btn">${config.confirmText}</button>
                        </div>
                    </div>
                </div>
            `;
            
            modalElement.innerHTML = modalContent;
            document.body.appendChild(modalElement);
            
            // Obter botões
            const confirmBtn = modalElement.querySelector('.confirm-btn');
            const cancelBtn = modalElement.querySelector('.cancel-btn');
            
            // Adicionar eventos
            confirmBtn.addEventListener('click', () => {
                this.close(modalId);
                config.onConfirm();
                // Remover o modal após execução
                setTimeout(() => {
                    if (modalElement.parentNode) {
                        modalElement.parentNode.removeChild(modalElement);
                    }
                }, 300);
            });
            
            // Evento de cancelamento (também remove o modal)
            modalElement.addEventListener('hidden.bs.modal', () => {
                // Se foi fechado pelo botão de cancelar ou pelo X
                if (modalElement.querySelectorAll('.confirm-btn:active').length === 0) {
                    config.onCancel();
                }
                
                // Remover o modal do DOM após fechar
                setTimeout(() => {
                    if (modalElement.parentNode) {
                        modalElement.parentNode.removeChild(modalElement);
                    }
                }, 300);
            });
            
            // Criar instância do modal
            const modalInstance = new bootstrap.Modal(modalElement);
            
            // Retornar API para controlar o modal
            return {
                open: () => {
                    modalInstance.show();
                },
                close: () => {
                    modalInstance.hide();
                },
                modalElement: modalElement
            };
        }
    };
    
    // Exportar o módulo
    window.GroupSesh.UI.Modals = Modals;

    console.log('UI Modals inicializado com sucesso');
})();

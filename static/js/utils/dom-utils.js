/**
 * dom-utils.js - Utilitários para manipulação do DOM
 */
(function() {
    'use strict';
    
    // Garantir namespace
    window.GroupSesh = window.GroupSesh || {};
    window.GroupSesh.Utils = window.GroupSesh.Utils || {};

    /**
     * Objeto de utilitários para manipulação do DOM
     */
    const DOMUtils = {
        /**
         * Encontra um elemento por ID de forma segura
         * @param {string} id - ID do elemento
         * @returns {HTMLElement|null} Elemento ou null se não encontrado
         */
        getElementById(id) {
            return document.getElementById(id);
        },
        
        /**
         * Cria um elemento com atributos e conteúdo
         * @param {string} tag - Tag HTML
         * @param {Object} attributes - Atributos a aplicar
         * @param {string|HTMLElement|Array} [content] - Conteúdo opcional
         * @returns {HTMLElement} Elemento criado
         */
        createElement(tag, attributes = {}, content) {
            const element = document.createElement(tag);
            
            // Aplicar atributos
            Object.entries(attributes).forEach(([attr, value]) => {
                if (attr === 'className') {
                    element.className = value;
                } else if (attr === 'style' && typeof value === 'object') {
                    Object.assign(element.style, value);
                } else {
                    element.setAttribute(attr, value);
                }
            });
            
            // Adicionar conteúdo se fornecido
            if (content !== undefined) {
                this.setContent(element, content);
            }
            
            return element;
        },
        
        /**
         * Define o conteúdo de um elemento
         * @param {HTMLElement} element - Elemento alvo
         * @param {string|HTMLElement|Array} content - Conteúdo
         */
        setContent(element, content) {
            // Limpar conteúdo existente
            element.innerHTML = '';
            
            if (typeof content === 'string') {
                element.textContent = content;
            } else if (content instanceof HTMLElement) {
                element.appendChild(content);
            } else if (Array.isArray(content)) {
                content.forEach(item => {
                    if (typeof item === 'string') {
                        const textNode = document.createTextNode(item);
                        element.appendChild(textNode);
                    } else if (item instanceof HTMLElement) {
                        element.appendChild(item);
                    }
                });
            }
        },
        
        /**
         * Remove todos os filhos de um elemento
         * @param {HTMLElement} element - Elemento a limpar
         */
        clearChildren(element) {
            if (!element) return;
            
            while (element.firstChild) {
                element.removeChild(element.firstChild);
            }
        },
        
        /**
         * Copia texto para a área de transferência (espera um <input> ou <textarea>)
         * @param {string} elementId - ID do elemento input
         * @returns {boolean} Sucesso da operação
         */
        copyToClipboard(elementId) {
            const element = document.getElementById(elementId);
            if (!element) return false;
            
            // Selecionar texto
            element.select();
            element.setSelectionRange(0, 99999);
            
            try {
                // Método moderno
                if (navigator.clipboard && window.isSecureContext) {
                    navigator.clipboard.writeText(element.value);
                } else {
                    // Fallback
                    document.execCommand('copy');
                }
                
                // Feedback visual (exemplo)
                const button = element.nextElementSibling;
                if (button) {
                    const originalHTML = button.innerHTML;
                    button.innerHTML = '<i class="bi bi-check"></i>';
                    setTimeout(() => {
                        button.innerHTML = originalHTML;
                    }, 2000);
                }
                
                return true;
            } catch (err) {
                console.error('Erro ao copiar:', err);
                return false;
            }
        },
        
        /**
         * Adiciona evento com segurança
         * @param {HTMLElement} element - Elemento alvo
         * @param {string} eventName - Nome do evento
         * @param {Function} handler - Função manipuladora
         * @param {Object|boolean} [options] - Opções do evento
         */
        addEventListener(element, eventName, handler, options) {
            if (!element || typeof handler !== 'function') return;
            element.addEventListener(eventName, handler, options);
        },
        
        /**
         * Remove evento com segurança
         * @param {HTMLElement} element - Elemento alvo
         * @param {string} eventName - Nome do evento
         * @param {Function} handler - Função manipuladora
         * @param {Object|boolean} [options] - Opções do evento
         */
        removeEventListener(element, eventName, handler, options) {
            if (!element || typeof handler !== 'function') return;
            element.removeEventListener(eventName, handler, options);
        }
    };

    // Exportar para o namespace GroupSesh.Utils
    GroupSesh.Utils.DOMUtils = DOMUtils;
    
    // Também manter compatibilidade com window.UI.copyToClipboard
    if (!window.UI) window.UI = {};
    window.UI.copyToClipboard = DOMUtils.copyToClipboard;
    
    console.log('DOM Utils inicializado com sucesso');
})();

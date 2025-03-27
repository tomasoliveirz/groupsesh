/**
 * events.js - Sistema de eventos personalizado
 * @module Core/Events
 * @requires Core/Base
 */
window.GroupSesh = window.GroupSesh || {};
GroupSesh.Core = GroupSesh.Core || {};

(function() {
    'use strict';

    /**
     * Sistema de eventos para comunicação entre módulos
     * @namespace
     */
    const Events = {
        _handlers: {},

        /**
         * Inscreve um handler para um evento
         * @param {string} event - Nome do evento
         * @param {Function} handler - Função a ser executada
         * @returns {string} ID único do handler para possível remoção futura
         */
        subscribe(event, handler) {
            if (typeof handler !== 'function') {
                console.error('Event handler must be a function');
                return null;
            }

            this._handlers[event] = this._handlers[event] || [];
            const handlerId = GroupSesh.Core.Base.generateUniqueId('evt_');
            
            this._handlers[event].push({
                id: handlerId,
                handler: handler
            });
            
            return handlerId;
        },

        /**
         * Remove a inscrição de um handler
         * @param {string} event - Nome do evento
         * @param {string} handlerId - ID do handler a ser removido
         * @returns {boolean} Verdadeiro se remoção bem-sucedida
         */
        unsubscribe(event, handlerId) {
            if (!this._handlers[event]) return false;

            const initialLength = this._handlers[event].length;
            this._handlers[event] = this._handlers[event].filter(h => h.id !== handlerId);
            
            return this._handlers[event].length < initialLength;
        },

        /**
         * Dispara um evento com dados opcionais
         * @param {string} event - Nome do evento
         * @param {*} data - Dados a serem passados para os handlers
         */
        publish(event, data) {
            if (!this._handlers[event]) return;
            
            this._handlers[event].forEach(subscriber => {
                try {
                    subscriber.handler(data);
                } catch (error) {
                    console.error(`Error in event handler for ${event}:`, error);
                }
            });
        },

        /**
         * Remove todos os handlers de um evento
         * @param {string} event - Nome do evento
         */
        clearHandlers(event) {
            if (event) {
                delete this._handlers[event];
            } else {
                this._handlers = {};
            }
        }
    };

    // Exportar o módulo
    GroupSesh.Core.Events = Events;
})();
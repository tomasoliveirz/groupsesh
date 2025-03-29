/**
 * events.js - Sistema de eventos personalizado
 * Depende de Core/Base (pois usa generateUniqueId)
 */
(function() {
    'use strict';

    // Garantir namespace
    window.GroupSesh = window.GroupSesh || {};
    window.GroupSesh.Core = window.GroupSesh.Core || {};

    // Evitar redefinição
    if (GroupSesh.Core.Events) {
        console.log('GroupSesh.Core.Events já existente, usando versão atual');
        return;
    }

    /**
     * Sistema de eventos
     */
    const Events = {
        _handlers: {},

        subscribe(eventName, handler) {
            if (typeof handler !== 'function') {
                console.error('Event handler must be a function');
                return null;
            }

            if (!this._handlers[eventName]) {
                this._handlers[eventName] = [];
            }

            const id = GroupSesh.Core.Base.generateUniqueId('evt_');
            this._handlers[eventName].push({ id, handler });
            return id;
        },

        unsubscribe(eventName, handlerId) {
            const subs = this._handlers[eventName];
            if (!subs) return false;

            const before = subs.length;
            this._handlers[eventName] = subs.filter(s => s.id !== handlerId);
            return this._handlers[eventName].length < before;
        },

        publish(eventName, data) {
            const subs = this._handlers[eventName];
            if (!subs) return;

            subs.forEach(sub => {
                try {
                    sub.handler(data);
                } catch (err) {
                    console.error(`Erro no handler do evento "${eventName}":`, err);
                }
            });
        },

        clearHandlers(eventName) {
            if (eventName) {
                delete this._handlers[eventName];
            } else {
                this._handlers = {};
            }
        }
    };

    // Exportar
    GroupSesh.Core.Events = Events;
    console.log('Events inicializado com sucesso');
})();

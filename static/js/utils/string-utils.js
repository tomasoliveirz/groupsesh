/**
 * string-utils.js - Utilitários para manipulação de strings
 * @module Utils/StringUtils
 */
window.GroupSesh = window.GroupSesh || {};
GroupSesh.Utils = GroupSesh.Utils || {};

(function() {
    'use strict';

    /**
     * Utilitários para manipulação de strings
     * @namespace
     */
    const StringUtils = {
        /**
         * Escapa string para uso em CSV
         * @param {string} str - String a ser escapada
         * @returns {string} String escapada para CSV
         */
        escapeCSV(str) {
            if (typeof str !== 'string') return '';
            
            // Se a string contém aspas, vírgulas ou quebras de linha
            if (/[",\n\r]/.test(str)) {
                // Substituir aspas por aspas duplas e envolver em aspas
                return '"' + str.replace(/"/g, '""') + '"';
            }
            
            return str;
        },
        
        /**
         * Cria um nome de arquivo seguro
         * @param {string} filename - Nome do arquivo original
         * @returns {string} Nome de arquivo sanitizado
         */
        sanitizeFilename(filename) {
            if (typeof filename !== 'string') return '';
            
            // Remover caracteres inválidos para nomes de arquivo
            return filename.replace(/[^\w\s-]/g, '_')
                          .replace(/\s+/g, '_')
                          .toLowerCase();
        },
        
        /**
         * Trunca uma string com ellipsis se exceder tamanho máximo
         * @param {string} str - String a ser truncada
         * @param {number} maxLength - Tamanho máximo
         * @returns {string} String truncada
         */
        truncate(str, maxLength = 100) {
            if (typeof str !== 'string') return '';
            if (str.length <= maxLength) return str;
            
            return str.substring(0, maxLength - 3) + '...';
        }
    };
    
    // Exportar o módulo
    GroupSesh.Utils.StringUtils = StringUtils;
})();
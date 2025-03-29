/**
 * export-tools.js - Ferramentas de exportação de dados
 * @module Dashboard/ExportTools
 * @requires Core/Base
 * @requires Utils/StringUtils
 * @requires UI/Notifications
 */
(function() {
    'use strict';

    // Garantir namespace
    window.GroupSesh = window.GroupSesh || {};
    window.GroupSesh.Dashboard = window.GroupSesh.Dashboard || {};

    // Se já existir, não redefine
    if (window.GroupSesh.Dashboard.ExportTools) {
        console.log('GroupSesh.Dashboard.ExportTools já existente, usando versão atual');
        return;
    }

    /**
     * Ferramentas para exportação de dados
     * @namespace ExportTools
     */
    const ExportTools = {
        /**
         * Exporta dados de participantes para CSV
         * @param {Object} surveyData - Dados completos da survey
         * @returns {boolean} Sucesso da operação
         */
        exportToCSV(surveyData) {
            if (!surveyData || !surveyData.participants) {
                const isEnglish = GroupSesh.Core.Base.isEnglishLocale();
                alert(isEnglish ? 
                    "Data not available for export" : 
                    "Dados não disponíveis para exportação");
                return false;
            }
            
            try {
                const isEnglish = GroupSesh.Core.Base.isEnglishLocale();
                const StringUtils = GroupSesh.Utils.StringUtils;
                const DateUtils = GroupSesh.Utils.DateUtils;
                
                // Criar cabeçalho do CSV
                let csv = isEnglish
                    ? 'Name,Email,Response Date,Available Days\n'
                    : 'Nome,Email,Data de Resposta,Dias Disponíveis\n';
                
                // Adicionar dados de cada participante
                Object.values(surveyData.participants).forEach(participant => {
                    if (!participant) return;
                    
                    const name = participant.name || '';
                    const email = participant.email || '';
                    const createdAt = participant.created_at
                        ? DateUtils.formatDate(participant.created_at, 'short')
                        : '';
                    
                    // Formatar datas disponíveis
                    let dates = '';
                    if (Array.isArray(participant.availability_dates)) {
                        dates = participant.availability_dates
                                .map(d => DateUtils.formatDate(d, 'short'))
                                .join('; ');
                    }
                    
                    // Adicionar linha ao CSV
                    csv += [
                        StringUtils.escapeCSV(name),
                        StringUtils.escapeCSV(email),
                        StringUtils.escapeCSV(createdAt),
                        StringUtils.escapeCSV(dates)
                    ].join(',') + '\n';
                });
                
                // Gerar nome de arquivo seguro
                let filename = 'survey_export_' + new Date().toISOString().slice(0, 10) + '.csv';
                if (surveyData.survey && surveyData.survey.title) {
                    const safeTitle = StringUtils.sanitizeFilename(surveyData.survey.title);
                    filename = `survey_${safeTitle}_${new Date().toISOString().slice(0, 10)}.csv`;
                }
                
                // Criar blob e link para download
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                
                if (window.navigator && window.navigator.msSaveOrOpenBlob) {
                    // Para IE
                    window.navigator.msSaveOrOpenBlob(blob, filename);
                } else {
                    // Para navegadores modernos
                    link.href = URL.createObjectURL(blob);
                    link.setAttribute('download', filename);
                    link.style.display = 'none';
                    document.body.appendChild(link);
                    link.click();
                    
                    // Limpeza
                    setTimeout(() => {
                        document.body.removeChild(link);
                        URL.revokeObjectURL(link.href);
                    }, 100);
                }
                
                // Exibir notificação de sucesso
                GroupSesh.UI.Notifications.toast(
                    isEnglish ? 'Export completed successfully' : 'Exportação concluída com sucesso',
                    GroupSesh.UI.Notifications.TYPES.SUCCESS
                );
                
                return true;
            } catch (error) {
                console.error('Error exporting to CSV:', error);
                
                const isEnglish = GroupSesh.Core.Base.isEnglishLocale();
                alert(isEnglish
                    ? "Could not export data. Error: " + error.message
                    : "Não foi possível exportar os dados. Erro: " + error.message
                );
                
                return false;
            }
        },
        
        /**
         * Exporta dados para formato JSON
         * @param {Object} surveyData - Dados completos da survey
         * @returns {boolean} Sucesso da operação
         */
        exportToJSON(surveyData) {
            if (!surveyData) {
                const isEnglish = GroupSesh.Core.Base.isEnglishLocale();
                alert(isEnglish 
                    ? "Data not available for export" 
                    : "Dados não disponíveis para exportação");
                return false;
            }
            
            try {
                const StringUtils = GroupSesh.Utils.StringUtils;
                
                // Criar um clone profundo para evitar referências circulares
                const exportData = JSON.stringify(surveyData, null, 2);
                
                // Gerar nome de arquivo
                let filename = 'survey_data_' + new Date().toISOString().slice(0, 10) + '.json';
                if (surveyData.survey && surveyData.survey.title) {
                    const safeTitle = StringUtils.sanitizeFilename(surveyData.survey.title);
                    filename = `survey_${safeTitle}_${new Date().toISOString().slice(0, 10)}.json`;
                }
                
                // Criar blob e link para download
                const blob = new Blob([exportData], { type: 'application/json' });
                const link = document.createElement('a');
                
                link.href = URL.createObjectURL(blob);
                link.setAttribute('download', filename);
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                
                setTimeout(() => {
                    document.body.removeChild(link);
                    URL.revokeObjectURL(link.href);
                }, 100);
                
                return true;
            } catch (error) {
                console.error('Error exporting to JSON:', error);
                
                const isEnglish = GroupSesh.Core.Base.isEnglishLocale();
                alert(isEnglish
                    ? "Could not export data. Error: " + error.message
                    : "Não foi possível exportar os dados. Erro: " + error.message
                );
                
                return false;
            }
        }
    };
    
    // Exportar o módulo
    window.GroupSesh.Dashboard.ExportTools = ExportTools;
    console.log('Export Tools inicializado com sucesso');
})();

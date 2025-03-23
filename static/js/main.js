/**
 * GroupSesh - Script principal
 * Utilitários e funcionalidades globais para toda a aplicação
 */

// Constantes globais
const GS = {
    // Configurações de animação
    ANIMATION: {
        DURATION: 300,
        EASING: 'ease'
    },
    
    // Mensagens reusáveis
    MESSAGES: {
        ERROR: {
            NETWORK: 'Erro de conexão. Verifique sua internet e tente novamente.',
            SERVER: 'Erro no servidor. Por favor, tente novamente mais tarde.',
            VALIDATION: 'Por favor, verifique os campos com erro e tente novamente.'
        },
        SUCCESS: {
            SAVE: 'Dados salvos com sucesso!',
            UPDATE: 'Atualizado com sucesso!'
        }
    },
    
    // Formatos de data
    DATE_FORMATS: {
        DISPLAY: {
            SHORT: { day: '2-digit', month: '2-digit', year: 'numeric' },
            FULL: { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }
        },
        ISO: { year: 'numeric', month: '2-digit', day: '2-digit' }
    }
};

/**
 * Manipulador central para detecção de tema e preferências do usuário
 */
const ThemeManager = {
    /**
     * Inicializa o gerenciador de temas
     */
    init() {
        this.themeToggle = document.getElementById('theme-toggle');
        this.body = document.getElementById('page-body');
        
        if (!this.themeToggle || !this.body) return;
        
        // Verificar tema salvo ou preferência do sistema
        const savedTheme = localStorage.getItem('gs-theme');
        if (savedTheme) {
            this.setTheme(savedTheme);
        } else {
            // Verificar preferência de tema do sistema
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            this.setTheme(prefersDark ? 'theme-dark' : 'theme-light');
        }
        
        // Adicionar handler para alternar tema
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
        
        // Ouvir mudanças na preferência do sistema
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
            if (!localStorage.getItem('gs-theme')) {
                this.setTheme(e.matches ? 'theme-dark' : 'theme-light');
            }
        });
    },
    
    /**
     * Define um tema específico
     * @param {string} theme - Nome do tema a ser aplicado ('theme-light' ou 'theme-dark')
     */
    setTheme(theme) {
        // Remover todos os temas existentes
        this.body.classList.remove('theme-light', 'theme-dark');
        
        // Aplicar novo tema
        this.body.classList.add(theme);
        
        // Salvar preferência
        localStorage.setItem('gs-theme', theme);
        
        // Disparar evento de mudança de tema
        document.dispatchEvent(new CustomEvent('themeChanged', {
            detail: { theme }
        }));
    },
    
    /**
     * Alterna entre temas claro e escuro
     */
    toggleTheme() {
        const currentTheme = this.body.classList.contains('theme-light') ? 'theme-light' : 'theme-dark';
        const newTheme = currentTheme === 'theme-light' ? 'theme-dark' : 'theme-light';
        
        this.setTheme(newTheme);
    },
    
    /**
     * Retorna o tema atual
     * @returns {string} Nome do tema atual
     */
    getCurrentTheme() {
        return this.body.classList.contains('theme-light') ? 'theme-light' : 'theme-dark';
    }
};

/**
 * Utilitário para manipular o idioma da aplicação
 */
const LanguageManager = {
    /**
     * Inicializa o gerenciador de idiomas
     */
    init() {
        const langSelector = document.querySelector('.language-selector');
        if (!langSelector) return;
        
        // Encontrar todos os links de idioma
        const langLinks = document.querySelectorAll('.dropdown-menu .dropdown-item');
        
        // Adicionar handler para cada link de idioma
        langLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                if (link.classList.contains('active')) {
                    e.preventDefault();
                    return;
                }
                
                // O link já contém o href correto definido pelo backend
            });
        });
    }
};

/**
 * Utilitários para validação de formulários
 */
const FormUtils = {
    /**
     * Valida um formulário com base nos atributos required e pattern
     * @param {HTMLFormElement} form - Elemento do formulário
     * @returns {boolean} True se o formulário for válido
     */
    validateForm(form) {
        let isValid = true;
        
        // Encontrar campos obrigatórios
        const requiredFields = form.querySelectorAll('[required]');
        
        // Validar cada campo
        requiredFields.forEach(field => {
            // Limpar validação anterior
            field.classList.remove('is-invalid');
            
            // Verificar se está vazio
            if (!field.value.trim()) {
                field.classList.add('is-invalid');
                isValid = false;
                return;
            }
            
            // Verificar se corresponde ao pattern (se tiver)
            if (field.pattern && !new RegExp(field.pattern).test(field.value)) {
                field.classList.add('is-invalid');
                isValid = false;
                return;
            }
            
            // Verificar tipo específico
            if (field.type === 'email') {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(field.value)) {
                    field.classList.add('is-invalid');
                    isValid = false;
                }
            }
        });
        
        return isValid;
    },
    
    /**
     * Mostra uma mensagem de erro em um alerta
     * @param {string} message - Mensagem de erro
     * @param {HTMLElement} container - Contêiner onde o alerta será inserido
     * @param {number} duration - Duração em ms (0 para não auto-fechar)
     */
    showError(message, container, duration = 5000) {
        const alertElement = document.createElement('div');
        alertElement.className = 'alert alert-danger alert-dismissible fade show';
        alertElement.setAttribute('role', 'alert');
        
        alertElement.innerHTML = `
            <strong>Erro!</strong> ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>
        `;
        
        // Inserir no início do contêiner
        container.prepend(alertElement);
        
        // Auto-fechar após a duração (se não for 0)
        if (duration > 0) {
            setTimeout(() => {
                alertElement.classList.remove('show');
                setTimeout(() => alertElement.remove(), 300);
            }, duration);
        }
        
        return alertElement;
    },
    
    /**
     * Mostra uma mensagem de sucesso em um alerta
     * @param {string} message - Mensagem de sucesso
     * @param {HTMLElement} container - Contêiner onde o alerta será inserido
     * @param {number} duration - Duração em ms (0 para não auto-fechar)
     */
    showSuccess(message, container, duration = 5000) {
        const alertElement = document.createElement('div');
        alertElement.className = 'alert alert-success alert-dismissible fade show';
        alertElement.setAttribute('role', 'alert');
        
        alertElement.innerHTML = `
            <strong>Sucesso!</strong> ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>
        `;
        
        // Inserir no início do contêiner
        container.prepend(alertElement);
        
        // Auto-fechar após a duração (se não for 0)
        if (duration > 0) {
            setTimeout(() => {
                alertElement.classList.remove('show');
                setTimeout(() => alertElement.remove(), 300);
            }, duration);
        }
        
        return alertElement;
    },
    
    /**
     * Copia o conteúdo de um elemento para a área de transferência
     * @param {string} elementId - ID do elemento a ser copiado
     * @returns {boolean} True se foi copiado com sucesso
     */
    copyToClipboard(elementId) {
        const element = document.getElementById(elementId);
        if (!element) return false;
        
        element.select();
        
        try {
            document.execCommand('copy');
            return true;
        } catch (err) {
            console.error('Erro ao copiar para a área de transferência:', err);
            return false;
        }
    }
};

/**
 * Utilitários para formatação de datas
 */
const DateUtils = {
    /**
     * Formata uma data ISO para exibição
     * @param {string} isoDate - Data em formato ISO
     * @param {string} format - Formato de saída ('short' ou 'full')
     * @param {string} locale - Locale para formatação (ex: 'pt-BR')
     * @returns {string} Data formatada
     */
    formatDate(isoDate, format = 'short', locale = 'pt-BR') {
        if (!isoDate) return '';
        
        try {
            const date = new Date(isoDate);
            
            // Verificar se a data é válida
            if (isNaN(date.getTime())) {
                return '';
            }
            
            // Obter opções de formato
            const options = GS.DATE_FORMATS.DISPLAY[format.toUpperCase()] || GS.DATE_FORMATS.DISPLAY.SHORT;
            
            return date.toLocaleDateString(locale, options);
        } catch (e) {
            console.error('Erro ao formatar data:', e);
            return isoDate; // Retornar a string original em caso de erro
        }
    },
    
    /**
     * Converte uma data para formato ISO (YYYY-MM-DD)
     * @param {Date} date - Objeto de data
     * @returns {string} Data no formato ISO
     */
    toISODate(date) {
        if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
            return '';
        }
        
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        
        return `${year}-${month}-${day}`;
    },
    
    /**
     * Verifica se uma data é passada em relação à data atual
     * @param {Date|string} date - Data a verificar
     * @returns {boolean} True se a data for passada
     */
    isPastDate(date) {
        const checkDate = date instanceof Date ? date : new Date(date);
        const today = new Date();
        
        // Resetar horas para comparar apenas datas
        today.setHours(0, 0, 0, 0);
        checkDate.setHours(0, 0, 0, 0);
        
        return checkDate < today;
    }
};

/**
 * Inicialização global
 */
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar gerenciadores
    ThemeManager.init();
    LanguageManager.init();
    
    // Inicializar tooltips do Bootstrap (se existirem)
    if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
        const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
        tooltips.forEach(tooltip => new bootstrap.Tooltip(tooltip));
    }
    
    // Adicionar handlers para links com rolagem suave
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            
            // Ignorar se o targetId for apenas "#"
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                e.preventDefault();
                
                // Rolagem suave
                window.scrollTo({
                    top: targetElement.offsetTop - 80, // Ajuste para o header fixo
                    behavior: 'smooth'
                });
                
                // Atualizar URL sem recarregar a página
                history.pushState(null, null, targetId);
            }
        });
    });
    
    // Remover classes .is-invalid ao digitar em campos de formulário
    document.querySelectorAll('input, textarea, select').forEach(field => {
        field.addEventListener('input', function() {
            this.classList.remove('is-invalid');
            
            // Remover feedback de erro associado (se existir)
            const feedback = this.nextElementSibling;
            if (feedback && feedback.classList.contains('invalid-feedback')) {
                feedback.style.display = 'none';
            }
        });
    });
});
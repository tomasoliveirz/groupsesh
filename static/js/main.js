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

// Global application object
const GroupSeshApp = {
    // Application state
    state: {
        currentLanguage: null,
        isLoading: false
    },
    
    /**
     * Initialize the application
     */
    init() {
        console.log('[Main] Initializing application');
        
        // Initialize components
        ThemeManager.init();
        this.initUserInterface();
        
        // Get current language from URL
        this.state.currentLanguage = LanguageManager.getCurrentLanguage();
        
        // Initialize language manager
        LanguageManager.init();
        LanguageManager.updateLinksLanguage();
        
        // Application is ready
        console.log('[Main] Application initialized');
        document.dispatchEvent(new CustomEvent('appReady'));
    },
    
    /**
     * Initialize user interface components
     */
    initUserInterface() {
        // Initialize Bootstrap components if available
        if (typeof bootstrap !== 'undefined') {
            // Initialize tooltips
            const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
            if (tooltipTriggerList.length > 0) {
                [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
            }
            
            // Initialize popovers
            const popoverTriggerList = document.querySelectorAll('[data-bs-toggle="popover"]');
            if (popoverTriggerList.length > 0) {
                [...popoverTriggerList].map(popoverTriggerEl => new bootstrap.Popover(popoverTriggerEl));
            }
        }
        
        // Add input handlers to clear validation errors
        document.querySelectorAll('input, textarea, select').forEach(field => {
            field.addEventListener('input', function() {
                this.classList.remove('is-invalid');
                
                // Hide error feedback if it exists
                const feedback = this.nextElementSibling;
                if (feedback && feedback.classList.contains('invalid-feedback')) {
                    feedback.style.display = 'none';
                }
            });
        });
        
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
    },
    
    /**
     * Handle API requests with proper error handling
     * @param {string} url - API endpoint URL
     * @param {Object} options - Fetch options
     * @returns {Promise} - Promise resolving to response data
     */
    async fetchAPI(url, options = {}) {
        try {
            // Show loading state if needed
            if (options.showLoading !== false) {
                this.state.isLoading = true;
                // Add visual loading indicator if needed
            }
            
            // Set up headers
            const headers = {
                'X-Requested-With': 'XMLHttpRequest',
                ...(options.headers || {})
            };
            
            // Default to JSON content type unless explicitly set otherwise
            if (!headers['Content-Type'] && !options.formData) {
                headers['Content-Type'] = 'application/json';
                headers['Accept'] = 'application/json';
            }
            
            // Prepare fetch options
            const fetchOptions = {
                ...options,
                headers
            };
            
            // Execute fetch request
            const response = await fetch(url, fetchOptions);
            
            // Handle unsuccessful responses
            if (!response.ok) {
                const errorData = await this.parseResponse(response);
                throw new Error(
                    typeof errorData === 'object' && errorData.error
                        ? errorData.error
                        : `API request failed with status ${response.status}`
                );
            }
            
            // Parse successful response
            return await this.parseResponse(response);
        } catch (error) {
            console.error('API request error:', error);
            throw error;
        } finally {
            // Reset loading state
            this.state.isLoading = false;
        }
    },

    /**
     * Safely parse response based on content type
     * @param {Response} response - Fetch Response object
     * @returns {Promise<Object|string>} - Parsed response
     */
    async parseResponse(response) {
        try {
            // Check content type header
            const contentType = response.headers.get('content-type') || '';
            
            // Parse as JSON if indicated by content type
            if (contentType.includes('application/json')) {
                return await response.json();
            }
            
            // For non-JSON responses, return as text
            const text = await response.text();
            
            // Try to parse as JSON anyway in case content-type is wrong
            // but only if it starts with a JSON character
            if ((text.trim().startsWith('{') || text.trim().startsWith('[')) && !text.includes('<!DOCTYPE')) {
                try {
                    return JSON.parse(text);
                } catch (e) {
                    // If it fails, just return the text
                    return text;
                }
            }
            
            return text;
        } catch (error) {
            console.error('Error parsing response:', error);
            return response.text(); // Fallback to text if parsing fails
        }
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
 * Utility for managing application language
 */
const LanguageManager = {
    /**
     * Initialize the language manager
     */
    init() {
        console.log('[LanguageManager] Initializing language manager');
        const langSelector = document.querySelector('.language-selector');
        if (!langSelector) {
            console.log('[LanguageManager] No language selector found');
            return;
        }
        
        // Find all language links
        const langLinks = document.querySelectorAll('.dropdown-menu .dropdown-item');
        
        // Add handler for each language link
        langLinks.forEach(link => {
            // Remove any existing click listeners to avoid duplicates
            link.removeEventListener('click', this.handleLanguageClick);
            
            // Add our handler
            link.addEventListener('click', this.handleLanguageClick);
        });
        
        console.log('[LanguageManager] Language links initialized:', langLinks.length);
    },
    
    /**
     * Handle language link clicks
     * @param {Event} e - The click event
     */
    handleLanguageClick(e) {
        // If the language is already active, don't do anything
        if (this.classList.contains('active')) {
            console.log('[LanguageManager] Active language clicked, preventing action');
            e.preventDefault();
            return;
        }
        
        console.log('[LanguageManager] Language change requested to:', this.href);
        
        // Add loading class to body to show loading state
        document.body.classList.add('language-switching');
        
        // Let the browser handle the navigation normally
        // Do not prevent default - we want a full page reload for language changes
    },
    
    /**
     * Gets the current language code from the URL or HTML
     * @returns {string} Current language code
     */
    getCurrentLanguage() {
        // Try to get language from URL path
        const pathMatch = window.location.pathname.match(/^\/([a-z]{2}(?:-[a-z]{2})?)\//);
        if (pathMatch && pathMatch[1]) {
            return pathMatch[1];
        }
        
        // Try to get from HTML attribute
        const htmlLang = document.documentElement.lang;
        if (htmlLang) return htmlLang;
        
        // Try to get from active language selector
        const activeLink = document.querySelector('.dropdown-menu .dropdown-item.active');
        if (activeLink) {
            const href = activeLink.getAttribute('href');
            const match = href.match(/\/([a-z]{2}(?:-[a-z]{2})?)\//);
            if (match && match[1]) {
                return match[1];
            }
        }
        
        // Default to English if we can't determine
        return 'en';
    },
    
    /**
     * Updates links in the page to include the current language code
     * This is helpful for dynamically generated content
     */
    updateLinksLanguage() {
        const currentLang = this.getCurrentLanguage();
        console.log('[LanguageManager] Updating dynamic links with language:', currentLang);
        
        // Find links without language code
        document.querySelectorAll('a[href^="/"]').forEach(link => {
            const href = link.getAttribute('href');
            
            // Skip links that already have a language code
            if (href.match(/^\/[a-z]{2}(?:-[a-z]{2})?\//)) {
                return;
            }
            
            // Add language code to links that don't have one
            link.setAttribute('href', `/${currentLang}${href}`);
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

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the main application
    GroupSeshApp.init();
    
    // Listen for page content updates (for AJAX loaded content)
    document.addEventListener('pageContentUpdated', function(e) {
        console.log('[Main] Page content updated', e.detail?.pageType || '');
        
        // Reinitialize language manager for new content
        LanguageManager.init();
        LanguageManager.updateLinksLanguage();
    });
});

// Make utilities globally available
window.GroupSeshApp = GroupSeshApp;
window.ThemeManager = ThemeManager;
window.LanguageManager = LanguageManager;
window.FormUtils = FormUtils;
window.DateUtils = DateUtils;
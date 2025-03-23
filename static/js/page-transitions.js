/**
 * page-transitions.js - Smooth page transitions with AJAX
 */

document.addEventListener('DOMContentLoaded', function() {
    // Main container that will be updated with new content
    const mainContainer = document.querySelector('main');
    // Store the current URL to avoid unnecessary page loads
    let currentUrl = window.location.href;
    
    // Initialize the transition system
    initPageTransitions();
    initLanguageSwitcher();
    
    /**
     * Initializes the page transition system
     */
    function initPageTransitions() {
        // Add event listener for all internal links
        document.addEventListener('click', function(e) {
            // Find the closest anchor tag if the click was on a child element
            const link = e.target.closest('a');
            
            // Skip if no link was found or link has special attributes
            if (!link || 
                link.getAttribute('target') === '_blank' || 
                link.getAttribute('rel') === 'external' ||
                link.getAttribute('data-no-transition') === 'true' ||
                link.href.startsWith('mailto:') ||
                link.href.startsWith('tel:') ||
                link.href.includes('#') ||
                link.getAttribute('href') === '#') {
                return;
            }
            
            // Skip language switcher links (handled separately)
            if (link.closest('.language-selector') || link.closest('.dropdown-menu')) {
                return;
            }
            
            // Check if this is an internal link
            const urlObj = new URL(link.href);
            const isSameOrigin = urlObj.origin === window.location.origin;
            
            // Skip AJAX for external links or API calls
            if (!isSameOrigin || urlObj.pathname.startsWith('/api/')) {
                return;
            }
            
            // If it's the same URL, prevent default and do nothing
            if (currentUrl === link.href) {
                e.preventDefault();
                return;
            }
            
            // Prevent default link behavior for internal links
            e.preventDefault();
            
            // Load the new page via AJAX
            loadPage(link.href);
        });
        
        // Handle browser back/forward buttons
        window.addEventListener('popstate', function(e) {
            // Load the page from browser history
            if (e.state && e.state.url) {
                loadPage(e.state.url, false);
            }
        });
    }
    
    /**
     * Initialize the language switcher to preserve current page
     */
    function initLanguageSwitcher() {
        const languageLinks = document.querySelectorAll('.dropdown-menu .dropdown-item');
        
        languageLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Get current URL path parts
                const currentPath = window.location.pathname;
                const pathParts = currentPath.split('/');
                
                // Get new language code from link
                const newUrl = new URL(this.href);
                const newLangCode = newUrl.pathname.split('/')[1];
                
                // If we have a valid path structure
                if (pathParts.length >= 3) {
                    // Replace language code in current path
                    pathParts[1] = newLangCode;
                    
                    // Build new URL with query parameters
                    const newPath = pathParts.join('/') + window.location.search + window.location.hash;
                    
                    // Use our smooth page transition
                    loadPage(newPath);
                } else {
                    // Fallback to traditional navigation
                    window.location.href = this.href;
                }
            });
        });
    }
    
    /**
     * Loads a page via AJAX and smoothly transitions to it
     * @param {string} url - URL of the page to load
     * @param {boolean} addToHistory - Whether to add the page to browser history
     */
    function loadPage(url, addToHistory = true) {
        console.log('Loading page:', url);
        
        // Show loading indicator
        showLoadingIndicator();
        
        // Fetch the new page content
        fetch(url, {
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.text();
        })
        .then(html => {
            // Parse the HTML to extract the main content
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const newContent = doc.querySelector('main');
            
            // Extract the page title
            const title = doc.querySelector('title').textContent;
            
            // Start transition out of current content
            mainContainer.classList.add('page-transition-out');
            
            // After transition out completes, update content and transition in
            setTimeout(() => {
                // Update page title
                document.title = title;
                
                // Update main content
                mainContainer.innerHTML = newContent.innerHTML;
                
                // Update current URL
                currentUrl = url;
                
                // Update language drop-down active state
                updateLanguageActive(url);
                
                // Add to browser history if needed
                if (addToHistory) {
                    history.pushState({ url: url }, title, url);
                }
                
                // Initialize any scripts in the new content
                initNewContentScripts();
                
                // Hide loading indicator
                hideLoadingIndicator();
                
                // Start transition in for new content
                mainContainer.classList.remove('page-transition-out');
                mainContainer.classList.add('page-transition-in');
                
                // Remove transition classes after animation completes
                setTimeout(() => {
                    mainContainer.classList.remove('page-transition-in');
                }, 500);
                
                // Scroll to top
                window.scrollTo(0, 0);
            }, 300);
        })
        .catch(error => {
            console.error('Error loading page:', error);
            // On error, redirect to the URL the traditional way
            window.location.href = url;
        });
    }
    
    /**
     * Update the active state in language dropdown
     */
    function updateLanguageActive(url) {
        const langCode = url.split('/')[1];
        document.querySelectorAll('.dropdown-menu .dropdown-item').forEach(item => {
            if (item.href.includes(`/${langCode}/`)) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }
    
    /**
     * Creates and shows a loading indicator
     */
    function showLoadingIndicator() {
        // Check if loading indicator already exists
        if (document.getElementById('page-loading-indicator')) {
            document.getElementById('page-loading-indicator').style.display = 'flex';
            return;
        }
        
        // Create loading indicator
        const loadingIndicator = document.createElement('div');
        loadingIndicator.id = 'page-loading-indicator';
        loadingIndicator.innerHTML = `
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        `;
        
        // Style the loading indicator
        Object.assign(loadingIndicator.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: '9999',
            opacity: '0',
            transition: 'opacity 0.2s ease'
        });
        
        // Add to document
        document.body.appendChild(loadingIndicator);
        
        // Trigger reflow for transition to work
        loadingIndicator.offsetHeight;
        loadingIndicator.style.opacity = '1';
    }
    
    /**
     * Hides the loading indicator
     */
    function hideLoadingIndicator() {
        const loadingIndicator = document.getElementById('page-loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.style.opacity = '0';
            setTimeout(() => {
                loadingIndicator.style.display = 'none';
            }, 200);
        }
    }
    
    /**
     * Initialize scripts for newly loaded content
     */
    function initNewContentScripts() {
        // Re-initialize any Bootstrap components
        if (typeof bootstrap !== 'undefined') {
            // Tooltips
            const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
            tooltips.forEach(tooltip => new bootstrap.Tooltip(tooltip));
            
            // Popovers
            const popovers = document.querySelectorAll('[data-bs-toggle="popover"]');
            popovers.forEach(popover => new bootstrap.Popover(popover));
        }
        
        // Re-initialize form validation
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            form.querySelectorAll('input, textarea, select').forEach(field => {
                field.addEventListener('input', function() {
                    this.classList.remove('is-invalid');
                });
            });
        });
        
        // Re-initialize create survey form if it exists
        if (typeof window.resetForm === 'function' && document.getElementById('create-survey-form')) {
            const createForm = document.getElementById('create-survey-form');
            createForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                // Call the form handler from create.js
                const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
                createForm.dispatchEvent(submitEvent);
            });
        }
            // ADICIONADO: Detecção e inicialização específica para o calendário
        if (document.getElementById('calendar')) {
            console.log('Calendário detectado, iniciando inicialização...');
            
            // Se existir um calendário já inicializado, destrua-o primeiro
            if (window.surveyCalendar) {
                console.log('Destruindo instância anterior do calendário');
                window.surveyCalendar.destroy();
                window.surveyCalendar = null;
            }
            
            // Verificar se as dependências estão disponíveis
            if (typeof FullCalendar === 'undefined') {
                console.warn('Biblioteca FullCalendar não encontrada. Carregando dinamicamente...');
                loadScript('https://cdn.jsdelivr.net/npm/fullcalendar@5.11.3/main.min.js', function() {
                    loadScript('https://cdn.jsdelivr.net/npm/fullcalendar@5.11.3/locales-all.min.js', initializeCalendar);
                });
            } else if (typeof DateUtils !== 'undefined' && typeof Validation !== 'undefined') {
                // Se todas as dependências estiverem disponíveis, inicializar diretamente
                initializeCalendar();
            } else {
                // Tentar carregar os scripts necessários em sequência
                loadModulesSequentially([
                    '/static/js/common/validation.js',
                    '/static/js/common/date-utils.js',
                    '/static/js/common/ui-utils.js',
                    '/static/js/common/api.js',
                    '/static/js/pages/create.js'
                ], function() {
                    console.log('Módulos carregados. Tentando inicializar calendário...');
                    // Aguardar um momento para garantir que tudo foi processado
                    setTimeout(initializeCalendar, 50);
                });
            }
        }
        // Dispatch a custom event for other scripts to hook into
        document.dispatchEvent(new CustomEvent('pageContentUpdated'));
    }
    
    /**
     * Carrega scripts sequencialmente e executa um callback após conclusão
     * @param {Array} scripts - Array de URLs dos scripts a serem carregados
     * @param {Function} callback - Função a ser executada após o carregamento
     */
    function loadModulesSequentially(scripts, callback) {
        if (scripts.length === 0) {
            if (callback) callback();
            return;
        }
        
        const script = document.createElement('script');
        script.src = scripts[0];
        script.onload = function() {
            loadModulesSequentially(scripts.slice(1), callback);
        };
        document.head.appendChild(script);
    }

    /**
     * Carrega um único script e executa o callback após conclusão
     * @param {string} src - URL do script
     * @param {Function} callback - Função a ser executada após o carregamento
     */
    function loadScript(src, callback) {
        const script = document.createElement('script');
        script.src = src;
        script.onload = callback;
        document.head.appendChild(script);
    }

    /**
     * Inicializa o calendário usando a API DateUtils
     */
    function initializeCalendar() {
        console.log('Executando inicialização do calendário...');
        const calendarEl = document.getElementById('calendar');
        
        if (!calendarEl) {
            console.error('Elemento do calendário não encontrado');
            return;
        }
        
        try {
            // Inicializar o calendário e armazenar a instância globalmente
            window.surveyCalendar = DateUtils.initCalendar(calendarEl, {
                dateClick: function(info) {
                    // Recuperar ou recriar o conjunto de datas selecionadas
                    const selectedDates = window.selectedDates || new Set();
                    const dateStr = info.dateStr;
                    const dayEl = info.dayEl;
                    
                    // Lógica para toggle da seleção (retirada do create.js)
                    if (DateUtils.isPastDate(info.date)) return;
                    
                    if (selectedDates.has(dateStr)) {
                        selectedDates.delete(dateStr);
                        dayEl.classList.remove('fc-day-selected');
                    } else {
                        selectedDates.add(dateStr);
                        dayEl.classList.add('fc-day-selected');
                    }
                    
                    // Atualizar contador e input
                    updateSelectedDatesUI(selectedDates);
                    
                    // Armazenar globalmente para uso futuro
                    window.selectedDates = selectedDates;
                }
            });
            
            console.log('Calendário inicializado com sucesso!');
        } catch (error) {
            console.error('Erro ao inicializar calendário:', error);
        }
    }

    /**
     * Atualiza a interface com as datas selecionadas
     * @param {Set} selectedDates - Conjunto de datas selecionadas
     */
    function updateSelectedDatesUI(selectedDates) {
        const selectedDaysCounter = document.getElementById('selected-days-counter');
        const selectedDatesInput = document.getElementById('selected-dates');
        
        if (selectedDaysCounter) {
            selectedDaysCounter.textContent = selectedDates.size;
        }
        
        if (selectedDatesInput) {
            selectedDatesInput.value = Array.from(selectedDates).join(',');
        }
        
        const calendarFeedback = document.getElementById('calendar-feedback');
        if (calendarFeedback) {
            calendarFeedback.style.display = selectedDates.size > 0 ? 'none' : 'block';
        }
    }
    // Expose loadPage function globally for use by other scripts
    window.loadPage = loadPage;
});
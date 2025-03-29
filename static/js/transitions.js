/**
 * page-transitions.js - Smooth page transitions with AJAX e CSS unificado
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log("[Transitions] DOMContentLoaded event fired.");

    // Injetar CSS unificado do calendário
    injectUnifiedCalendarCSS();

    // Container principal que será atualizado com o novo conteúdo
    const mainContainer = document.querySelector('main');
    if (!mainContainer) {
        console.error("[Transitions] Main container <main> not found!");
        return;
    } else {
        console.log("[Transitions] Main container found.");
    }

    // Armazena a URL atual para evitar recarregamentos desnecessários
    let currentUrl = window.location.href;
    // Armazena o tipo da página atual (dashboard ou create-survey)
    let currentPageType = detectPageType(currentUrl);
    console.log("[Transitions] Current URL:", currentUrl);
    console.log("[Transitions] Current page type:", currentPageType);

    initPageTransitions();
    initLanguageSwitcher();

    /**
     * Injetar CSS unificado para todos os calendários
     */
    function injectUnifiedCalendarCSS() {
        // Verificar se o CSS já existe
        if (document.getElementById('calendar-unified-css')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'calendar-unified-css';
        style.textContent = `
        /* 
         * CSS Unificado para todos os calendários
         */
        .fc {
            max-width: 100%;
            font-family: inherit;
            --fc-border-color: #dee2e6;
            --fc-page-bg-color: #fff;
            --fc-highlight-color: rgba(13, 110, 253, 0.15);
            --fc-today-bg-color: rgba(13, 110, 253, 0.1);
            --fc-selected-bg-color: rgba(13, 110, 253, 0.25);
        }

        /* Tema escuro */
        .theme-dark .fc {
            --fc-border-color: #444;
            --fc-page-bg-color: #222;
            --fc-highlight-color: rgba(58, 135, 253, 0.25);
            --fc-today-bg-color: rgba(58, 135, 253, 0.15);
            --fc-selected-bg-color: rgba(58, 135, 253, 0.35);
            --fc-neutral-bg-color: #333;
            --fc-list-event-hover-bg-color: #444;
            color: #eee;
        }

        /* Cabeçalho do Calendário */
        .fc-header-toolbar {
            margin-bottom: 1em !important;
            padding: 0.5rem 0;
        }

        /* Botões do Calendário */
        .fc-button {
            background-color: var(--fc-button-bg-color, #f8f9fa) !important;
            color: var(--fc-button-text-color, #333) !important;
            border: 1px solid var(--fc-button-border-color, #dee2e6) !important;
            box-shadow: none !important;
            transition: all 0.2s ease !important;
        }

        .fc-button:hover {
            background-color: var(--fc-button-hover-bg-color, #e9ecef) !important;
            color: var(--fc-button-hover-text-color, #333) !important;
            border-color: var(--fc-button-hover-border-color, #ced4da) !important;
        }

        .fc-button-primary:not(:disabled).fc-button-active,
        .fc-button-primary:not(:disabled):active {
            background-color: var(--fc-button-active-bg-color, #0d6efd) !important;
            color: var(--fc-button-active-text-color, #fff) !important;
            border-color: var(--fc-button-active-border-color, #0d6efd) !important;
        }

        /* Cabeçalho dos Dias */
        .fc-col-header-cell {
            background-color: var(--fc-col-header-bg-color, #f8f9fa);
            padding: 10px 0 !important;
            font-weight: 600;
        }

        .theme-dark .fc-col-header-cell {
            background-color: var(--fc-col-header-bg-color, #333);
        }

        /* Células dos Dias */
        .fc-daygrid-day {
            transition: background-color 0.25s ease;
        }

        .fc-day-future {
            cursor: pointer !important;
            position: relative;
        }

        .fc-day-future:hover {
            background-color: var(--fc-day-hover-bg-color, rgba(13, 110, 253, 0.05));
        }

        .fc-day-today {
            background-color: var(--fc-today-bg-color) !important;
        }

        /* Altura mínima das células */
        .fc-daygrid-day-frame {
            min-height: 80px;
            transition: background-color 0.25s ease;
        }

        /* Número do dia */
        .fc-daygrid-day-number {
            font-weight: 500;
            padding: 8px !important;
        }

        /* === Estilos para Dias Especiais === */
        /* Dias Selecionados - Create Survey */
        .fc-day-selected {
            background-color: var(--fc-selected-bg-color) !important;
            position: relative;
            z-index: 1;
        }

        /* Dias com Participantes - Dashboard */
        .fc-day-has-participants {
            position: relative;
        }

        .fc-day-has-participants:after {
            content: "";
            position: absolute;
            top: 0;
            right: 0;
            width: 0;
            height: 0;
            border-style: solid;
            border-width: 0 12px 12px 0;
            border-color: transparent #198754 transparent transparent;
            z-index: 1;
        }

        .participant-count {
            position: absolute;
            bottom: 5px;
            right: 5px;
            background-color: #198754;
            color: white;
            border-radius: 50%;
            width: 22px;
            height: 22px;
            font-size: 12px;
            line-height: 22px;
            text-align: center;
            font-weight: bold;
            z-index: 2;
            transition: transform 0.2s ease;
        }

        .participant-count:hover {
            transform: scale(1.1);
        }

        /* === Esquema de Cores para Destacamento === */
        /* Cria um gradiente visual de destaque baseado no número de participantes */
        .highlight-participants .fc-daygrid-day-frame {
            transition: background-color 0.3s ease;
        }

        .highlight-participants.active[data-count="0"] .fc-daygrid-day-frame {
            background-color: #f8d7da !important; /* vermelho claro */
        }

        .highlight-participants.active[data-count="1"] .fc-daygrid-day-frame {
            background-color: #fff3cd !important; /* amarelo claro */
        }

        .highlight-participants.active[data-count="2"] .fc-daygrid-day-frame {
            background-color: #d1e7dd !important; /* verde claro */
        }

        .highlight-participants.active[data-count="3"] .fc-daygrid-day-frame {
            background-color: #c3e6cb !important; /* verde mais claro */
        }

        .highlight-participants.active[data-count="4"] .fc-daygrid-day-frame {
            background-color: #b1dfbb !important; /* verde médio */
        }

        .highlight-participants.active[data-count="5+"] .fc-daygrid-day-frame {
            background-color: #86cfac !important; /* verde forte */
        }

        /* Dias passados */
        .fc-day-past {
            background-color: var(--fc-past-day-bg-color, #f8f9fa);
            cursor: not-allowed !important;
        }

        .theme-dark .fc-day-past {
            background-color: var(--fc-past-day-bg-color, #2a2a2a);
        }

        /* Transições e Animações */
        .fc-view-harness {
            transition: height 0.3s ease;
        }

        .fc-event {
            transition: background-color 0.3s ease, border-color 0.3s ease, transform 0.2s ease;
        }

        .fc-event:hover {
            transform: translateY(-1px);
        }

        /* === Responsividade === */
        @media (max-width: 768px) {
            .fc-header-toolbar {
                flex-direction: column;
                gap: 8px;
            }
            
            .fc-toolbar-chunk {
                display: flex;
                justify-content: center;
            }
            
            .fc-daygrid-day-frame {
                min-height: 60px;
            }
        }

        @media (max-width: 576px) {
            .fc-daygrid-day-frame {
                min-height: 50px;
            }
            
            .fc-col-header-cell-cushion,
            .fc-daygrid-day-number {
                font-size: 0.9rem;
            }
        }`;

        document.head.appendChild(style);
        console.log("[Transitions] CSS unificado para calendários injetado com sucesso");
    }

    /**
     * Detecta o tipo de página com base na URL
     * @param {string} url - URL da página
     * @returns {string} Tipo da página ('dashboard', 'create-survey', 'other')
     */
    function detectPageType(url) {
        if (url.includes('/dashboard/')) return 'dashboard';
        if (url.includes('/create-survey')) return 'create-survey';
        return 'other';
    }

    /**
     * Inicializa o sistema de transição de páginas
     */
    function initPageTransitions() {
        console.log("[Transitions] Initializing page transitions...");
        document.addEventListener('click', function(e) {
            const link = e.target.closest('a');
            if (!link) {
                console.log("[Transitions] Click was not on a link. Ignoring.");
                return;
            }
            console.log("[Transitions] Click on link:", link.href);

            // Checa se deve abrir de modo tradicional (sem AJAX)
            if (shouldOpenNormally(link)) {
                console.log("[Transitions] shouldOpenNormally returned true. Letting browser handle link normally.");
                return;
            }

            // Tenta criar objeto URL
            let urlObj;
            try {
                urlObj = new URL(link.href);
            } catch (err) {
                console.error("[Transitions] Error parsing URL:", err);
                return;
            }

            const isSameOrigin = urlObj.origin === window.location.origin;
            if (!isSameOrigin || urlObj.pathname.startsWith('/api/')) {
                console.log("[Transitions] Link is external or an API call. Not intercepting:", link.href);
                return;
            }

            // Se for a mesma URL, evita recarregar
            if (currentUrl === link.href) {
                console.log("[Transitions] Link URL is the same as current URL. Preventing reload.");
                e.preventDefault();
                return;
            }

            // Previne a navegação padrão e carrega a página via AJAX
            e.preventDefault();
            console.log("[Transitions] Intercepting link. Loading page via AJAX:", link.href);
            loadPage(link.href);
        }, false);

        // Manipula os botões de voltar/avançar do navegador
        window.addEventListener('popstate', function(e) {
            console.log("[Transitions] Popstate event:", e.state);
            if (e.state && e.state.url) {
                loadPage(e.state.url, false);
            }
        });
    }

    /**
     * Decide se a navegação deve ocorrer de forma tradicional, sem AJAX.
     * @param {HTMLAnchorElement} link 
     * @returns {boolean} true se a navegação deve ser normal
     */
    function shouldOpenNormally(link) {
        if (
            link.getAttribute('target') === '_blank' ||
            link.getAttribute('rel') === 'external' ||
            link.hasAttribute('data-no-transition') ||
            link.href.startsWith('mailto:') ||
            link.href.startsWith('tel:') ||
            link.getAttribute('href') === '#' ||
            link.href.includes('#')
        ) {
            console.log("[Transitions] shouldOpenNormally: Special attribute detected.");
            return true;
        }
        if (link.closest('.language-selector') || link.closest('.dropdown-menu')) {
            console.log("[Transitions] shouldOpenNormally: Link is inside language selector or dropdown.");
            return true;
        }
        // Se for explicitamente para /profile ou /my-surveys, abre de forma tradicional
        const path = new URL(link.href).pathname;
        if (path.includes('/profile') || path.includes('/my-surveys') || path.includes('/account')) {
            console.log("[Transitions] shouldOpenNormally: Link points to profile, my-surveys or account. Letting browser handle it.");
            return true;
        }
        return false;
    }

    /**
     * Inicializa o seletor de idioma para preservar o contexto da página.
     */
    function initLanguageSwitcher() {
        console.log("[Transitions] Initializing language switcher...");
        const languageLinks = document.querySelectorAll('.dropdown-menu .dropdown-item');
        languageLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                console.log("[Transitions] Language switcher clicked:", this.href);
                loadPage(this.href);
            });
        });
    }

    /**
     * Carrega dinamicamente um script JavaScript
     * @param {string} src - URL do script a ser carregado
     * @returns {Promise} - Promise resolvida quando o script é carregado
     */
    function loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = () => resolve(script);
            script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
            document.body.appendChild(script);
            console.log(`[Transitions] Loading script: ${src}`);
        });
    }

    /**
     * Preserva o estado do calendário antes da transição
     * @returns {Object|null} Estado do calendário preservado ou null se não houver estado
     */
    function preserveCalendarState() {
        let calendarState = null;
        
        if (currentPageType === 'dashboard') {
            // Para dashboard, preservamos a visualização atual e o estado do destacamento
            if (window.GroupSesh && window.GroupSesh.Dashboard && window.GroupSesh.Dashboard.CalendarManager && 
                window.GroupSesh.Dashboard.CalendarManager._calendar) {
                
                const calendar = window.GroupSesh.Dashboard.CalendarManager._calendar;
                const highlightSwitch = document.getElementById('highlight-switch');
                
                calendarState = {
                    type: 'dashboard',
                    date: calendar.getDate(),
                    view: calendar.view.type,
                    highlightEnabled: highlightSwitch ? highlightSwitch.checked : false
                };
                
                console.log("[Transitions] Dashboard calendar state preserved:", calendarState);
            }
        } 
        else if (currentPageType === 'create-survey') {
            // Para create-survey, preservamos a visualização atual e as datas selecionadas
            if (window.calendar) {
                calendarState = {
                    type: 'create-survey',
                    date: window.calendar.getDate(),
                    view: window.calendar.view.type,
                    selectedDates: window.selectedDates ? Array.from(window.selectedDates) : []
                };
                
                console.log("[Transitions] Create-survey calendar state preserved:", calendarState);
            }
        }
        
        return calendarState;
    }

    /**
     * Restaura o estado do calendário após a transição
     * @param {Object} state - Estado do calendário a restaurar
     * @param {string} currentType - Tipo de página atual
     */
    function restoreCalendarState(state, currentType) {
        if (!state || state.type !== currentType) {
            console.log("[Transitions] No matching calendar state to restore");
            return false;
        }
        
        console.log("[Transitions] Restoring calendar state:", state);
        
        if (currentType === 'dashboard') {
            // Restaurar estado do dashboard
            if (window.GroupSesh && window.GroupSesh.Dashboard && window.GroupSesh.Dashboard.CalendarManager && 
                window.GroupSesh.Dashboard.CalendarManager._calendar) {
                
                const calendar = window.GroupSesh.Dashboard.CalendarManager._calendar;
                
                // Restaurar data e visualização
                calendar.gotoDate(state.date);
                calendar.changeView(state.view);
                
                // Restaurar estado de destaque
                const highlightSwitch = document.getElementById('highlight-switch');
                if (highlightSwitch) {
                    highlightSwitch.checked = state.highlightEnabled;
                    
                    if (state.highlightEnabled) {
                        // Ativar destaque em todos os dias marcados
                        document.querySelectorAll('.highlight-participants').forEach(el => {
                            el.classList.add('active');
                        });
                    }
                }
                
                return true;
            }
        } 
        else if (currentType === 'create-survey') {
            // Restaurar estado do create-survey
            if (window.calendar) {
                // Restaurar data e visualização
                window.calendar.gotoDate(state.date);
                window.calendar.changeView(state.view);
                
                // Restaurar datas selecionadas
                if (Array.isArray(state.selectedDates) && state.selectedDates.length > 0 && window.selectedDates) {
                    window.selectedDates = new Set(state.selectedDates);
                    
                    // Aplicar classes para destacar visualmente os dias selecionados
                    setTimeout(() => {
                        state.selectedDates.forEach(dateStr => {
                            const dayEl = document.querySelector(`.fc-day[data-date="${dateStr}"]`);
                            if (dayEl) {
                                dayEl.classList.add('fc-day-selected');
                            }
                        });
                        
                        // Atualizar contador
                        const daysCounter = document.getElementById('selected-days-counter');
                        if (daysCounter) {
                            daysCounter.textContent = window.selectedDates.size;
                        }
                    }, 100);
                }
                
                return true;
            }
        }
        
        return false;
    }

    /**
     * Limpa completamente todas as instâncias e eventos do dashboard
     */
    function cleanupDashboardComponents() {
        console.log("[Transitions] Cleaning up dashboard components...");
        
        // 1. Remover listeners de eventos específicos do dashboard
        document.removeEventListener('pageContentUpdated', window.initDashboard);
        
        // 2. Destruir instância do dashboard core se existir
        if (window.GroupSesh && window.GroupSesh.Dashboard && window.GroupSesh.Dashboard.Core) {
            if (typeof window.GroupSesh.Dashboard.Core.destroy === 'function') {
                window.GroupSesh.Dashboard.Core.destroy();
                console.log("[Transitions] Dashboard Core destroyed");
            }
        }
        
        // 3. Limpar dados de configuração do dashboard
        window.DASHBOARD_CONFIG = null;
        
        console.log("[Transitions] Dashboard components cleaned up");
    }

    /**
     * Limpa completamente todas as instâncias e eventos da página create-survey
     */
    function cleanupCreateSurveyComponents() {
        console.log("[Transitions] Cleaning up create-survey components...");
        
        // 1. Remover event listener específico do create-survey
        document.removeEventListener('pageContentUpdated', window.checkEnvironmentReady);
        
        // 2. Limpar variáveis globais específicas da página create-survey
        if (window.selectedDates instanceof Set) {
            window.selectedDates.clear();
        }
        
        // 3. Remover instância de calendário se existir
        if (window.calendar && typeof window.calendar.destroy === 'function') {
            window.calendar.destroy();
            window.calendar = null;
            console.log("[Transitions] Create-survey calendar destroyed");
        }
        
        // 4. Limpar configuração específica
        window.APP_CONFIG = null;
        
        console.log("[Transitions] Create-survey components cleaned up");
    }

    /**
     * Executa os scripts inline do novo conteúdo.
     * @param {HTMLElement} container - Container com o novo conteúdo.
     */
    function executeInlineScripts(container) {
        const scripts = container.querySelectorAll("script");
        scripts.forEach(script => {
            try {
                console.log("[Transitions] Executing inline script:", script.textContent.slice(0, 100));
                eval(script.textContent);
            } catch (err) {
                console.error("[Transitions] Error executing inline script:", err);
            }
        });
    }

    /**
     * Extrai scripts específicos da página do conteúdo HTML
     * @param {string} html - Conteúdo HTML completo
     * @param {string} pageType - Tipo da página (dashboard, create-survey)
     * @returns {Object} - Objeto com scripts e configurações extraídas
     */
    function extractPageSpecificScripts(html, pageType) {
        console.log(`[Transitions] Extracting ${pageType} specific scripts`);
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        const result = {
            scripts: [],
            config: null
        };
        
        // Se não for dashboard ou create-survey, não precisamos carregar scripts específicos
        if (pageType === 'other') {
            return result;
        }
        
        // Buscar scripts específicos em extra_js block
        const extraJsBlock = doc.querySelector('#extra_js, [id*="extra_js"]');
        if (extraJsBlock) {
            const scriptTags = extraJsBlock.querySelectorAll('script');
            scriptTags.forEach(script => {
                if (script.src) {
                    result.scripts.push(script.src);
                } else if (script.textContent.includes('APP_CONFIG') || 
                           script.textContent.includes('DASHBOARD_CONFIG')) {
                    result.config = script.textContent;
                }
            });
        }
        
        // Buscar scripts específicos em qualquer lugar da página baseado no padrão de nome
        if (pageType === 'dashboard') {
            const dashboardScript = doc.querySelector('script[src*="dashboard.js"]');
            if (dashboardScript && dashboardScript.src) {
                result.scripts.push(dashboardScript.src);
            }
            
            // Buscar configuração do dashboard
            const configScript = doc.querySelector('script:not([src])');
            if (configScript && configScript.textContent.includes('DASHBOARD_CONFIG')) {
                result.config = configScript.textContent;
            }
        } 
        else if (pageType === 'create-survey') {
            const createScript = doc.querySelector('script[src*="create.js"]');
            if (createScript && createScript.src) {
                result.scripts.push(createScript.src);
            }
            
            // Buscar configuração da create-survey
            const configScript = doc.querySelector('script:not([src])');
            if (configScript && configScript.textContent.includes('APP_CONFIG')) {
                result.config = configScript.textContent;
            }
        }
        
        console.log(`[Transitions] Extracted scripts:`, result.scripts);
        return result;
    }

    /**
     * Carrega scripts específicos da página e inicializa componentes
     * @param {string} pageType - Tipo da página ('dashboard', 'create-survey', 'other')
     * @param {string} html - HTML completo da página
     * @param {Object} [preservedState] - Estado do calendário preservado
     */
    async function loadPageSpecificScripts(pageType, html, preservedState) {
        console.log(`[Transitions] Loading ${pageType} specific scripts`);
        
        // Para páginas que não são dashboard ou create-survey, não carregamos scripts específicos
        if (pageType === 'other') {
            console.log("[Transitions] Page type is 'other', no specific scripts needed");
            return false;
        }
        
        // Extrair scripts e configurações
        const { scripts, config } = extractPageSpecificScripts(html, pageType);
        
        // Primeiro, aplicar configuração se existir
        if (config) {
            try {
                console.log(`[Transitions] Applying ${pageType} configuration`);
                eval(config);
            } catch (err) {
                console.error(`[Transitions] Error applying ${pageType} configuration:`, err);
            }
        }
        
        // Depois, carregar scripts específicos
        if (scripts.length > 0) {
            try {
                const loadPromises = scripts.map(src => loadScript(src));
                await Promise.all(loadPromises);
                console.log(`[Transitions] All ${pageType} scripts loaded successfully`);
                
                // Após carregar scripts, inicializar componentes específicos
                if (pageType === 'dashboard') {
                    if (typeof window.initDashboard === 'function') {
                        console.log('[Transitions] Initializing dashboard with loaded scripts');
                        window.initDashboard();
                        
                        // Tentar restaurar estado preservado após a inicialização
                        if (preservedState) {
                            setTimeout(() => {
                                console.log('[Transitions] Attempting to restore dashboard calendar state');
                                restoreCalendarState(preservedState, 'dashboard');
                            }, 300);
                        }
                    }
                }
                else if (pageType === 'create-survey') {
                    console.log('[Transitions] Checking for create-survey initialization');
                    if (typeof window.checkEnvironmentReady === 'function') {
                        console.log('[Transitions] Calling checkEnvironmentReady for create-survey');
                        window.checkEnvironmentReady();
                        
                        // Tentar restaurar estado preservado após a inicialização
                        if (preservedState) {
                            setTimeout(() => {
                                console.log('[Transitions] Attempting to restore create-survey calendar state');
                                restoreCalendarState(preservedState, 'create-survey');
                            }, 300);
                        }
                    }
                }
                
                return true;
            } catch (err) {
                console.error(`[Transitions] Error loading ${pageType} scripts:`, err);
                return false;
            }
        } else {
            console.log(`[Transitions] No specific scripts found for ${pageType}`);
            return false;
        }
    }

    /**
     * Carrega uma página via AJAX e realiza a transição suave para ela.
     * @param {string} url - URL da página a ser carregada.
     * @param {boolean} addToHistory - Se deve adicionar a página ao histórico (padrão: true)
     */
    function loadPage(url, addToHistory = true) {
        console.log("[Transitions] loadPage called with URL:", url, "Add to history:", addToHistory);
        showLoadingIndicator();
        
        // Detectar o tipo da página de destino
        const targetPageType = detectPageType(url);
        console.log("[Transitions] Target page type:", targetPageType);
        console.log("[Transitions] Current page type:", currentPageType);

        // Preservar estado do calendário antes da transição se estamos em uma página de calendário
        // e estamos indo para outra página de calendário do mesmo tipo
        let preservedState = null;
        if ((currentPageType === 'dashboard' && targetPageType === 'dashboard') ||
            (currentPageType === 'create-survey' && targetPageType === 'create-survey')) {
            
            preservedState = preserveCalendarState();
        }

        // Limpar completamente o estado da página atual antes de carregar a nova
        if (currentPageType === 'dashboard') {
            cleanupDashboardComponents();
        } else if (currentPageType === 'create-survey') {
            cleanupCreateSurveyComponents();
        }

        fetch(url, { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
            .then(response => {
                console.log("[Transitions] AJAX response received, status:", response.status);
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.text();
            })
            .then(html => {
                console.log("[Transitions] AJAX response text loaded.");
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const newContent = doc.querySelector('main');
                const title = doc.querySelector('title')?.textContent || document.title;
                console.log("[Transitions] New page title:", title);

                mainContainer.classList.add('page-transition-out');
                setTimeout(() => {
                    document.title = title;
                    if (newContent) {
                        mainContainer.innerHTML = newContent.innerHTML;
                        console.log("[Transitions] Main container content updated.");
                        // Executa os scripts inline dentro do conteúdo carregado
                        executeInlineScripts(mainContainer);
                    } else {
                        console.warn("[Transitions] No <main> element found in AJAX response.");
                        mainContainer.innerHTML = '';
                    }
                    currentUrl = url;
                    currentPageType = targetPageType; // Atualiza o tipo de página atual
                    updateLanguageActive(url);
                    if (addToHistory) {
                        history.pushState({ url: url }, title, url);
                        console.log("[Transitions] URL pushed to history:", url);
                    }

                    // Injetar novamente o CSS unificado para garantir consistência
                    injectUnifiedCalendarCSS();

                    // Carregar scripts específicos da página apenas para dashboard e create-survey
                    if (targetPageType !== 'other') {
                        loadPageSpecificScripts(targetPageType, html, preservedState)
                            .then(() => {
                                console.log(`[Transitions] Page specific scripts for ${targetPageType} loaded`);
                                
                                // Se for página do dashboard, carregar dados específicos
                                if (targetPageType === 'dashboard') {
                                    const parts = url.split('/');
                                    const token = parts[parts.length - 1];
                                    
                                    if (token && token.length > 0) {
                                        console.log("[Transitions] Dashboard token:", token);
                                        
                                        // Garantir que haja uma instância válida para buscar os dados
                                        if (window.GroupSesh && 
                                            window.GroupSesh.Dashboard && 
                                            window.GroupSesh.Dashboard.Core &&
                                            typeof window.GroupSesh.Dashboard.Core.init === 'function') {
                                            
                                            console.log("[Transitions] Initializing dashboard with token");
                                            // Inicializar o dashboard com o token correto
                                            window.GroupSesh.Dashboard.Core.init({
                                                survey: { token: token },
                                                paths: {
                                                    survey_info: `/api/survey-info/${token}`,
                                                    survey_data: `/api/survey-data/${token}`
                                                }
                                            });
                                        }
                                    }
                                }
                            })
                            .catch(err => {
                                console.error(`[Transitions] Error with ${targetPageType} scripts:`, err);
                            });
                    }

                    initNewContentScripts();
                    hideLoadingIndicator();

                    mainContainer.classList.remove('page-transition-out');
                    mainContainer.classList.add('page-transition-in');
                    setTimeout(() => {
                        mainContainer.classList.remove('page-transition-in');
                        console.log("[Transitions] Transition in complete.");
                    }, 500);
                    window.scrollTo(0, 0);
                }, 300);
            })
            .catch(error => {
                console.error("[Transitions] Error during AJAX load:", error);
                // Fallback para navegação tradicional
                window.location.href = url;
            });
    }

    /**
     * Atualiza o estado ativo do dropdown de idiomas com base na URL.
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
     * Exibe o indicador de carregamento.
     */
    function showLoadingIndicator() {
        console.log("[Transitions] Showing loading indicator.");
        let loadingIndicator = document.getElementById('page-loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.style.display = 'flex';
            return;
        }
        loadingIndicator = document.createElement('div');
        loadingIndicator.id = 'page-loading-indicator';
        loadingIndicator.innerHTML = `
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        `;
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
        document.body.appendChild(loadingIndicator);
        // Forçar reflow
        loadingIndicator.offsetHeight;
        loadingIndicator.style.opacity = '1';
    }

    /**
     * Esconde o indicador de carregamento.
     */
    function hideLoadingIndicator() {
        console.log("[Transitions] Hiding loading indicator.");
        const loadingIndicator = document.getElementById('page-loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.style.opacity = '0';
            setTimeout(() => {
                loadingIndicator.style.display = 'none';
            }, 200);
        }
    }

    /**
     * Inicializa scripts no novo conteúdo carregado via AJAX.
     */
    function initNewContentScripts() {
        console.log("[Transitions] Initializing new content scripts.");
        if (typeof bootstrap !== 'undefined') {
            const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
            tooltips.forEach(tooltip => new bootstrap.Tooltip(tooltip));
            const popovers = document.querySelectorAll('[data-bs-toggle="popover"]');
            popovers.forEach(popover => new bootstrap.Popover(popover));
        }
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            form.querySelectorAll('input, textarea, select').forEach(field => {
                field.addEventListener('input', function() {
                    this.classList.remove('is-invalid');
                });
            });
        });
        
        // Emitir evento personalizado para indicar que o conteúdo da página foi atualizado
        // Apenas para páginas específicas do tipo dashboard ou create-survey
        if (currentPageType !== 'other') {
            console.log(`[Transitions] Dispatching pageContentUpdated event for ${currentPageType}`);
            document.dispatchEvent(new CustomEvent('pageContentUpdated', {
                detail: { pageType: currentPageType }
            }));
        }
    }

    // Expor a função loadPage globalmente, se necessário
    window.loadPage = loadPage;
});
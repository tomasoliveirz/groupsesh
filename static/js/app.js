/**
 * app.js - Inicialização global da aplicação
 */
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar tema
    initTheme();
    
    // Configurar transições de página
    initPageTransitions();
    
    // Configurar utilitários globais
    initGlobalUtils();
    
    /**
     * Inicializa tema claro/escuro
     */
    function initTheme() {
        const themeToggle = document.getElementById('theme-toggle');
        const body = document.getElementById('page-body');
        
        if (!themeToggle || !body) return;
        
        // Carregar tema salvo
        const savedTheme = localStorage.getItem('gs-theme');
        if (savedTheme) {
            body.className = savedTheme;
        } else {
            // Verificar preferência do sistema
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            body.className = prefersDark ? 'theme-dark' : 'theme-light';
        }
        
        // Configurar evento para alternar tema
        themeToggle.addEventListener('click', function() {
            if (body.classList.contains('theme-light')) {
                body.classList.remove('theme-light');
                body.classList.add('theme-dark');
                localStorage.setItem('gs-theme', 'theme-dark');
            } else {
                body.classList.remove('theme-dark');
                body.classList.add('theme-light');
                localStorage.setItem('gs-theme', 'theme-light');
            }
        });
        
        // Responder a mudanças de preferência do sistema
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
            if (!localStorage.getItem('gs-theme')) {
                body.className = e.matches ? 'theme-dark' : 'theme-light';
            }
        });
    }
    
    /**
     * Configura transições suaves entre páginas
     */
    function initPageTransitions() {
        const mainContainer = document.querySelector('main');
        if (!mainContainer) return;
        
        // Função global para copiar texto
        window.copyToClipboard = function(elementId) {
            UI.copyToClipboard(elementId);
        };
    }
    
    /**
     * Inicializa utilitários globais
     */
    function initGlobalUtils() {
        // Remover classes .is-invalid ao digitar
        document.querySelectorAll('input, textarea, select').forEach(field => {
            field.addEventListener('input', function() {
                this.classList.remove('is-invalid');
                
                // Esconder mensagens de erro associadas
                const feedback = this.nextElementSibling;
                if (feedback && feedback.classList.contains('invalid-feedback')) {
                    feedback.style.display = 'none';
                }
            });
        });
        
        // Scroll suave para links internos
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                const targetId = this.getAttribute('href');
                
                if (targetId === '#') return;
                
                const targetElement = document.querySelector(targetId);
                
                if (targetElement) {
                    e.preventDefault();
                    
                    window.scrollTo({
                        top: targetElement.offsetTop - 80,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }
});
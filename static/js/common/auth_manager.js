/**
 * auth_manager.js - Gerencia a autenticação no frontend
 */
const AuthManager = {
    /**
     * Verifica se o usuário está autenticado
     * @returns {boolean} true se autenticado, false caso contrário
     */
    isAuthenticated() {
        return this.getUserData() !== null;
    },
    
    /**
     * Obtém os dados do usuário atual do localStorage
     * @returns {Object|null} Dados do usuário ou null se não estiver autenticado
     */
    getUserData() {
        const userData = localStorage.getItem('gs_user_data');
        try {
            return userData ? JSON.parse(userData) : null;
        } catch (e) {
            console.error('Erro ao analisar dados do usuário:', e);
            return null;
        }
    },
    
    /**
     * Armazena os dados do usuário no localStorage
     * @param {Object} userData - Dados do usuário para armazenar
     */
    setUserData(userData) {
        if (userData) {
            localStorage.setItem('gs_user_data', JSON.stringify(userData));
            // Disparar evento de login
            document.dispatchEvent(new CustomEvent('auth:login', { detail: userData }));
        }
    },
    
    /**
     * Limpa os dados do usuário do localStorage
     */
    clearUserData() {
        localStorage.removeItem('gs_user_data');
        // Disparar evento de logout
        document.dispatchEvent(new CustomEvent('auth:logout'));
    },
    
    /**
     * Registra evento de login no Google Analytics
     */
    trackLogin(method) {
        if (typeof gtag !== 'undefined') {
            gtag('event', 'login', {
                'method': method
            });
        }
    },
    
    /**
     * Inicializa o modal de login/registro na página
     */
    initAuthModal() {
        const authModalEl = document.getElementById('auth-modal');
        if (!authModalEl) return;
        
        // Evento para alternar entre login e registro
        const loginTab = document.getElementById('login-tab');
        const registerTab = document.getElementById('register-tab');
        
        if (loginTab && registerTab) {
            loginTab.addEventListener('click', function(e) {
                e.preventDefault();
                document.getElementById('login-form-container').classList.remove('d-none');
                document.getElementById('register-form-container').classList.add('d-none');
                loginTab.classList.add('active');
                registerTab.classList.remove('active');
            });
            
            registerTab.addEventListener('click', function(e) {
                e.preventDefault();
                document.getElementById('login-form-container').classList.add('d-none');
                document.getElementById('register-form-container').classList.remove('d-none');
                loginTab.classList.remove('active');
                registerTab.classList.add('active');
            });
        }
        
        // Inicializar formulários de login/registro
        this.initLoginForm();
        this.initRegisterForm();
        this.initGoogleLogin();
        this.initPasswordToggles();
    },
    
    /**
     * Inicializa o formulário de login
     */
    initLoginForm() {
        const loginForm = document.getElementById('login-modal-form');
        if (!loginForm) return;
        
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitButton = loginForm.querySelector('button[type="submit"]');
            const email = loginForm.querySelector('#login-email').value;
            const password = loginForm.querySelector('#login-password').value;
            const remember = loginForm.querySelector('#login-remember').checked;
            const errorContainer = loginForm.querySelector('.login-error-message');
            
            // Validação básica
            if (!email || !password) {
                if (errorContainer) {
                    errorContainer.textContent = 'Por favor, preencha todos os campos.';
                    errorContainer.classList.remove('d-none');
                }
                return;
            }
            
            // Desabilitar botão e mostrar loading
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Entrando...';
            }
            
            // Ocultar mensagem de erro anterior
            if (errorContainer) {
                errorContainer.classList.add('d-none');
            }
            
            try {
                const response = await fetch('/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                    },
                    body: JSON.stringify({ email, password, remember })
                });
                
                if (response.ok) {
                    const data = await response.json();
                    
                    // Armazenar dados do usuário
                    AuthManager.setUserData(data.user);
                    
                    // Registrar evento
                    AuthManager.trackLogin('email');
                    
                    // Fechar modal e redirecionar/recarregar
                    const authModal = bootstrap.Modal.getInstance(document.getElementById('auth-modal'));
                    if (authModal) {
                        authModal.hide();
                    }
                    
                    // Recarregar página para refletir estado de autenticação
                    window.location.reload();
                } else {
                    const errorData = await response.json();
                    
                    if (errorContainer) {
                        errorContainer.textContent = errorData.error || 'Falha no login. Verifique suas credenciais.';
                        errorContainer.classList.remove('d-none');
                    }
                }
            } catch (error) {
                console.error('Erro no login:', error);
                
                if (errorContainer) {
                    errorContainer.textContent = 'Erro ao comunicar com o servidor. Tente novamente.';
                    errorContainer.classList.remove('d-none');
                }
            } finally {
                // Restaurar botão
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.innerHTML = 'Entrar';
                }
            }
        });
    },
    
    /**
     * Inicializa o formulário de registro
     */
    initRegisterForm() {
        const registerForm = document.getElementById('register-modal-form');
        if (!registerForm) return;
        
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitButton = registerForm.querySelector('button[type="submit"]');
            const name = registerForm.querySelector('#register-name').value;
            const email = registerForm.querySelector('#register-email').value;
            const password = registerForm.querySelector('#register-password').value;
            const confirmPassword = registerForm.querySelector('#register-confirm-password').value;
            const terms = registerForm.querySelector('#register-terms').checked;
            const errorContainer = registerForm.querySelector('.register-error-message');
            
            // Limpar mensagens anteriores
            if (errorContainer) {
                errorContainer.textContent = '';
                errorContainer.classList.add('d-none');
            }
            
            // Validação básica mais robusta
            if (!name || !email || !password || !confirmPassword) {
                if (errorContainer) {
                    errorContainer.textContent = 'Por favor, preencha todos os campos.';
                    errorContainer.classList.remove('d-none');
                }
                return;
            }
            
            // Validação de email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                if (errorContainer) {
                    errorContainer.textContent = 'Digite um endereço de email válido.';
                    errorContainer.classList.remove('d-none');
                }
                return;
            }
            
            if (password !== confirmPassword) {
                if (errorContainer) {
                    errorContainer.textContent = 'As senhas não coincidem.';
                    errorContainer.classList.remove('d-none');
                }
                return;
            }
            
            // Validação de senha (mínimo 8 caracteres)
            if (password.length < 8) {
                if (errorContainer) {
                    errorContainer.textContent = 'A senha deve ter pelo menos 8 caracteres.';
                    errorContainer.classList.remove('d-none');
                }
                return;
            }
            
            if (!terms) {
                if (errorContainer) {
                    errorContainer.textContent = 'Você deve concordar com os termos de serviço.';
                    errorContainer.classList.remove('d-none');
                }
                return;
            }
            
            // Desabilitar botão e mostrar loading
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Registrando...';
            }
            
            // Obter o CSRF token e verificar se existe
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            console.log('CSRF Token:', csrfToken); // Debug
            
            // Preparar dados para registro
            const registrationData = { 
                name, 
                email, 
                password, 
                confirm_password: confirmPassword 
            };
            console.log('Dados de registro:', registrationData); // Debug
            
            try {
                const response = await fetch('/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrfToken,
                        'Accept': 'application/json' // Especificar que esperamos JSON na resposta
                    },
                    body: JSON.stringify(registrationData)
                });
                
                // Verificar primeiro o tipo de conteúdo da resposta
                const contentType = response.headers.get('content-type');
                
                if (contentType && contentType.includes('application/json')) {
                    // Resposta é JSON
                    const data = await response.json();
                    
                    if (response.ok) {
                        // Mostrar mensagem de sucesso e mudar para a aba de login
                        const loginTab = document.getElementById('login-tab');
                        if (loginTab) {
                            loginTab.click();
                        }
                        
                        const successMessage = document.querySelector('.register-success-message');
                        if (successMessage) {
                            successMessage.textContent = data.message || 'Registro realizado com sucesso! Verifique seu email.';
                            successMessage.classList.remove('d-none');
                        }
                        
                        // Limpar formulário
                        registerForm.reset();
                    } else {
                        // Mostrar erro do servidor (em JSON)
                        if (errorContainer) {
                            errorContainer.textContent = data.error || 'Falha no registro. Tente novamente.';
                            errorContainer.classList.remove('d-none');
                        }
                    }
                } else {
                    // Resposta não é JSON - provavelmente um erro de servidor
                    const text = await response.text();
                    console.error('Resposta não-JSON do servidor:', text);
                    
                    if (errorContainer) {
                        errorContainer.textContent = 'Erro no servidor. Por favor, tente novamente mais tarde.';
                        errorContainer.classList.remove('d-none');
                    }
                }
            } catch (error) {
                console.error('Erro no registro:', error);
                
                if (errorContainer) {
                    errorContainer.textContent = 'Erro ao comunicar com o servidor. Tente novamente.';
                    errorContainer.classList.remove('d-none');
                }
            } finally {
                // Restaurar botão
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.innerHTML = 'Registrar';
                }
            }
        });
    }
    ,
    
    /**
     * Inicializa o botão de login com Google
     */
    initGoogleLogin() {
        const googleButtons = document.querySelectorAll('.google-login-btn');
        
        googleButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                window.location.href = '/auth/google-login';
            });
        });
    },
    
    /**
     * Inicializa os botões para alternar visibilidade das senhas
     */
    initPasswordToggles() {
        const toggleButtons = document.querySelectorAll('.toggle-password');
        
        toggleButtons.forEach(button => {
            button.addEventListener('click', function() {
                const input = this.previousElementSibling;
                const icon = this.querySelector('i');
                
                if (input.type === 'password') {
                    input.type = 'text';
                    icon.classList.replace('bi-eye', 'bi-eye-slash');
                } else {
                    input.type = 'password';
                    icon.classList.replace('bi-eye-slash', 'bi-eye');
                }
            });
        });
    },
    
    /**
     * Atualiza elementos da interface baseado no estado de autenticação
     */
    updateUI() {
        const isAuthenticated = this.isAuthenticated();
        const userData = this.getUserData();
        
        // Elementos de estado de autenticação
        const authButtons = document.querySelectorAll('.auth-buttons');
        const userDropdown = document.querySelectorAll('.user-dropdown');
        const userMenuItems = document.querySelectorAll('.user-menu-item');
        const userNameElements = document.querySelectorAll('.user-name');
        const userProfilePic = document.querySelectorAll('.user-profile-pic');
        
        // Atualizar botões de autenticação
        authButtons.forEach(el => {
            el.style.display = isAuthenticated ? 'none' : 'block';
        });
        
        // Atualizar dropdown de usuário
        userDropdown.forEach(el => {
            el.style.display = isAuthenticated ? 'block' : 'none';
        });
        
        // Atualizar itens de menu específicos
        userMenuItems.forEach(el => {
            const requiredRole = el.getAttribute('data-role');
            if (requiredRole && userData) {
                el.style.display = userData.roles && userData.roles.includes(requiredRole) ? 'block' : 'none';
            }
        });
        
        // Atualizar nome do usuário
        if (isAuthenticated && userData) {
            userNameElements.forEach(el => {
                el.textContent = userData.name;
            });
            
            // Atualizar imagem de perfil
            userProfilePic.forEach(el => {
                if (userData.profile_picture) {
                    el.src = userData.profile_picture;
                }
            });
        }
    }
};

// Inicializar no carregamento da página
document.addEventListener('DOMContentLoaded', function() {
    AuthManager.updateUI();
    AuthManager.initAuthModal();
    
    // Inicializar botão para abrir o modal de autenticação
    const authModalButtons = document.querySelectorAll('.open-auth-modal');
    authModalButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            const authModal = new bootstrap.Modal(document.getElementById('auth-modal'));
            authModal.show();
            
            // Se o botão tiver um atributo data-auth-tab, mudar para essa aba
            const authTab = this.getAttribute('data-auth-tab');
            if (authTab) {
                const tabEl = document.getElementById(authTab + '-tab');
                if (tabEl) {
                    tabEl.click();
                }
            }
        });
    });
    
    // Inicializar formulário de pesquisa de token
    const searchTokenForm = document.getElementById('search-token-form');
    if (searchTokenForm) {
        searchTokenForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const tokenInput = document.getElementById('token-input');
            const token = tokenInput.value.trim();
            
            if (!token) {
                return;
            }
            
            window.location.href = '/' + (document.documentElement.lang || 'pt-BR').substring(0, 2) + '/survey/' + token;
        });
    }
});
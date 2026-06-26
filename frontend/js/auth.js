// Player Authentication & Account Session Module for PES 6 Arena
document.addEventListener('DOMContentLoaded', () => {
    checkPlayerAuthStatus();
});

/**
 * Check if the player is already logged in or needs activation
 */
async function checkPlayerAuthStatus() {
    // Check for Supabase access_token in URL hash (from email verification link)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    
    if (accessToken) {
        try {
            const data = await verifyActivation(accessToken);
            localStorage.setItem('playerToken', accessToken);
            localStorage.setItem('playerUser', data.username);
            showToast(data.message || "¡Cuenta activada y sesión iniciada!");
            // Clean up the URL hash without reloading
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
        } catch (error) {
            showToast(error.message || "El token de activación es inválido o ha expirado.");
        }
    }

    const playerToken = localStorage.getItem('playerToken');
    const playerUser = localStorage.getItem('playerUser');

    if (playerToken && playerUser) {
        setPlayerLoggedInUI(playerUser);
    } else {
        setPlayerLoggedOutUI();
    }
}

// Modal management utilities
function openRegisterModal() { openAuthModal('register'); }
function closeRegisterModal() { closeAuthModal(); }

function showAuthModalAlert(message, type = 'error') {
    const alertEl = document.getElementById('auth-modal-alert');
    const iconEl = document.getElementById('auth-modal-alert-icon');
    const msgEl = document.getElementById('auth-modal-alert-msg');
    
    if (!alertEl || !msgEl) return;

    let friendlyMessage = message || "Ocurrió un error inesperado. Inténtalo de nuevo.";
    const lowerMsg = friendlyMessage.toLowerCase();
    
    if (lowerMsg.includes('rate limit exceeded')) {
        friendlyMessage = "Has superado el límite de intentos permitidos. Por favor, espera unos minutos antes de intentar de nuevo.";
    } else if (lowerMsg.includes('already taken') || lowerMsg.includes('username is already taken')) {
        friendlyMessage = "Este nombre de usuario ya está en uso. Por favor, elige otro.";
    } else if (lowerMsg.includes('email address') && lowerMsg.includes('invalid')) {
        friendlyMessage = "El correo electrónico no es válido. Asegúrate de que esté bien escrito.";
    } else if (lowerMsg.includes('should be at least 6 characters')) {
        friendlyMessage = "La contraseña debe tener al menos 6 caracteres.";
    } else if (lowerMsg.includes('failed to fetch') || lowerMsg.includes('connection timeout')) {
        friendlyMessage = "No se pudo conectar con el servidor de la Arena. Por favor, verifica tu conexión de internet.";
    } else if (lowerMsg.includes('credenciales inválidas') || lowerMsg.includes('invalid credentials')) {
        friendlyMessage = "Correo o contraseña incorrectos. Verifica tus credenciales.";
    }

    msgEl.innerText = friendlyMessage;
    alertEl.className = "mb-4 p-3.5 rounded-xl border text-xs font-mono font-bold transition-all duration-300";
    
    if (type === 'error') {
        alertEl.classList.add('bg-red-950/50', 'border-red-900/50', 'text-red-400');
        if (iconEl) iconEl.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>';
    } else if (type === 'warning') {
        alertEl.classList.add('bg-yellow-950/50', 'border-yellow-900/50', 'text-yellow-400');
        if (iconEl) iconEl.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i>';
    } else {
        alertEl.classList.add('bg-green-950/50', 'border-green-900/50', 'text-green-400');
        if (iconEl) iconEl.innerHTML = '<i class="fa-solid fa-circle-check"></i>';
    }

    alertEl.classList.remove('hidden');
}

function hideAuthModalAlert() {
    const alertEl = document.getElementById('auth-modal-alert');
    if (alertEl) alertEl.classList.add('hidden');
}

function openAuthModal(tab = 'login') {
    const modal = document.getElementById('auth-modal');
    if (!modal) return;
    
    modal.classList.remove('hidden');
    hideAuthModalAlert();
    
    const tabsEl = document.getElementById('auth-modal-tabs');
    const successEl = document.getElementById('auth-form-success');
    if (tabsEl) tabsEl.classList.remove('hidden');
    if (successEl) successEl.classList.add('hidden');
    
    switchAuthTab(tab);
}

function closeAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) modal.classList.add('hidden');
    hideAuthModalAlert();
}

function switchAuthTab(tab) {
    const loginTab = document.getElementById('auth-tab-login');
    const registerTab = document.getElementById('auth-tab-register');
    const loginForm = document.getElementById('auth-form-login');
    const registerForm = document.getElementById('auth-form-register');
    const successEl = document.getElementById('auth-form-success');

    if (successEl) successEl.classList.add('hidden');
    hideAuthModalAlert();

    if (tab === 'login') {
        if (loginTab) {
            loginTab.classList.replace('text-slate-500', 'text-pes-gold');
            loginTab.classList.replace('border-transparent', 'border-pes-gold');
        }
        if (registerTab) {
            registerTab.classList.replace('text-pes-gold', 'text-slate-500');
            registerTab.classList.replace('border-pes-gold', 'border-transparent');
        }
        if (loginForm) loginForm.classList.remove('hidden');
        if (registerForm) registerForm.classList.add('hidden');
    } else {
        if (registerTab) {
            registerTab.classList.replace('text-slate-500', 'text-pes-gold');
            registerTab.classList.replace('border-transparent', 'border-pes-gold');
        }
        if (loginTab) {
            loginTab.classList.replace('text-pes-gold', 'text-slate-500');
            loginTab.classList.replace('border-pes-gold', 'border-transparent');
        }
        if (registerForm) registerForm.classList.remove('hidden');
        if (loginForm) loginForm.classList.add('hidden');
    }
}

/**
 * Handle new player registration form submission
 */
async function submitRegister(event) {
    event.preventDefault();
    hideAuthModalAlert();

    const emailEl = document.getElementById('register-email');
    const userEl = document.getElementById('register-username');
    const passEl = document.getElementById('register-password');
    const confirmPassEl = document.getElementById('register-confirm-password');
    const submitBtn = document.getElementById('register-submit-btn');

    if (!emailEl || !userEl || !passEl || !confirmPassEl) return;

    const email = emailEl.value.trim();
    const username = userEl.value.trim();
    const password = passEl.value.trim();
    const confirmPassword = confirmPassEl.value.trim();

    if (password !== confirmPassword) {
        showAuthModalAlert("Las contraseñas no coinciden.");
        return;
    }

    let originalBtnHtml = "";
    if (submitBtn) {
        originalBtnHtml = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner animate-spin mr-2"></i><span>Creando cuenta...</span>';
    }

    try {
        const response = await registerPlayer(email, username, password);
        
        emailEl.value = '';
        userEl.value = '';
        passEl.value = '';
        confirmPassEl.value = '';

        const tabsEl = document.getElementById('auth-modal-tabs');
        const registerForm = document.getElementById('auth-form-register');
        if (tabsEl) tabsEl.classList.add('hidden');
        if (registerForm) registerForm.classList.add('hidden');

        const successEl = document.getElementById('auth-form-success');
        const successEmailEl = document.getElementById('success-state-email');
        if (successEmailEl) successEmailEl.innerText = email;
        if (successEl) successEl.classList.remove('hidden');

        showToast("¡Registro exitoso! Revisa tu bandeja de entrada.");
    } catch (error) {
        showAuthModalAlert(error.message || "Error en el registro.");
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnHtml;
        }
    }
}

/**
 * Update the UI to show logged-in player controls
 */
function setPlayerLoggedInUI(username) {
    const btnLogin = document.getElementById('desktop-nav-player-login');
    const btnRegister = document.getElementById('desktop-nav-register');
    const btnProfile = document.getElementById('desktop-nav-profile');
    const btnLogout = document.getElementById('desktop-nav-player-logout');
    
    const mobLogin = document.getElementById('mobile-header-login-btn');
    const mobProfile = document.getElementById('mobile-header-profile-btn');

    if (btnLogin) btnLogin.classList.add('hidden');
    if (btnRegister) btnRegister.classList.add('hidden');
    if (btnProfile) btnProfile.classList.remove('hidden');
    if (btnLogout) btnLogout.classList.remove('hidden');
    
    if (mobLogin) mobLogin.classList.add('hidden');
    if (mobProfile) mobProfile.classList.remove('hidden');

    // Desktop sidebar profile synchronization
    const desktopProfileContainer = document.getElementById('desktop-sidebar-profile-container');
    const desktopLoginContainer = document.getElementById('desktop-sidebar-login-container');
    const desktopProfileUsername = document.getElementById('desktop-sidebar-profile-username');
    const desktopProfileStats = document.getElementById('desktop-sidebar-profile-stats');

    if (desktopLoginContainer) {
        desktopLoginContainer.classList.add('hidden');
    }
    if (desktopProfileContainer) {
        desktopProfileContainer.classList.remove('hidden');
    }
    if (desktopProfileUsername) {
        desktopProfileUsername.textContent = username;
    }
    if (desktopProfileStats) {
        desktopProfileStats.textContent = 'Cargando MMR...';
        if (typeof fetchPlayerProfile === 'function') {
            fetchPlayerProfile(username).then(profile => {
                if (profile) {
                    const points = profile.points || 0;
                    let rank = 'PRINCIPIANTE';
                    if (points >= 1900) rank = 'LEYENDA';
                    else if (points >= 1600) rank = 'MAESTRO';
                    else if (points >= 1300) rank = 'PROFESIONAL';
                    else if (points >= 1000) rank = 'PROSPECTO';
                    desktopProfileStats.textContent = `${points.toLocaleString()} MMR • ${rank}`;
                } else {
                    desktopProfileStats.textContent = '1,000 MMR • PROSPECTO';
                }
            }).catch(err => {
                console.error("Error loading profile for desktop sidebar:", err);
                desktopProfileStats.textContent = '1,000 MMR • PROSPECTO';
            });
        } else {
            desktopProfileStats.textContent = '1,000 MMR • PROSPECTO';
        }
    }
}

/**
 * Update the UI for guest players
 */
function setPlayerLoggedOutUI() {
    const btnLogin = document.getElementById('desktop-nav-player-login');
    const btnRegister = document.getElementById('desktop-nav-register');
    const btnProfile = document.getElementById('desktop-nav-profile');
    const btnLogout = document.getElementById('desktop-nav-player-logout');
    
    const mobLogin = document.getElementById('mobile-header-login-btn');
    const mobProfile = document.getElementById('mobile-header-profile-btn');

    if (btnLogin) btnLogin.classList.remove('hidden');
    if (btnRegister) btnRegister.classList.remove('hidden');
    if (btnProfile) btnProfile.classList.add('hidden');
    if (btnLogout) btnLogout.classList.add('hidden');
    
    if (mobLogin) mobLogin.classList.remove('hidden');
    if (mobProfile) mobProfile.classList.add('hidden');

    // Desktop sidebar profile synchronization
    const desktopProfileContainer = document.getElementById('desktop-sidebar-profile-container');
    const desktopLoginContainer = document.getElementById('desktop-sidebar-login-container');
    if (desktopProfileContainer) {
        desktopProfileContainer.classList.add('hidden');
    }
    if (desktopLoginContainer) {
        desktopLoginContainer.classList.remove('hidden');
    }
}

function openPlayerLoginModal() { openAuthModal('login'); }
function closePlayerLoginModal() { closeAuthModal(); }

async function submitPlayerLogin(event) {
    event.preventDefault();
    hideAuthModalAlert();

    const emailEl = document.getElementById('player-login-email');
    const passEl = document.getElementById('player-login-password');
    const submitBtn = document.getElementById('player-login-submit-btn');
    if (!emailEl || !passEl) return;

    const email = emailEl.value.trim();
    const password = passEl.value.trim();

    let originalBtnHtml = "";
    if (submitBtn) {
        originalBtnHtml = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner animate-spin mr-2"></i><span>Iniciando sesión...</span>';
    }

    try {
        const response = await loginPlayer(email, password);
        
        localStorage.setItem('playerToken', response.token);
        localStorage.setItem('playerUser', response.username);
        
        showToast(`Bienvenido a la Arena, ${response.username}`);
        setPlayerLoggedInUI(response.username);
        closePlayerLoginModal();
        
        emailEl.value = '';
        passEl.value = '';
    } catch (error) {
        showAuthModalAlert(error.message || "Error al iniciar sesión.");
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnHtml;
        }
    }
}

function logoutPlayer() {
    localStorage.removeItem('playerToken');
    localStorage.removeItem('playerUser');
    showToast("Has cerrado tu sesión.");
    setPlayerLoggedOutUI();
}

function openMyProfile() {
    const username = localStorage.getItem('playerUser');
    if (username) {
        if (typeof loadProfileTab === 'function') {
            loadProfileTab(username);
        } else {
            console.error("loadProfileTab is not defined yet.");
        }
    }
}

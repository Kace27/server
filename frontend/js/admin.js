// Administrator session and actions module
document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();
});

/**
 * Check if the administrator is already logged in
 */
async function checkAuthStatus() {
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

    const adminToken = localStorage.getItem('adminToken');
    const adminUser = localStorage.getItem('adminUser');
    const playerToken = localStorage.getItem('playerToken');
    const playerUser = localStorage.getItem('playerUser');
    
    if (adminToken && adminUser) {
        setLoggedInUI(adminUser);
    } else {
        setLoggedOutUI();
    }

    if (playerToken && playerUser) {
        setPlayerLoggedInUI(playerUser);
    } else {
        setPlayerLoggedOutUI();
    }
}

/**
 * Update the UI to show logged-in administrator controls
 */
function setLoggedInUI(username) {
    // Show Admin navigation buttons
    const deskAdminBtn = document.getElementById('desktop-nav-admin');
    const mobAdminBtn = document.getElementById('mobile-nav-admin');
    if (deskAdminBtn) deskAdminBtn.classList.remove('hidden');
    if (mobAdminBtn) mobAdminBtn.classList.remove('hidden');

    // Change Login button to Logout
    const deskLoginBtn = document.getElementById('desktop-nav-login');
    if (deskLoginBtn) {
        deskLoginBtn.innerHTML = '<i class="fa-solid fa-right-from-bracket w-5 text-lg"></i><span>Cerrar Sesión</span>';
        deskLoginBtn.onclick = logoutAdmin;
    }
}

/**
 * Update the UI to standard public state
 */
function setLoggedOutUI() {
    // Hide Admin navigation buttons
    const deskAdminBtn = document.getElementById('desktop-nav-admin');
    const mobAdminBtn = document.getElementById('mobile-nav-admin');
    if (deskAdminBtn) deskAdminBtn.classList.add('hidden');
    if (mobAdminBtn) mobAdminBtn.classList.add('hidden');

    // Restore Login button
    const deskLoginBtn = document.getElementById('desktop-nav-login');
    if (deskLoginBtn) {
        deskLoginBtn.innerHTML = '<i class="fa-solid fa-lock w-5 text-lg text-pes-gold"></i><span>Admin Login</span>';
        deskLoginBtn.onclick = openLoginModal;
    }
}

/**
 * Open Login Modal window
 */
function openLoginModal() {
    const modal = document.getElementById('admin-login-modal');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

/**
 * Close Login Modal window
 */
function closeLoginModal() {
    const modal = document.getElementById('admin-login-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

/**
 * Handle admin login form submission
 */
async function submitLogin(event) {
    event.preventDefault();
    const userEl = document.getElementById('login-username');
    const passEl = document.getElementById('login-password');
    if (!userEl || !passEl) return;

    const username = userEl.value.trim();
    const password = passEl.value.trim();

    try {
        const response = await loginAdmin(username, password);
        showToast(`Bienvenido de nuevo, ${response.username}`);
        setLoggedInUI(response.username);
        closeLoginModal();
        // Reset form
        userEl.value = '';
        passEl.value = '';
    } catch (error) {
        showToast(error.message || "Credenciales incorrectas.");
    }
}

/**
 * Log out administrator session
 */
function logoutAdmin() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    showToast("Sesión de administrador cerrada.");
    setLoggedOutUI();
    // Redirect to dashboard if currently on admin tab
    const adminTab = document.getElementById('tab-admin');
    if (adminTab && !adminTab.classList.contains('hidden')) {
        switchTab('dashboard');
    }
}

/**
 * Trigger manual ELO rankings recalculation (requires auth)
 */
async function triggerRefreshRankings() {
    const btn = document.getElementById('btn-admin-refresh-ranking');
    if (btn) {
        btn.disabled = true;
        btn.innerText = 'PROCESANDO...';
    }
    
    try {
        const response = await refreshRankingCache();
        showToast(response.message || "Ranking recalculado correctamente.");
        // Reload rankings list on the UI
        loadRankingsData();
    } catch (error) {
        showToast(error.message || "Error al recargar ranking.");
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-arrows-rotate mr-2 text-pes-gold"></i>Recalcular Ranking (DB)';
        }
    }
}

/**
 * Ban or unban a player (requires auth)
 */
async function togglePlayerBan(playerId, currentStatus) {
    const newStatus = currentStatus === 'banned' ? 'active' : 'banned';
    try {
        const response = await updatePlayerStatus(playerId, newStatus);
        showToast(response.message || `Estado de jugador modificado a: ${newStatus}`);
        loadRankingsData(); // refresh list
    } catch (error) {
        showToast(error.message || "Error al modificar estado.");
    }
}

// Funciones para Modal Unificado
function openRegisterModal() { openAuthModal('register'); }
function closeRegisterModal() { closeAuthModal(); }

function showAuthModalAlert(message, type = 'error') {
    const alertEl = document.getElementById('auth-modal-alert');
    const iconEl = document.getElementById('auth-modal-alert-icon');
    const msgEl = document.getElementById('auth-modal-alert-msg');
    
    if (!alertEl || !msgEl) return;

    // Traducir mensajes comunes de Supabase/API para mejor UX
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
        friendlyMessage = "No se pudo conectar con el servidor de la Arena. Por favor, verifica tu conexión de internet o que el servidor esté activo.";
    } else if (lowerMsg.includes('credenciales inválidas') || lowerMsg.includes('invalid credentials')) {
        friendlyMessage = "Correo o contraseña incorrectos. Verifica tus credenciales.";
    }

    msgEl.innerText = friendlyMessage;

    // Reset classes
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
    
    // Restaurar vista por defecto (ocultar pantalla de éxito)
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
        
        // Limpiar formulario
        emailEl.value = '';
        userEl.value = '';
        passEl.value = '';
        confirmPassEl.value = '';

        // Ocultar pestañas y formularios
        const tabsEl = document.getElementById('auth-modal-tabs');
        const registerForm = document.getElementById('auth-form-register');
        if (tabsEl) tabsEl.classList.add('hidden');
        if (registerForm) registerForm.classList.add('hidden');

        // Mostrar pantalla de éxito
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
    const btnProfile = document.getElementById('desktop-nav-my-profile');
    const btnLogout = document.getElementById('desktop-nav-player-logout');
    
    const mobLogin = document.getElementById('mobile-header-login-btn');
    const mobProfile = document.getElementById('mobile-header-profile-btn');

    if (btnLogin) btnLogin.classList.add('hidden');
    if (btnRegister) btnRegister.classList.add('hidden');
    if (btnProfile) btnProfile.classList.remove('hidden');
    if (btnLogout) btnLogout.classList.remove('hidden');
    
    if (mobLogin) mobLogin.classList.add('hidden');
    if (mobProfile) mobProfile.classList.remove('hidden');
}

/**
 * Update the UI for guest players
 */
function setPlayerLoggedOutUI() {
    const btnLogin = document.getElementById('desktop-nav-player-login');
    const btnRegister = document.getElementById('desktop-nav-register');
    const btnProfile = document.getElementById('desktop-nav-my-profile');
    const btnLogout = document.getElementById('desktop-nav-player-logout');
    
    const mobLogin = document.getElementById('mobile-header-login-btn');
    const mobProfile = document.getElementById('mobile-header-profile-btn');

    if (btnLogin) btnLogin.classList.remove('hidden');
    if (btnRegister) btnRegister.classList.remove('hidden');
    if (btnProfile) btnProfile.classList.add('hidden');
    if (btnLogout) btnLogout.classList.add('hidden');
    
    if (mobLogin) mobLogin.classList.remove('hidden');
    if (mobProfile) mobProfile.classList.add('hidden');
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
        
        // Reset form
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
        openPlayerModal(username);
    }
}

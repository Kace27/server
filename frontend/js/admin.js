// Administrator session and actions module
document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();
});

/**
 * Check if the administrator is already logged in
 */
function checkAuthStatus() {
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

/**
 * Open Register Modal window
 */
function openRegisterModal() {
    const modal = document.getElementById('player-register-modal');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

/**
 * Close Register Modal window
 */
function closeRegisterModal() {
    const modal = document.getElementById('player-register-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

/**
 * Handle new player registration form submission
 */
async function submitRegister(event) {
    event.preventDefault();
    const emailEl = document.getElementById('register-email');
    const userEl = document.getElementById('register-username');
    const passEl = document.getElementById('register-password');
    const confirmPassEl = document.getElementById('register-confirm-password');

    if (!emailEl || !userEl || !passEl || !confirmPassEl) return;

    const email = emailEl.value.trim();
    const username = userEl.value.trim();
    const password = passEl.value.trim();
    const confirmPassword = confirmPassEl.value.trim();

    if (password !== confirmPassword) {
        showToast("Las contraseñas no coinciden.");
        return;
    }

    try {
        const response = await registerPlayer(email, username, password);
        showToast(response.message || "¡Registro completado! Ya puedes entrar al juego.");
        closeRegisterModal();
        // Reset form
        emailEl.value = '';
        userEl.value = '';
        passEl.value = '';
        confirmPassEl.value = '';
    } catch (error) {
        showToast(error.message || "Error en el registro.");
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

    if (btnLogin) btnLogin.classList.add('hidden');
    if (btnRegister) btnRegister.classList.add('hidden');
    if (btnProfile) btnProfile.classList.remove('hidden');
    if (btnLogout) btnLogout.classList.remove('hidden');
}

/**
 * Update the UI for guest players
 */
function setPlayerLoggedOutUI() {
    const btnLogin = document.getElementById('desktop-nav-player-login');
    const btnRegister = document.getElementById('desktop-nav-register');
    const btnProfile = document.getElementById('desktop-nav-my-profile');
    const btnLogout = document.getElementById('desktop-nav-player-logout');

    if (btnLogin) btnLogin.classList.remove('hidden');
    if (btnRegister) btnRegister.classList.remove('hidden');
    if (btnProfile) btnProfile.classList.add('hidden');
    if (btnLogout) btnLogout.classList.add('hidden');
}

function openPlayerLoginModal() {
    const modal = document.getElementById('player-login-modal');
    if (modal) modal.classList.remove('hidden');
}

function closePlayerLoginModal() {
    const modal = document.getElementById('player-login-modal');
    if (modal) modal.classList.add('hidden');
}

async function submitPlayerLogin(event) {
    event.preventDefault();
    const emailEl = document.getElementById('player-login-email');
    const passEl = document.getElementById('player-login-password');
    if (!emailEl || !passEl) return;

    const email = emailEl.value.trim();
    const password = passEl.value.trim();

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
        showToast(error.message || "Error al iniciar sesión.");
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

// API Client for PES 6 Arena
const API_BASE_URL = window.location.search.includes('local=true')
    ? 'http://localhost:3000'
    : 'https://pes6-web-backend.onrender.com';

/**
 * Fetch the public ranking list.
 */
async function fetchRankings() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/ranking`);
        if (!response.ok) {
            throw new Error(`Failed to fetch rankings: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error("API Error in fetchRankings:", error);
        throw error;
    }
}

/**
 * Log in an administrator.
 * @param {string} username 
 * @param {string} password 
 */
async function loginAdmin(username, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Login failed');
        }
        
        // Save to localStorage
        localStorage.setItem('adminToken', data.token);
        localStorage.setItem('adminUser', data.username);
        return data;
    } catch (error) {
        console.error("API Error in loginAdmin:", error);
        throw error;
    }
}

/**
 * Trigger manual ranking refresh.
 */
async function refreshRankingCache() {
    const token = localStorage.getItem('adminToken');
    if (!token) {
        throw new Error('Not authenticated');
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/cron/refresh-ranking`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Failed to refresh ranking cache');
        }
        return data;
    } catch (error) {
        console.error("API Error in refreshRankingCache:", error);
        throw error;
    }
}

/**
 * Toggle a player's ban status.
 * @param {number} playerId 
 * @param {string} status 'active' | 'banned'
 */
async function updatePlayerStatus(playerId, status) {
    const token = localStorage.getItem('adminToken');
    if (!token) {
        throw new Error('Not authenticated');
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/players/${playerId}/status`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status })
        });
        
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Failed to update player status');
        }
        return data;
    } catch (error) {
        console.error("API Error in updatePlayerStatus:", error);
        throw error;
    }
}

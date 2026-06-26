// Rankings data loading and rendering module
let cachedPlayers = [];

/**
 * Fetch and load rankings data from the Render API
 */
async function loadRankingsData() {
    try {
        // Show loading states or placeholder
        const rowsContainer = document.getElementById('full-ranking-table-rows');
        const mobileContainer = document.getElementById('ranking-mobile-cards');
        if (rowsContainer) rowsContainer.innerHTML = '<tr><td colspan="6" class="py-6 text-center text-xs text-slate-500 font-bold font-mono animate-pulse">CARGANDO CLASIFICACIÓN...</td></tr>';
        if (mobileContainer) mobileContainer.innerHTML = '<div class="p-6 text-center text-xs text-slate-500 font-bold font-mono animate-pulse">CARGANDO CLASIFICACIÓN...</div>';

        const data = await fetchRankings();
        
        // Map raw database players to template structure
        cachedPlayers = data.map((player, idx) => {
            const played = player.matches_played || 0;
            const won = player.matches_won || 0;
            const lost = played - won; // simple win/loss representation
            const winrate = played > 0 ? `${Math.round((won / played) * 100)}%` : '0%';
            
            return {
                pos: idx + 1,
                playerId: player.player_id,
                name: player.username,
                mmr: player.points || 0,
                winrate: winrate,
                stats: `${played} / ${won} / ${lost}`,
                favored: 'Inter (Clásico)', // static or placeholder for demo view
                platform: 'PC', // default representation
                country: 'AR',
                avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
                history: ['V', 'V', 'V']
            };
        });

        renderLeaderboard(cachedPlayers);
    } catch (error) {
        console.error("Error loading rankings:", error);
        showToast("Error al cargar los rankings de la base de datos.");
    }
}

/**
 * Render leaderboard tables and grids
 */
function renderLeaderboard(list) {
    // 1. Dashboard Mini Top 3
    const miniRankingContainer = document.getElementById('mini-ranking-container');
    if (miniRankingContainer) {
        let miniHtml = '';
        list.slice(0, 3).forEach(player => {
            let positionIcon = `<span class="text-xs font-mono font-bold text-slate-500">#${player.pos}</span>`;
            if (player.pos === 1) positionIcon = `<span class="w-5 h-5 rounded-full bg-pes-gold/15 text-pes-gold flex items-center justify-center text-[10px] font-black border border-pes-gold/30 shadow-pes-gold/10"><i class="fa-solid fa-crown"></i></span>`;
            if (player.pos === 2) positionIcon = `<span class="w-5 h-5 rounded-full bg-slate-300/10 text-slate-300 flex items-center justify-center text-[10px] font-black border border-slate-300/20"><i class="fa-solid fa-medal"></i></span>`;
            if (player.pos === 3) positionIcon = `<span class="w-5 h-5 rounded-full bg-amber-700/10 text-amber-600 flex items-center justify-center text-[10px] font-black border border-amber-700/20"><i class="fa-solid fa-medal"></i></span>`;

            miniHtml += `
                <div onclick="loadProfileTab('${player.name}')" class="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-900 border border-transparent hover:border-slate-850 cursor-pointer transition-all">
                    <div class="flex items-center gap-2.5 min-w-0">
                        ${positionIcon}
                        <div class="w-7 h-7 rounded-full overflow-hidden border border-slate-700 flex-shrink-0">
                            <img src="${player.avatar}" alt="${player.name}" class="object-cover w-full h-full">
                        </div>
                        <div class="min-w-0">
                            <h5 class="text-xs font-black text-slate-200 truncate italic uppercase">${player.name}</h5>
                            <p class="text-[9px] text-pes-ps2light font-mono font-bold">${player.platform}</p>
                        </div>
                    </div>
                    <div class="text-right flex-shrink-0">
                        <span class="block text-xs font-mono font-black text-pes-gold">${player.mmr} pts</span>
                    </div>
                </div>
            `;
        });
        miniRankingContainer.innerHTML = miniHtml || '<p class="text-xs text-slate-500 font-mono py-2 text-center">Sin clasificados</p>';
    }

    // 2. Mobile Cards (Mobile View)
    const mobileContainer = document.getElementById('ranking-mobile-cards');
    if (mobileContainer) {
        let mobileHtml = '';
        list.forEach(player => {
            let posBadge = `<span class="text-slate-500 font-bold">#${player.pos}</span>`;
            if (player.pos === 1) posBadge = `<span class="text-pes-gold"><i class="fa-solid fa-crown"></i></span>`;
            if (player.pos === 2) posBadge = `<span class="text-slate-300"><i class="fa-solid fa-medal"></i></span>`;
            if (player.pos === 3) posBadge = `<span class="text-amber-600"><i class="fa-solid fa-medal"></i></span>`;

            mobileHtml += `
                <div onclick="loadProfileTab('${player.name}')" class="p-4 flex items-center justify-between hover:bg-slate-900 active:bg-slate-850 cursor-pointer transition-colors">
                    <div class="flex items-center gap-3 min-w-0">
                        <div class="font-mono font-black text-sm w-5 text-center flex-shrink-0">${posBadge}</div>
                        <div class="w-9 h-9 rounded-full overflow-hidden border border-slate-800 flex-shrink-0">
                            <img src="${player.avatar}" alt="${player.name}" class="object-cover w-full h-full">
                        </div>
                        <div class="min-w-0">
                            <h5 class="text-xs font-black text-slate-200 truncate italic uppercase">${player.name}</h5>
                            <span class="text-[9px] text-slate-400 font-mono">${player.platform} • <span class="text-pes-ps2light font-bold">${player.favored}</span></span>
                        </div>
                    </div>
                    <div class="text-right flex-shrink-0">
                        <span class="block text-xs font-mono font-black text-pes-gold">${player.mmr} MMR</span>
                        <span class="text-[9px] text-green-500 font-mono font-bold">${player.winrate} W/R</span>
                    </div>
                </div>
            `;
        });
        mobileContainer.innerHTML = mobileHtml || `<div class="p-6 text-center text-xs text-slate-500 font-bold font-mono">Sin resultados</div>`;
    }

    // 3. Desktop Table (Desktop View)
    const mainTableRows = document.getElementById('full-ranking-table-rows');
    if (mainTableRows) {
        let rowsHtml = '';
        list.forEach(player => {
            let displayPos = player.pos;
            let displayStyle = 'text-slate-400';

            if (player.pos === 1) {
                displayPos = `<i class="fa-solid fa-crown text-pes-gold text-sm"></i>`;
                displayStyle = "font-black text-pes-gold";
            } else if (player.pos === 2) {
                displayStyle = "font-bold text-slate-300";
            } else if (player.pos === 3) {
                displayStyle = "font-bold text-amber-600";
            }

            rowsHtml += `
                <tr class="hover:bg-slate-900/60 transition-colors">
                    <td class="py-3.5 px-4 text-center font-mono ${displayStyle}">${displayPos}</td>
                    <td class="py-3.5 px-4">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-full overflow-hidden border border-slate-800">
                                <img src="${player.avatar}" alt="${player.name}" class="object-cover w-full h-full">
                            </div>
                            <div>
                                <h5 class="text-xs font-black text-slate-200 italic uppercase">${player.name}</h5>
                                <span class="text-[10px] text-pes-ps2light font-mono font-bold uppercase">${player.platform}</span>
                            </div>
                        </div>
                    </td>
                    <td class="py-3.5 px-4 font-mono font-black text-pes-gold text-xs">${player.mmr}</td>
                    <td class="py-3.5 px-4 font-mono text-center text-green-500 text-xs font-black">${player.winrate}</td>
                    <td class="py-3.5 px-4 font-mono text-center text-slate-400 text-xs font-bold">${player.stats}</td>
                    <td class="py-3.5 px-4 text-center">
                        <button onclick="loadProfileTab('${player.name}')" class="text-[9px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 transition-all font-black uppercase tracking-wider">
                            Ver Ficha
                        </button>
                    </td>
                </tr>
            `;
        });
        mainTableRows.innerHTML = rowsHtml || '<tr><td colspan="6" class="py-6 text-center text-xs text-slate-500 font-bold font-mono">Sin clasificados</td></tr>';
    }
}

/**
 * Filter rankings by search term and platform
 */
function searchPlayerRank() {
    const searchVal = document.getElementById('input-ranking-search').value.toLowerCase();
    const selectedPlatform = document.getElementById('select-ranking-platform').value;

    const filtered = cachedPlayers.filter(player => {
        const searchMatch = player.name.toLowerCase().includes(searchVal);
        const platformMatch = selectedPlatform === 'ALL' || player.platform === selectedPlatform;
        return searchMatch && platformMatch;
    });

    renderLeaderboard(filtered);
}

/**
 * Display player profile modal
 */
/**
 * Load player profile into the dedicated profile tab
 */
async function loadProfileTab(username) {
    const container = document.getElementById('tab-profile-content');
    if (!container) return;
    
    // Make sure we navigate to the profile tab
    if (typeof switchTab === 'function') switchTab('profile');
    
    // Keep reference to currently viewed profile for comparison
    container.dataset.username = username;

    // Show loading skeleton
    container.innerHTML = `
        <div class="flex flex-col items-center justify-center py-10 space-y-4 h-full">
            <i class="fa-solid fa-spinner animate-spin text-pes-gold text-3xl"></i>
            <span class="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest animate-pulse">CARGANDO FICHA...</span>
        </div>
    `;
    
    // Reset compare section
    const compareInput = document.getElementById('compare-username-input');
    const compareContent = document.getElementById('compare-profile-content');
    if (compareInput) compareInput.value = '';
    if (compareContent) {
        compareContent.classList.add('hidden');
        compareContent.innerHTML = '';
    }

    // Reset styles
    const mainContainer = document.getElementById('tab-profile-main-container');
    const bgElement = document.getElementById('tab-profile-bg-element');
    const glowElement = document.getElementById('tab-profile-glow-element');
    
    if (mainContainer) {
        mainContainer.className = "bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden transition-all duration-500";
    }
    if (bgElement) {
        bgElement.className = "absolute inset-0 bg-cover bg-center opacity-10 pointer-events-none transition-all duration-500";
        bgElement.style.backgroundImage = 'none';
    }
    if (glowElement) {
        glowElement.className = "absolute -right-12 -top-12 w-64 h-64 rounded-full filter blur-[100px] opacity-10 pointer-events-none transition-all duration-500 bg-slate-500";
    }

    try {
        const profile = await fetchPlayerProfile(username);
        const historyData = await fetchPlayerMatchHistory(username);
        const matches = historyData.matches || [];

        // Calculate Win Rate and stats
        const played = matches.length;
        let won = 0;
        let lost = 0;
        let draws = 0;

        matches.forEach(m => {
            if (m.result === 'win') won++;
            else if (m.result === 'loss') lost++;
            else draws++;
        });

        const winrate = played > 0 ? `${Math.round((won / played) * 100)}%` : '0%';

        // Build match history icons
        let historyHtml = '';
        matches.slice(0, 5).forEach(m => {
            let hLetter = 'E';
            let hColor = 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20';
            if (m.result === 'win') {
                hLetter = 'V';
                hColor = 'bg-green-500/10 text-green-500 border border-green-500/20';
            } else if (m.result === 'loss') {
                hLetter = 'D';
                hColor = 'bg-pes-konamired/10 text-pes-konamired border border-pes-konamired/20';
            }
            historyHtml += `<span title="${hLetter === 'V' ? 'Victoria' : hLetter === 'D' ? 'Derrota' : 'Empate'} vs ${m.opponent_name}" class="w-6 h-6 rounded flex items-center justify-center font-mono text-[10px] font-black ${hColor}">${hLetter}</span>`;
        });

        if (historyHtml === '') {
            historyHtml = `<span class="text-[10px] font-mono text-slate-500 uppercase italic">Sin partidos</span>`;
        }

        // Determine favorite team
        let favoredTeam = "Ninguno";
        if (matches.length > 0) {
            const teamCounts = {};
            matches.forEach(m => {
                const teamId = m.home ? m.team_id_home : m.team_id_away;
                teamCounts[teamId] = (teamCounts[teamId] || 0) + 1;
            });
            let maxCount = 0;
            let favId = null;
            for (const id in teamCounts) {
                if (teamCounts[id] > maxCount) {
                    maxCount = teamCounts[id];
                    favId = id;
                }
            }
            if (favId !== null) {
                // getTeamName comes from app.js scope
                favoredTeam = typeof getTeamName === 'function' ? getTeamName(parseInt(favId)) : `Equipo ${favId}`;
            }
        }

        container.innerHTML = `
            <div class="flex items-center gap-4 border-b border-white/10 pb-6 relative z-10">
                <div class="w-16 h-16 rounded-full overflow-hidden border-2 border-white/30 shadow-lg flex-shrink-0">
                    <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80" alt="${profile.name}" class="object-cover w-full h-full">
                </div>
                <div>
                    <h4 class="text-xl font-black text-white uppercase italic leading-tight drop-shadow-md">${profile.name}</h4>
                    <p class="text-xs text-white/70 font-mono uppercase tracking-wider font-bold">LOBBY PLAYER • ONLINE</p>
                </div>
            </div>

            <div class="grid grid-cols-3 gap-4 text-center my-6 relative z-10">
                <div class="bg-black/40 backdrop-blur-sm p-4 rounded-xl border border-white/10 shadow-lg">
                    <span class="block text-[10px] font-mono text-white/50 uppercase tracking-widest font-bold mb-1">Puntos ELO</span>
                    <span class="text-lg font-mono font-black text-white">${profile.points}</span>
                </div>
                <div class="bg-black/40 backdrop-blur-sm p-4 rounded-xl border border-white/10 shadow-lg">
                    <span class="block text-[10px] font-mono text-white/50 uppercase tracking-widest font-bold mb-1">Victoria R.</span>
                    <span class="text-lg font-mono font-black text-white">${winrate}</span>
                </div>
                <div class="bg-black/40 backdrop-blur-sm p-4 rounded-xl border border-white/10 shadow-lg">
                    <span class="block text-[10px] font-mono text-white/50 uppercase tracking-widest font-bold mb-1">Partidos</span>
                    <span class="text-base font-mono font-bold text-white mt-1 block truncate">${played} Jg.</span>
                </div>
            </div>

            <div class="space-y-3 relative z-10">
                <h5 class="text-xs font-display font-black uppercase tracking-widest text-white/60 italic drop-shadow-sm">Detalles de Rendimiento</h5>
                <div class="bg-black/30 backdrop-blur-sm p-4 rounded-xl border border-white/10 text-sm space-y-3 shadow-inner">
                    <div class="flex justify-between font-bold items-center">
                        <span class="text-white/70 text-xs">Equipo Favorito:</span>
                        <span class="text-white bg-white/10 px-2 py-1 rounded border border-white/20 drop-shadow-sm">${favoredTeam}</span>
                    </div>
                    <div class="flex justify-between font-bold items-center">
                        <span class="text-white/70 text-xs">Historial (V/E/D):</span>
                        <span class="text-white font-mono tracking-widest drop-shadow-sm">${won} / ${draws} / ${lost}</span>
                    </div>
                    <div class="flex justify-between items-center pt-3 border-t border-white/10">
                        <span class="text-white/70 font-bold text-xs">Últimos partidos:</span>
                        <div class="flex gap-1.5">${historyHtml}</div>
                    </div>
                </div>
            </div>
        `;

        // Calculate GP (Economy)
        const gp = (won * 500) + (draws * 150) + (played * 50) + (profile.points || 0);
        const coinsEl = document.getElementById('tab-profile-coins');
        if (coinsEl) coinsEl.textContent = `${gp.toLocaleString()} GP`;

        // Evaluate Medals / Achievements
        let medalsHtml = '';
        const achievements = [];
        
        // 1. Veteran Medal
        if (played >= 100) {
            achievements.push({ icon: 'fa-shield-halved', color: 'text-slate-300', title: 'Veterano', desc: '+100 Partidos' });
        } else if (played >= 10) {
            achievements.push({ icon: 'fa-shield-halved', color: 'text-amber-600', title: 'Amateur', desc: '+10 Partidos' });
        }
        
        // 2. Winner Medal
        const winPct = played > 0 ? (won / played) * 100 : 0;
        if (winPct >= 60 && played >= 20) {
            achievements.push({ icon: 'fa-trophy', color: 'text-pes-gold', title: 'Goleador', desc: 'VR > 60%' });
        }
        
        // 3. Rank Medal
        let rankTheme = 'PROSPECTO';
        let bgUrl = '';
        if (profile.points >= 1900) {
            rankTheme = 'LEYENDA';
            achievements.push({ icon: 'fa-crown', color: 'text-yellow-400', title: 'Leyenda', desc: 'Élite PES' });
            bgUrl = 'url("https://images.unsplash.com/photo-1518605368461-1e1e38ce8058?w=800&auto=format&fit=crop&q=80")'; // Stadium
            if (mainContainer) mainContainer.className = "bg-gradient-to-br from-yellow-900/40 to-black border border-yellow-500/50 rounded-2xl p-6 shadow-[0_0_30px_rgba(234,179,8,0.2)] relative overflow-hidden transition-all duration-500";
            if (glowElement) glowElement.className = "absolute -right-12 -top-12 w-64 h-64 rounded-full filter blur-[100px] opacity-40 pointer-events-none transition-all duration-500 bg-yellow-500";
        } else if (profile.points >= 1600) {
            rankTheme = 'MAESTRO';
            achievements.push({ icon: 'fa-star', color: 'text-slate-300', title: 'Maestro', desc: 'Rango Plata' });
            bgUrl = 'url("https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&auto=format&fit=crop&q=80")'; // Daytime Stadium
            if (mainContainer) mainContainer.className = "bg-gradient-to-br from-slate-700/40 to-black border border-slate-400/50 rounded-2xl p-6 shadow-[0_0_20px_rgba(148,163,184,0.2)] relative overflow-hidden transition-all duration-500";
            if (glowElement) glowElement.className = "absolute -right-12 -top-12 w-64 h-64 rounded-full filter blur-[100px] opacity-30 pointer-events-none transition-all duration-500 bg-slate-300";
        } else if (profile.points >= 1300) {
            rankTheme = 'PROFESIONAL';
            bgUrl = 'url("https://images.unsplash.com/photo-1551280857-2b9bbe5204eb?w=800&auto=format&fit=crop&q=80")'; // Grass texture
            if (mainContainer) mainContainer.className = "bg-gradient-to-br from-amber-900/40 to-black border border-amber-700/50 rounded-2xl p-6 shadow-[0_0_15px_rgba(180,83,9,0.2)] relative overflow-hidden transition-all duration-500";
            if (glowElement) glowElement.className = "absolute -right-12 -top-12 w-64 h-64 rounded-full filter blur-[100px] opacity-20 pointer-events-none transition-all duration-500 bg-amber-700";
        }
        
        if (bgElement && bgUrl) {
            bgElement.style.backgroundImage = bgUrl;
            bgElement.style.opacity = '0.25';
            bgElement.style.mixBlendMode = 'overlay';
        }

        // Render Medals
        const medalsContainer = document.getElementById('tab-profile-medals');
        if (medalsContainer) {
            achievements.forEach(ach => {
                medalsHtml += `
                    <div class="flex flex-col items-center justify-center h-24 bg-black/40 rounded-xl border border-slate-700/50 shadow-inner group relative">
                        <i class="fa-solid ${ach.icon} text-2xl ${ach.color} drop-shadow-md group-hover:scale-110 transition-transform"></i>
                        <span class="text-[9px] font-display font-black text-white uppercase text-center mt-2">${ach.title}</span>
                        <span class="text-[8px] font-mono text-slate-400 uppercase text-center">${ach.desc}</span>
                    </div>
                `;
            });
            
            // Fill empty slots up to 4
            for (let i = achievements.length; i < 4; i++) {
                medalsHtml += `
                    <div class="flex flex-col items-center justify-center h-24 bg-black/20 rounded-xl border border-dashed border-slate-800">
                        <i class="fa-solid fa-lock text-slate-700 mb-2"></i>
                        <span class="text-[9px] font-mono text-slate-600 uppercase text-center leading-tight">No Obtenido</span>
                    </div>
                `;
            }
            medalsContainer.innerHTML = medalsHtml;
        }
    } catch (error) {
        console.error("Error loading profile tab details:", error);
        container.innerHTML = `
            <div class="text-center py-10 h-full flex flex-col justify-center items-center">
                <i class="fa-solid fa-triangle-exclamation text-pes-konamired text-3xl mb-4"></i>
                <p class="text-xs text-pes-konamired font-bold uppercase tracking-wider">ERROR AL CARGAR PERFIL DE JUGADOR</p>
                <p class="text-[10px] text-slate-500 mt-2 font-mono">Verifica la conexión o inténtalo más tarde.</p>
            </div>
        `;
    }
}

/**
 * Fetch and display another player's profile side-by-side for comparison
 */
async function compareProfile() {
    const input = document.getElementById('compare-username-input');
    const container = document.getElementById('compare-profile-content');
    const baseContainer = document.getElementById('tab-profile-content');
    
    if (!input || !container || !baseContainer) return;
    
    const targetUsername = input.value.trim();
    if (!targetUsername) return;
    
    const baseUsername = baseContainer.dataset.username;
    if (baseUsername.toLowerCase() === targetUsername.toLowerCase()) {
        showToast("No puedes compararte contigo mismo.");
        return;
    }

    container.classList.remove('hidden');
    container.innerHTML = `
        <div class="flex flex-col items-center justify-center py-8 space-y-4">
            <i class="fa-solid fa-spinner animate-spin text-pes-gold text-2xl"></i>
            <span class="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest animate-pulse">BUSCANDO RIVAL...</span>
        </div>
    `;

    try {
        const baseProfile = await fetchPlayerProfile(baseUsername);
        const targetProfile = await fetchPlayerProfile(targetUsername);
        
        const baseHistory = await fetchPlayerMatchHistory(baseUsername);
        const targetHistory = await fetchPlayerMatchHistory(targetUsername);
        
        const basePlayed = baseHistory.matches ? baseHistory.matches.length : 0;
        const targetPlayed = targetHistory.matches ? targetHistory.matches.length : 0;
        
        const getWinrate = (matches) => {
            if (!matches || matches.length === 0) return 0;
            const won = matches.filter(m => m.result === 'win').length;
            return Math.round((won / matches.length) * 100);
        };
        
        const baseWr = getWinrate(baseHistory.matches);
        const targetWr = getWinrate(targetHistory.matches);
        
        const basePoints = baseProfile.points || 0;
        const targetPoints = targetProfile.points || 0;

        container.innerHTML = `
            <div class="flex flex-col space-y-4 mt-4">
                <div class="flex justify-between items-center text-xs font-display font-black uppercase italic mb-2 border-b border-slate-800 pb-2">
                    <span class="text-slate-300 w-1/3 truncate text-right pr-2">${baseProfile.name}</span>
                    <span class="text-pes-gold text-[10px] tracking-widest w-1/3 text-center">VS</span>
                    <span class="text-slate-300 w-1/3 truncate pl-2">${targetProfile.name}</span>
                </div>
                
                <div class="space-y-3">
                    <!-- ELO Row -->
                    <div class="flex justify-between items-center bg-black/40 rounded px-3 py-2 text-sm font-mono">
                        <span class="w-1/3 text-right ${basePoints >= targetPoints ? 'text-green-400 font-black' : 'text-slate-500'}">${basePoints}</span>
                        <span class="w-1/3 text-center text-[9px] text-slate-500 font-bold uppercase tracking-widest">Puntos ELO</span>
                        <span class="w-1/3 text-left ${targetPoints >= basePoints ? 'text-green-400 font-black' : 'text-slate-500'}">${targetPoints}</span>
                    </div>
                    
                    <!-- WR Row -->
                    <div class="flex justify-between items-center bg-black/40 rounded px-3 py-2 text-sm font-mono">
                        <span class="w-1/3 text-right ${baseWr >= targetWr ? 'text-green-400 font-black' : 'text-slate-500'}">${baseWr}%</span>
                        <span class="w-1/3 text-center text-[9px] text-slate-500 font-bold uppercase tracking-widest">Victorias</span>
                        <span class="w-1/3 text-left ${targetWr >= baseWr ? 'text-green-400 font-black' : 'text-slate-500'}">${targetWr}%</span>
                    </div>
                    
                    <!-- Matches Row -->
                    <div class="flex justify-between items-center bg-black/40 rounded px-3 py-2 text-sm font-mono">
                        <span class="w-1/3 text-right ${basePlayed >= targetPlayed ? 'text-green-400 font-black' : 'text-slate-500'}">${basePlayed}</span>
                        <span class="w-1/3 text-center text-[9px] text-slate-500 font-bold uppercase tracking-widest">Partidos J.</span>
                        <span class="w-1/3 text-left ${targetPlayed >= basePlayed ? 'text-green-400 font-black' : 'text-slate-500'}">${targetPlayed}</span>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error("Error comparing profiles:", error);
        container.innerHTML = `
            <div class="text-center py-4 text-xs font-bold text-pes-konamired">
                No se encontró al jugador o hubo un error en la red.
            </div>
        `;
    }
}

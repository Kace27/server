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
                <div onclick="openPlayerModal('${player.name}')" class="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-900 border border-transparent hover:border-slate-850 cursor-pointer transition-all">
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
                <div onclick="openPlayerModal('${player.name}')" class="p-4 flex items-center justify-between hover:bg-slate-900 active:bg-slate-850 cursor-pointer transition-colors">
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
                        <button onclick="openPlayerModal('${player.name}')" class="text-[9px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 transition-all font-black uppercase tracking-wider">
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
async function openPlayerModal(username) {
    const modal = document.getElementById('player-profile-modal');
    const container = document.getElementById('player-profile-modal-content');
    if (!modal || !container) return;

    // Show loading skeleton inside modal first
    container.innerHTML = `
        <div class="flex flex-col items-center justify-center py-10 space-y-4">
            <i class="fa-solid fa-spinner animate-spin text-pes-gold text-3xl"></i>
            <span class="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest animate-pulse">CARGANDO FICHA...</span>
        </div>
    `;
    modal.classList.remove('hidden');

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
            <div class="flex items-center gap-4 border-b border-slate-800 pb-4">
                <div class="w-14 h-14 rounded-full overflow-hidden border-2 border-pes-gold shadow-pes-gold/20 flex-shrink-0">
                    <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80" alt="${profile.name}" class="object-cover w-full h-full">
                </div>
                <div>
                    <h4 class="text-base font-black text-slate-100 uppercase italic leading-tight">${profile.name}</h4>
                    <p class="text-[10px] text-pes-ps2light font-mono uppercase tracking-wider font-bold">LOBBY PLAYER • ONLINE</p>
                </div>
            </div>

            <div class="grid grid-cols-3 gap-3 text-center my-4">
                <div class="bg-black/40 p-2.5 rounded-xl border border-slate-850">
                    <span class="block text-[9px] font-mono text-slate-500 uppercase tracking-wider font-bold">Puntos ELO</span>
                    <span class="text-sm font-mono font-black text-pes-gold">${profile.points}</span>
                </div>
                <div class="bg-black/40 p-2.5 rounded-xl border border-slate-850">
                    <span class="block text-[9px] font-mono text-slate-500 uppercase tracking-wider font-bold">Victoria R.</span>
                    <span class="text-sm font-mono font-black text-green-500">${winrate}</span>
                </div>
                <div class="bg-black/40 p-2.5 rounded-xl border border-slate-850">
                    <span class="block text-[9px] font-mono text-slate-500 uppercase tracking-wider font-bold">Partidos</span>
                    <span class="text-xs font-mono font-bold text-slate-200 mt-1 block truncate">${played} Jg.</span>
                </div>
            </div>

            <div class="space-y-2">
                <h5 class="text-[10px] font-display font-black uppercase tracking-widest text-slate-400 italic">Detalles de Rendimiento</h5>
                <div class="bg-slate-950 p-3 rounded-xl border border-slate-850 text-[11px] space-y-2">
                    <div class="flex justify-between font-bold">
                        <span class="text-slate-500">Equipo Favorito:</span>
                        <span class="text-pes-ps2light">${favoredTeam}</span>
                    </div>
                    <div class="flex justify-between font-bold">
                        <span class="text-slate-500">Historial (V/E/D):</span>
                        <span class="text-slate-300 font-mono">${won} / ${draws} / ${lost}</span>
                    </div>
                    <div class="flex justify-between items-center pt-1 border-t border-slate-900">
                        <span class="text-slate-500 font-bold">Últimos partidos:</span>
                        <div class="flex gap-1">${historyHtml}</div>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error("Error opening player modal details:", error);
        container.innerHTML = `
            <div class="text-center py-6">
                <p class="text-xs text-pes-konamired font-bold uppercase">ERROR AL CARGAR PERFIL DE JUGADOR</p>
                <button onclick="closePlayerModal()" class="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700">Cerrar</button>
            </div>
        `;
    }
}

function closePlayerModal() {
    const modal = document.getElementById('player-profile-modal');
    if (modal) modal.classList.add('hidden');
}

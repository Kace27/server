// Layout navigation and general utility functions
document.addEventListener('DOMContentLoaded', () => {
    // Set up default tab
    switchTab('dashboard');
    
    // Auto-update match lobbies list (using static demo data for view purposes)
    renderLobbyMatches();
});

// Tab navigation support for both Desktop and Mobile Nav Bars
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(element => {
        element.classList.add('hidden');
    });
    
    const targetTab = document.getElementById(`tab-${tabId}`);
    if (targetTab) {
        targetTab.classList.remove('hidden');
    }

    // Reset styles on sidebar menu (Desktop)
    document.querySelectorAll('aside nav button').forEach(button => {
        button.className = "w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl hover:bg-slate-900/60 text-slate-400 hover:text-slate-200 border-l-4 border-transparent text-left transition-all";
    });

    // Reset styles on bottom nav bar (Mobile)
    document.querySelectorAll('div.fixed button').forEach(button => {
        button.className = "flex flex-col items-center gap-1 text-slate-500 transition-transform active:scale-90 flex-1";
    });

    // Highlight active element in Desktop Sidebar
    const deskButton = document.getElementById(`desktop-nav-${tabId}`);
    if (deskButton) {
        if (tabId === 'rankings') {
            deskButton.className = "w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl bg-gradient-to-r from-pes-goldGlow to-transparent border-l-4 border-pes-gold text-pes-gold font-bold text-left transition-all";
        } else if (tabId === 'downloads') {
            deskButton.className = "w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl bg-gradient-to-r from-pes-konamired/10 to-transparent border-l-4 border-pes-konamired text-pes-konamired font-bold text-left transition-all shadow-konami/5";
        } else {
            deskButton.className = "w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl bg-gradient-to-r from-pes-ps2blue/30 to-transparent border-l-4 border-pes-ps2light text-pes-ps2light font-bold text-left transition-all shadow-pes-blue/5";
        }
    }

    // Highlight active element in Mobile Bottom Nav
    const mobButton = document.getElementById(`mobile-nav-${tabId}`);
    if (mobButton) {
        if (tabId === 'rankings') {
            mobButton.className = "flex flex-col items-center gap-1 text-pes-gold font-bold transition-transform active:scale-90 flex-1";
        } else if (tabId === 'downloads') {
            mobButton.className = "flex flex-col items-center gap-1 text-pes-konamired font-bold transition-transform active:scale-90 flex-1";
        } else {
            mobButton.className = "flex flex-col items-center gap-1 text-pes-ps2light font-bold transition-transform active:scale-90 flex-1";
        }
    }

    // Scroll back to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Load rankings dynamically when rankings tab is selected
    if (tabId === 'rankings') {
        loadRankingsData();
    }
}

// Copy text utility
function copyDnsText(text) {
    const tempInput = document.createElement('input');
    tempInput.value = text;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);
    showToast(`Copiado al portapapeles: ${text}`);
}

// System notifications toast
function showToast(message) {
    const toast = document.getElementById('custom-toast');
    const text = document.getElementById('custom-toast-msg');
    if (toast && text) {
        text.innerText = message;
        toast.classList.remove('hidden');
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 2500);
    }
}

// Simulated downloads logic
function triggerSimulatedDownload(id) {
    const btn = document.getElementById(`btn-dl-${id}`);
    const progPanel = document.getElementById(`prog-panel-${id}`);
    const progPct = document.getElementById(`prog-pct-${id}`);
    const progBar = document.getElementById(`prog-bar-${id}`);

    if (!btn || !progPanel || !progPct || !progBar) return;

    btn.classList.add('hidden');
    progPanel.classList.remove('hidden');

    let percent = 0;
    const interval = setInterval(() => {
        percent += Math.floor(Math.random() * 15) + 5;
        if (percent >= 100) {
            percent = 100;
            clearInterval(interval);
            setTimeout(() => {
                progPanel.classList.add('hidden');
                btn.classList.remove('hidden');
                showToast("¡Descarga completada con éxito!");
            }, 1000);
        }
        progPct.innerText = `${percent}%`;
        progBar.style.width = `${percent}%`;
    }, 200);
}

/// Team ID to Name mapping for PES 6
const PES6_TEAMS = {
    0: "Austria",
    97: "AC Milan",
    104: "Inter de Milán",
    110: "Barcelona",
    120: "Real Madrid",
    124: "Juventus"
};

function getTeamName(teamId) {
    return PES6_TEAMS[teamId] || `Equipo ${teamId}`;
}

// Fetch and render matches from the DB
async function renderLobbyMatches() {
    const dashboardContainer = document.getElementById('dashboard-matches-container');
    const fullGrid = document.getElementById('full-matches-grid');
    
    // Show loading state
    const loadingMsg = `
        <div class="col-span-full py-8 text-center">
            <i class="fa-solid fa-spinner animate-spin text-pes-gold text-xl mb-2"></i>
            <p class="text-[10px] text-slate-500 font-bold font-mono uppercase tracking-widest animate-pulse">CONECTANDO CON EL SERVIDOR...</p>
        </div>
    `;
    if (dashboardContainer) dashboardContainer.innerHTML = loadingMsg;
    if (fullGrid) fullGrid.innerHTML = loadingMsg;
    
    try {
        const dbMatches = await fetchRecentMatches();
        let htmlContent = '';
        
        if (dbMatches.length === 0) {
            htmlContent = `
                <div class="col-span-full py-8 text-center text-xs text-slate-500 font-bold font-mono">
                    NO SE ENCONTRARON PARTIDOS JUGADOS RECIENTEMENTE
                </div>
            `;
        } else {
            dbMatches.forEach(match => {
                const formattedDate = new Date(match.played_on).toLocaleString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit',
                    day: '2-digit',
                    month: 'short'
                });
                const homeTeam = getTeamName(match.team_id_home);
                const awayTeam = getTeamName(match.team_id_away);
                
                // Escape names for safety and serialize match details
                const matchStr = JSON.stringify(match).replace(/"/g, '&quot;');
                
                htmlContent += `
                    <div class="snap-item min-w-[85vw] sm:min-w-[45vw] lg:min-w-0 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between transition-all duration-300 hover:border-slate-700 shadow-xl">
                        <div class="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-2">
                            <span class="flex items-center gap-1.5 font-bold text-pes-gold">
                                <span class="w-1.5 h-1.5 rounded-full bg-pes-gold animate-pulse"></span>
                                FINALIZADO
                            </span>
                            <span class="font-bold">${formattedDate}</span>
                        </div>

                        <div class="grid grid-cols-7 items-center text-center my-3">
                            <div class="col-span-2 text-right cursor-pointer" onclick="openPlayerModal('${match.home_player_name}')">
                                <p class="text-xs font-black text-slate-200 truncate uppercase italic hover:text-pes-gold transition-colors">${match.home_player_name}</p>
                                <span class="text-[9px] text-pes-ps2light font-mono block truncate uppercase font-bold">${homeTeam}</span>
                            </div>
                            
                            <div class="col-span-3 flex flex-col items-center justify-center">
                                <div class="bg-black px-3.5 py-2 rounded-xl border border-slate-800 text-base font-mono font-black text-pes-gold tracking-widest shadow-inner">
                                    ${match.score_home} - ${match.score_away}
                                </div>
                            </div>

                            <div class="col-span-2 text-left cursor-pointer" onclick="openPlayerModal('${match.away_player_name}')">
                                <p class="text-xs font-black text-slate-200 truncate uppercase italic hover:text-pes-gold transition-colors">${match.away_player_name}</p>
                                <span class="text-[9px] text-pes-ps2light font-mono block truncate uppercase font-bold">${awayTeam}</span>
                            </div>
                        </div>

                        <div class="mt-3 pt-3 border-t border-slate-800/80 flex justify-between items-center text-[10px] text-slate-400">
                            <span class="truncate max-w-[120px] font-bold text-[9px] uppercase"><i class="fa-solid fa-location-dot mr-1 text-pes-konamired"></i>Estadio Arena</span>
                            <button onclick="openDbMatchDetailsModal(${matchStr})" class="text-[10px] font-black uppercase hover:text-white bg-slate-850 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-750 transition-colors flex items-center gap-1 shadow-lg">
                                <i class="fa-solid fa-eye text-pes-gold"></i>Ver Detalles
                            </button>
                        </div>
                    </div>
                `;
            });
        }
        
        if (dashboardContainer) dashboardContainer.innerHTML = htmlContent;
        if (fullGrid) fullGrid.innerHTML = htmlContent;
    } catch (error) {
        console.error("Error loading recent matches:", error);
        const errMsg = `
            <div class="col-span-full py-8 text-center">
                <i class="fa-solid fa-triangle-exclamation text-pes-konamired text-xl mb-2"></i>
                <p class="text-xs text-pes-konamired font-bold font-mono">ERROR AL CARGAR PARTIDOS</p>
                <p class="text-[10px] text-slate-500 font-mono mt-1">El servidor puede estar iniciando. Intenta recargar en unos segundos.</p>
                <button onclick="renderLobbyMatches()" class="mt-3 text-[10px] font-black uppercase bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg border border-slate-700 transition-colors">
                    <i class="fa-solid fa-rotate-right mr-1"></i>Reintentar
                </button>
            </div>
        `;
        if (dashboardContainer) dashboardContainer.innerHTML = errMsg;
        if (fullGrid) fullGrid.innerHTML = errMsg;
    }
}

// DB Match details modal controller
function openDbMatchDetailsModal(match) {
    const modal = document.getElementById('match-details-modal');
    const container = document.getElementById('match-modal-interactive-body');
    if (!modal || !container) return;

    const homeTeam = getTeamName(match.team_id_home);
    const awayTeam = getTeamName(match.team_id_away);
    const formattedDate = new Date(match.played_on).toLocaleString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });

    container.innerHTML = `
        <div class="text-center">
            <span class="text-[9px] uppercase font-mono tracking-widest text-pes-gold font-black bg-pes-gold/10 px-3 py-1 rounded border border-pes-gold/20">PARTIDO COMPLETADO</span>
            <div class="grid grid-cols-7 items-center mt-4 gap-2">
                <div class="col-span-2 text-right cursor-pointer" onclick="closeMatchDetailsModal(); openPlayerModal('${match.home_player_name}')">
                    <h4 class="text-sm font-black text-slate-100 uppercase italic truncate hover:text-pes-gold transition-colors">${match.home_player_name}</h4>
                    <span class="text-[10px] text-pes-ps2light font-mono font-bold truncate block uppercase">${homeTeam}</span>
                </div>
                <div class="col-span-3 flex flex-col items-center">
                    <div class="bg-black px-4 py-2.5 rounded-2xl border border-slate-800 font-mono font-black text-xl text-pes-gold tracking-widest shadow-inner">
                        ${match.score_home} - ${match.score_away}
                    </div>
                    <span class="text-[9px] font-mono text-slate-400 font-black mt-2 uppercase tracking-wider">${formattedDate}</span>
                </div>
                <div class="col-span-2 text-left cursor-pointer" onclick="closeMatchDetailsModal(); openPlayerModal('${match.away_player_name}')">
                    <h4 class="text-sm font-black text-slate-100 uppercase italic truncate hover:text-pes-gold transition-colors">${match.away_player_name}</h4>
                    <span class="text-[10px] text-pes-ps2light font-mono font-bold truncate block uppercase">${awayTeam}</span>
                </div>
            </div>
        </div>
        <div class="space-y-3 pt-2">
            <h5 class="text-[10px] font-display font-black uppercase tracking-widest text-pes-gold border-b border-slate-800 pb-1.5 italic">REPORTE DEL SERVIDOR</h5>
            <div class="w-full bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2">
                <p class="text-slate-400 text-xs"><i class="fa-solid fa-location-dot text-pes-konamired mr-1.5"></i> Sede: <span class="text-slate-200 font-bold">Estadio Arena Oficial</span></p>
                <p class="text-slate-400 text-xs"><i class="fa-solid fa-calendar text-pes-ps2light mr-1.5"></i> Fecha de Juego: <span class="text-slate-200 font-bold">${formattedDate}</span></p>
                <p class="text-slate-400 text-xs"><i class="fa-solid fa-hashtag text-pes-gold mr-1.5"></i> Match ID: <span class="text-slate-200 font-mono font-bold">#${match.match_id}</span></p>
            </div>
        </div>
    `;
    modal.classList.remove('hidden');
}

// Fallback signature for legacy code
function openMatchDetailsModal(matchId) {
    console.log("Legacy spectate modal called for ID", matchId);
}

function closeMatchDetailsModal() {
    const modal = document.getElementById('match-details-modal');
    if (modal) modal.classList.add('hidden');
}


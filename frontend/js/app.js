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

// Simulated active match rooms details (tactical radar)
const currentMatches = [
    {
        id: 1,
        room: "Copa América Retro #01",
        player1: "Adriano_Leite_GOAT",
        team1: "Inter de Milán",
        score1: 2,
        player2: "Sheva7_Milan",
        team2: "AC Milan",
        score2: 1,
        minute: "64'",
        ping: "14ms",
        stadium: "Estadio San Siro",
        events: [
            { min: "18'", player: "Andriy Shevchenko", team: "p2", type: "gol" },
            { min: "34'", player: "Ivan Córdoba", team: "p1", type: "amarilla" },
            { min: "44'", player: "Adriano Leite", team: "p1", type: "gol" },
            { min: "58'", player: "Obafemi Martins", team: "p1", type: "gol" }
        ]
    },
    {
        id: 2,
        room: "Lobby LATAM Pro",
        player1: "PesMaster_99",
        team1: "AC Milan",
        score1: 0,
        player2: "Recoba_Sniper",
        team2: "Inter de Milán",
        score2: 0,
        minute: "15'",
        ping: "22ms",
        stadium: "Estadio Monumental",
        events: []
    }
];

function renderLobbyMatches() {
    const dashboardContainer = document.getElementById('dashboard-matches-container');
    const fullGrid = document.getElementById('full-matches-grid');
    
    let htmlContent = '';
    
    currentMatches.forEach(match => {
        htmlContent += `
            <div class="snap-item min-w-[85vw] sm:min-w-[45vw] lg:min-w-0 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between transition-all duration-300 hover:border-slate-700 shadow-xl">
                <div class="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-2">
                    <span class="flex items-center gap-1.5 font-bold text-pes-konamired">
                        <span class="w-1.5 h-1.5 rounded-full bg-pes-konamired animate-pulse"></span>
                        ${match.room}
                    </span>
                    <span class="font-bold">Ping: ${match.ping}</span>
                </div>

                <div class="grid grid-cols-7 items-center text-center my-3">
                    <div class="col-span-2 text-right">
                        <p class="text-xs font-black text-slate-200 truncate uppercase italic">${match.player1}</p>
                        <span class="text-[9px] text-pes-ps2light font-mono block truncate uppercase font-bold">${match.team1}</span>
                    </div>
                    
                    <div class="col-span-3 flex flex-col items-center justify-center">
                        <div class="bg-black px-3.5 py-2 rounded-xl border border-slate-800 text-base font-mono font-black text-pes-gold tracking-widest shadow-inner">
                            ${match.score1} - ${match.score2}
                        </div>
                        <span class="text-[9px] font-mono text-pes-ps2light font-black mt-2 animate-pulse uppercase tracking-wider">${match.minute}</span>
                    </div>

                    <div class="col-span-2 text-left">
                        <p class="text-xs font-black text-slate-200 truncate uppercase italic">${match.player2}</p>
                        <span class="text-[9px] text-pes-ps2light font-mono block truncate uppercase font-bold">${match.team2}</span>
                    </div>
                </div>

                <div class="mt-3 pt-3 border-t border-slate-800/80 flex justify-between items-center text-[10px] text-slate-400">
                    <span class="truncate max-w-[120px] font-bold text-[9px] uppercase"><i class="fa-solid fa-location-dot mr-1 text-pes-konamired"></i>${match.stadium}</span>
                    <button onclick="openMatchDetailsModal(${match.id})" class="text-[10px] font-black uppercase hover:text-white bg-slate-850 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-750 transition-colors flex items-center gap-1 shadow-lg">
                        <i class="fa-solid fa-eye text-pes-gold"></i>Espectar
                    </button>
                </div>
            </div>
        `;
    });

    if (dashboardContainer) dashboardContainer.innerHTML = htmlContent;
    if (fullGrid) fullGrid.innerHTML = htmlContent;
}

// Match details modal controller
function openMatchDetailsModal(matchId) {
    const match = currentMatches.find(m => m.id === matchId);
    if (!match) return;

    const modal = document.getElementById('match-details-modal');
    const container = document.getElementById('match-modal-interactive-body');
    if (!modal || !container) return;

    let eventsHtml = '';
    if (match.events.length === 0) {
        eventsHtml = `<p class="text-slate-500 font-mono text-[10px] uppercase font-bold text-center py-3">Estudio de juego táctico. Sin goles registrados.</p>`;
    } else {
        match.events.forEach(ev => {
            let actionIcon = '<i class="fa-solid fa-soccer-ball text-pes-gold"></i>';
            if (ev.type === 'amarilla') actionIcon = '<i class="fa-solid fa-square text-yellow-500"></i>';
            
            eventsHtml += `
                <div class="flex items-center gap-2 bg-black/60 px-3 py-2 rounded-xl border border-slate-850">
                    <span class="text-pes-ps2light font-mono text-[10px] font-bold">${ev.min}</span>
                    <span class="text-slate-200 text-xs truncate max-w-[150px] font-bold italic">${ev.player}</span>
                    <span class="ml-auto text-[9px] font-mono uppercase text-slate-500 flex items-center gap-1">
                        ${actionIcon}
                    </span>
                </div>
            `;
        });
    }

    container.innerHTML = `
        <div class="text-center">
            <span class="text-[9px] uppercase font-mono tracking-widest text-pes-konamired font-black bg-pes-konamired/10 px-3 py-1 rounded border border-pes-konamired/20">${match.room}</span>
            <div class="grid grid-cols-7 items-center mt-4 gap-2">
                <div class="col-span-2 text-right">
                    <h4 class="text-sm font-black text-slate-100 uppercase italic truncate">${match.player1}</h4>
                    <span class="text-[10px] text-pes-ps2light font-mono font-bold truncate block uppercase">${match.team1}</span>
                </div>
                <div class="col-span-3 flex flex-col items-center">
                    <div class="bg-black px-4 py-2.5 rounded-2xl border border-slate-800 font-mono font-black text-xl text-pes-gold tracking-widest shadow-inner">
                        ${match.score1} - ${match.score2}
                    </div>
                    <span class="text-[9px] font-mono text-pes-ps2light font-black mt-2 animate-pulse uppercase tracking-wider">${match.minute}</span>
                </div>
                <div class="col-span-2 text-left">
                    <h4 class="text-sm font-black text-slate-100 uppercase italic truncate">${match.player2}</h4>
                    <span class="text-[10px] text-pes-ps2light font-mono font-bold truncate block uppercase">${match.team2}</span>
                </div>
            </div>
        </div>
        <div class="space-y-3 pt-2">
            <h5 class="text-[10px] font-display font-black uppercase tracking-widest text-pes-gold border-b border-slate-800 pb-1.5 italic">RADAR DE ESTRATEGIA EN VIVO</h5>
            <div class="w-full bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2">
                <p class="text-slate-400 text-xs"><i class="fa-solid fa-location-dot text-pes-konamired mr-1.5"></i> Sede: <span class="text-slate-200 font-bold">${match.stadium}</span></p>
                <div class="mt-2 space-y-1.5">
                    <p class="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-black">Eventos del Partido</p>
                    ${eventsHtml}
                </div>
            </div>
        </div>
    `;
    modal.classList.remove('hidden');
}

function closeMatchDetailsModal() {
    const modal = document.getElementById('match-details-modal');
    if (modal) modal.classList.add('hidden');
}

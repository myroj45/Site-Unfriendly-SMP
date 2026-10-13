// ============================================================
//   SCRIPT PRINCIPAL - UNFRIENDLY SMP
// ============================================================

// --- CONFIGURATION ---
// Modifie ici si tu changes d'IP plus tard
const SERVER_IP = "Unfriendly-smp.mcgo.io";


// ============================================================
//   1. FONCTION : COPIER L'IP DANS LE PRESSE-PAPIERS
// ============================================================
function copyIP() {
    // On utilise l'API moderne du navigateur (navigator.clipboard)
    navigator.clipboard.writeText(SERVER_IP)
        .then(() => {
            // Succès : on affiche le message "Copié !"
            const msg = document.getElementById('copy-msg');
            if (msg) {
                msg.style.opacity = '1';
                msg.style.bottom = '-15px';
                
                // On cache le message après 2 secondes
                setTimeout(() => {
                    msg.style.opacity = '0';
                    msg.style.bottom = '-30px';
                }, 2000);
            }
            console.log("✅ IP copiée : " + SERVER_IP);
        })
        .catch(err => {
            // En cas d'erreur (ex: navigateur trop vieux ou HTTPS manquant)
            console.error('❌ Erreur lors de la copie : ', err);
            alert("Impossible de copier automatiquement. L'IP est : " + SERVER_IP);
        });
}


// ============================================================
//   2. FONCTION : RÉCUPÉRER LE STATUT DU SERVEUR EN DIRECT
// ============================================================
async function fetchServerStatus() {
    // Récupération des éléments HTML à mettre à jour
    const statusDot = document.getElementById('status-dot');
    const statusText = document.getElementById('status-text');
    const playerCount = document.getElementById('player-count');

    // Sécurité : si les éléments n'existent pas sur la page, on arrête
    if (!statusDot || !statusText || !playerCount) return;

    try {
        // Appel à l'API publique mcstatus.io (Version 2)
        const response = await fetch(`https://api.mcstatus.io/v2/status/java/${SERVER_IP}`);
        
        // Vérification de la réponse HTTP
        if (!response.ok) {
            throw new Error(`Erreur HTTP : ${response.status}`);
        }

        const data = await response.json();
        console.log("📡 Données du serveur :", data);

        // --- MISE À JOUR DE L'INTERFACE ---
        if (data.online === true) {
            // Le serveur est EN LIGNE
            statusDot.className = 'status-dot status-online';
            statusText.textContent = 'En ligne';
            playerCount.textContent = data.players.online;
        } else {
            // Le serveur est HORS LIGNE
            statusDot.className = 'status-dot status-offline';
            statusText.textContent = 'Hors ligne';
            playerCount.textContent = '0';
        }

    } catch (error) {
        // En cas d'erreur (serveur down, API indisponible, etc.)
        console.error("❌ Erreur API Statut :", error);
        statusDot.className = 'status-dot';
        statusText.textContent = "Statut indisponible";
        playerCount.textContent = "?";
    }
}


// ============================================================
//   3. INITIALISATION AU CHARGEMENT DE LA PAGE
// ============================================================
window.addEventListener('DOMContentLoaded', () => {
    console.log("🚀 UnfriendlySMP - Site chargé !");
    
    // Lancer la vérification du statut immédiatement
    fetchServerStatus();
    
    // Rafraîchir le statut toutes les 60 secondes (60000 ms)
    setInterval(fetchServerStatus, 60000);
});
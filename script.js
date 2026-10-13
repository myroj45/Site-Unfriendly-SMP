/* ============================================================
   UNFRIENDLYSMP — SCRIPT COMPLET FINAL
   ============================================================ */

const CONFIG = {
    SERVER_IP: "Unfriendly-smp.mcgo.io",
    API_1: "https://api.mcstatus.io/v2/status/java/",
    API_2: "https://api.mcsrvstat.us/3/",
    REFRESH: 60000,
    TIMEOUT: 8000,
    PARTICLES: 60,
    DEFAULT_VERSION: "1.21.2"
};


/* ============================================================
   🎵 MUSIQUE
   ============================================================ */
function initBGM() {
    const bgm = document.getElementById('bgm');
    const muteToggle = document.getElementById('mute-toggle');
    if (!bgm || !muteToggle) return;

    bgm.volume = 0.5;
    bgm.loop = true;

    const savedMuted = localStorage.getItem('unfriendly_muted');
    let isMuted = savedMuted === 'true';

    function updateIcon() {
        const icon = muteToggle.querySelector('i');
        if (!icon) return;
        icon.className = isMuted ? 'fa-solid fa-volume-xmark' : 'fa-solid fa-volume-high';
        muteToggle.classList.toggle('muted', isMuted);
    }
    updateIcon();

    function playMusic() {
        if (isMuted) return;
        bgm.play().then(() => {
            console.log("🎵 Musique lancée");
            removeListeners();
        }).catch(() => console.warn("⚠️ Autoplay bloqué"));
    }

    const events = ['click', 'touchstart', 'keydown', 'mousemove', 'scroll'];
    function firstInteraction() { playMusic(); }
    function removeListeners() {
        events.forEach(e => document.removeEventListener(e, firstInteraction));
    }

    playMusic();
    events.forEach(e => document.addEventListener(e, firstInteraction));

    muteToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        if (bgm.paused) {
            isMuted = false;
            localStorage.setItem('unfriendly_muted', 'false');
            bgm.play().then(updateIcon);
        } else {
            isMuted = true;
            localStorage.setItem('unfriendly_muted', 'true');
            bgm.pause();
            updateIcon();
        }
    });
}


/* ============================================================
   PARTICULES
   ============================================================ */
const canvas = document.getElementById('particles-canvas');
const ctx = canvas ? canvas.getContext('2d') : null;
let particles = [];
let mouse = { x: null, y: null, radius: 150 };

function initCanvas() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

function createParticles() {
    if (!canvas) return;
    particles = [];
    for (let i = 0; i < CONFIG.PARTICLES; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2 + 0.5,
            speedX: (Math.random() - 0.5) * 0.5,
            speedY: (Math.random() - 0.5) * 0.5,
            opacity: Math.random() * 0.5 + 0.2
        });
    }
}

function drawParticles() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p, i) => {
        p.x += p.speedX;
        p.y += p.speedY;
        if (p.x < 0 || p.x > canvas.width) p.speedX *= -1;
        if (p.y < 0 || p.y > canvas.height) p.speedY *= -1;

        if (mouse.x !== null) {
            const dx = mouse.x - p.x;
            const dy = mouse.y - p.y;
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d < mouse.radius) {
                const f = (mouse.radius - d) / mouse.radius;
                p.x -= (dx / d) * f * 2;
                p.y -= (dy / d) * f * 2;
            }
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 0, 51, ${p.opacity})`;
        ctx.shadowColor = 'rgba(255, 0, 51, 0.8)';
        ctx.shadowBlur = 10;
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
            const p2 = particles[j];
            const dist = Math.sqrt((p.x - p2.x) ** 2 + (p.y - p2.y) ** 2);
            if (dist < 120) {
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.strokeStyle = `rgba(255, 0, 51, ${0.15 * (1 - dist / 120)})`;
                ctx.lineWidth = 0.5;
                ctx.stroke();
            }
        }
    });
    requestAnimationFrame(drawParticles);
}

if (canvas) {
    window.addEventListener('mousemove', e => { mouse.x = e.x; mouse.y = e.y; });
    window.addEventListener('mouseleave', () => { mouse.x = null; mouse.y = null; });
    window.addEventListener('resize', () => { initCanvas(); createParticles(); });
}


/* ============================================================
   COPIER IP
   ============================================================ */
function copyIP() {
    navigator.clipboard.writeText(CONFIG.SERVER_IP)
        .then(() => showToast("IP copiée dans le presse-papiers !"))
        .catch(() => fallbackCopy(CONFIG.SERVER_IP));
}

function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); showToast("IP copiée !"); }
    catch (err) { alert("IP : " + text); }
    document.body.removeChild(ta);
}

function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    const t = toast.querySelector('span');
    if (t) t.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
}


/* ============================================================
   API QUERY HELPER
   ============================================================ */
async function queryAPI(url) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT);
    try {
        const r = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return await r.json();
    } catch (err) {
        clearTimeout(timeoutId);
        throw err;
    }
}


/* ============================================================
   📡 STATS DÉTAILLÉES (Bandeau du bas)
   ============================================================ */
async function fetchLiveDetailedStats() {
    console.log("🔄 fetchLiveDetailedStats() démarré");

    const liveDot = document.getElementById('live-dot');
    const liveStatus = document.getElementById('live-status');
    const livePlayers = document.getElementById('live-players');
    const liveVersion = document.getElementById('live-version');

    if (!liveStatus) return;

    let result = null;

    // API 1
    try {
        const data = await queryAPI(`${CONFIG.API_1}${CONFIG.SERVER_IP}`);
        console.log("📡 API 1 :", data);
        if (data && (data.online === true || data.players !== undefined)) {
            result = {
                players: data.players?.online ?? 0,
                version: data.version?.name_clean || CONFIG.DEFAULT_VERSION
            };
        }
    } catch (err) {
        console.warn("⚠️ API 1 échouée :", err.message);
    }

    // API 2 (fallback)
    if (!result) {
        try {
            const data = await queryAPI(`${CONFIG.API_2}${CONFIG.SERVER_IP}`);
            console.log("📡 API 2 :", data);
            if (data && data.online === true) {
                result = {
                    players: data.players?.online ?? 0,
                    version: data.version || CONFIG.DEFAULT_VERSION
                };
            }
        } catch (err) {
            console.warn("⚠️ API 2 échouée :", err.message);
        }
    }

    // Affichage
    if (result) {
        console.log(`✅ EN LIGNE — ${result.players} joueurs — ${result.version}`);
        if (liveDot) liveDot.className = 'dot-live';
        if (liveStatus) {
            liveStatus.textContent = 'En ligne';
            liveStatus.style.color = '#00ff88';
        }
        if (livePlayers) livePlayers.textContent = result.players;
        if (liveVersion) liveVersion.textContent = result.version;
    } else {
        console.log("❌ HORS LIGNE");
        if (liveDot) liveDot.className = 'dot-live offline';
        if (liveStatus) {
            liveStatus.textContent = 'Hors ligne';
            liveStatus.style.color = '#ff0033';
        }
        if (livePlayers) livePlayers.textContent = '0';
        if (liveVersion) liveVersion.textContent = CONFIG.DEFAULT_VERSION;
    }
}


/* ============================================================
   📡 STATUT HERO (Barre du haut)
   ============================================================ */
async function fetchServerStatus() {
    const statusDot = document.getElementById('status-dot');
    const statusText = document.getElementById('status-text');
    const playerCount = document.getElementById('player-count');
    const versionText = document.getElementById('version-text');

    if (!statusDot || !statusText || !playerCount) return;

    let result = null;

    try {
        const data = await queryAPI(`${CONFIG.API_1}${CONFIG.SERVER_IP}`);
        if (data && (data.online === true || data.players !== undefined)) {
            result = {
                players: data.players?.online ?? 0,
                version: data.version?.name_clean || CONFIG.DEFAULT_VERSION
            };
        }
    } catch (err) {
        try {
            const data = await queryAPI(`${CONFIG.API_2}${CONFIG.SERVER_IP}`);
            if (data && data.online === true) {
                result = {
                    players: data.players?.online ?? 0,
                    version: data.version || CONFIG.DEFAULT_VERSION
                };
            }
        } catch (err2) {
            console.error("Les 2 APIs ont échoué");
        }
    }

    if (result) {
        statusDot.className = 'status-dot online';
        statusText.textContent = 'En ligne';
        playerCount.textContent = result.players;
        if (versionText) versionText.textContent = result.version;
    } else {
        statusDot.className = 'status-dot offline';
        statusText.textContent = 'Hors ligne';
        playerCount.textContent = '0';
        if (versionText) versionText.textContent = CONFIG.DEFAULT_VERSION;
    }
}


/* ============================================================
   COMPTEURS ANIMÉS
   ============================================================ */
function animateCounters() {
    const counters = document.querySelectorAll('.stat-number');
    if (!counters.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const target = parseInt(el.getAttribute('data-target'));
                const suffix = el.getAttribute('data-suffix') || '';
                const duration = 2000;
                const start = performance.now();

                function update(now) {
                    const elapsed = now - start;
                    const progress = Math.min(elapsed / duration, 1);
                    const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
                    el.textContent = Math.floor(eased * target).toLocaleString('fr-FR') + suffix;
                    if (progress < 1) requestAnimationFrame(update);
                }
                requestAnimationFrame(update);
                observer.unobserve(el);
            }
        });
    }, { threshold: 0.3 });

    counters.forEach(c => observer.observe(c));
}


/* ============================================================
   MENU BURGER
   ============================================================ */
function initBurgerMenu() {
    const burger = document.getElementById('burger');
    const navMenu = document.getElementById('nav-menu');
    if (!burger || !navMenu) return;

    burger.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        burger.classList.toggle('active');
    });

    navMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            burger.classList.remove('active');
        });
    });
}


/* ============================================================
   HEADER SCROLL
   ============================================================ */
function initHeaderScroll() {
    const header = document.getElementById('header');
    if (!header) return;
    window.addEventListener('scroll', () => {
        header.classList.toggle('scrolled', window.scrollY > 50);
    });
}


/* ============================================================
   ANIMATIONS SCROLL
   ============================================================ */
function initScrollAnimations() {
    const elements = document.querySelectorAll('.feature-card, .stat-card, .team-card');
    if (!elements.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, i) => {
            if (entry.isIntersecting) {
                setTimeout(() => entry.target.classList.add('visible'), i * 80);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

    elements.forEach(el => observer.observe(el));
}


/* ============================================================
   WIKI SEARCH
   ============================================================ */
function initWikiSearch() {
    const input = document.getElementById('wiki-search-input');
    if (!input) return;
    const sections = document.querySelectorAll('.wiki-section');
    input.addEventListener('input', (e) => {
        const q = e.target.value.toLowerCase().trim();
        sections.forEach(s => {
            s.style.display = (q === '' || s.textContent.toLowerCase().includes(q)) ? '' : 'none';
        });
    });
}


/* ============================================================
   TOC HIGHLIGHT
   ============================================================ */
function initTocHighlight() {
    const links = document.querySelectorAll('.toc-link');
    const sections = document.querySelectorAll('.wiki-section');
    if (!links.length || !sections.length) return;

    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(s => {
            if (window.scrollY >= s.offsetTop - 150) current = s.getAttribute('id');
        });
        links.forEach(l => {
            l.classList.remove('active');
            if (l.getAttribute('href') === `#${current}`) l.classList.add('active');
        });
    });
}


/* ============================================================
   🚀 INITIALISATION
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
    console.log("%c🚀 UnfriendlySMP chargé", "color: #ff0033; font-size: 16px; font-weight: bold;");

    initBGM();

    if (canvas) {
        initCanvas();
        createParticles();
        drawParticles();
    }

    initBurgerMenu();
    initHeaderScroll();
    initScrollAnimations();
    initWikiSearch();
    initTocHighlight();
    animateCounters();

    fetchServerStatus();
    fetchLiveDetailedStats();
    setInterval(fetchServerStatus, CONFIG.REFRESH);
    setInterval(fetchLiveDetailedStats, CONFIG.REFRESH);

    document.addEventListener('keydown', (e) => {
        if (e.key.toLowerCase() === 'c' && !e.ctrlKey && !e.metaKey &&
            document.activeElement.tagName !== 'INPUT' &&
            document.activeElement.tagName !== 'TEXTAREA') {
            copyIP();
        }
    });
});
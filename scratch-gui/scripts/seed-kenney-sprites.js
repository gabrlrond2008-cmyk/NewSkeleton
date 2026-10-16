/**
 * scripts/seed-kenney-sprites.js
 * Ingests a curated set of vector game characters with animation frames and pins
 * into Scratch 3.0 library.
 */
const { ingestSprite } = require('./import-sprites');

// 1. Alien Green (Space Character with multi-frame walk animation)
const alienGreen = {
    name: "Alien Green",
    tags: ["space", "alien", "character", "people", "monster"],
    pivotType: "feet",
    costumes: [
        {
            name: "alien-idle",
            dataFormat: "svg",
            content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 120" width="100" height="120">
                <ellipse cx="50" cy="55" rx="35" ry="40" fill="#78B833" stroke="#4A751C" stroke-width="4"/>
                <circle cx="38" cy="45" r="10" fill="#FFFFFF"/>
                <circle cx="38" cy="45" r="5" fill="#1A2D08"/>
                <circle cx="62" cy="45" r="10" fill="#FFFFFF"/>
                <circle cx="62" cy="45" r="5" fill="#1A2D08"/>
                <path d="M40 75 Q50 85 60 75" fill="none" stroke="#4A751C" stroke-width="4" stroke-linecap="round"/>
                <!-- Antennas -->
                <line x1="35" y1="20" x2="25" y2="5" stroke="#4A751C" stroke-width="4" stroke-linecap="round"/>
                <circle cx="23" cy="4" r="5" fill="#B3E645"/>
                <line x1="65" y1="20" x2="75" y2="5" stroke="#4A751C" stroke-width="4" stroke-linecap="round"/>
                <circle cx="77" cy="4" r="5" fill="#B3E645"/>
                <!-- Feet -->
                <ellipse cx="35" cy="112" rx="14" ry="7" fill="#4A751C"/>
                <ellipse cx="65" cy="112" rx="14" ry="7" fill="#4A751C"/>
            </svg>`
        },
        {
            name: "alien-walk",
            dataFormat: "svg",
            content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 120" width="100" height="120">
                <ellipse cx="50" cy="52" rx="35" ry="40" fill="#78B833" stroke="#4A751C" stroke-width="4"/>
                <circle cx="40" cy="42" r="10" fill="#FFFFFF"/>
                <circle cx="42" cy="42" r="5" fill="#1A2D08"/>
                <circle cx="64" cy="42" r="10" fill="#FFFFFF"/>
                <circle cx="66" cy="42" r="5" fill="#1A2D08"/>
                <path d="M42 72 Q52 82 62 72" fill="none" stroke="#4A751C" stroke-width="4" stroke-linecap="round"/>
                <line x1="35" y1="18" x2="28" y2="4" stroke="#4A751C" stroke-width="4" stroke-linecap="round"/>
                <circle cx="26" cy="3" r="5" fill="#B3E645"/>
                <line x1="65" y1="18" x2="78" y2="6" stroke="#4A751C" stroke-width="4" stroke-linecap="round"/>
                <circle cx="80" cy="5" r="5" fill="#B3E645"/>
                <!-- Step forward feet -->
                <ellipse cx="28" cy="110" rx="14" ry="7" fill="#4A751C"/>
                <ellipse cx="72" cy="114" rx="14" ry="7" fill="#4A751C"/>
            </svg>`
        }
    ]
};

// 2. Star Fighter (Space Ship with thrust animation)
const starFighter = {
    name: "Star Fighter",
    tags: ["space", "ship", "vehicle", "rocket"],
    pivotType: "center",
    costumes: [
        {
            name: "fighter-idle",
            dataFormat: "svg",
            content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 100" width="120" height="100">
                <!-- Wings -->
                <polygon points="10,80 60,30 110,80 60,65" fill="#2563EB" stroke="#1D4ED8" stroke-width="3"/>
                <!-- Main Body -->
                <polygon points="60,10 75,70 60,65 45,70" fill="#E2E8F0" stroke="#94A3B8" stroke-width="3"/>
                <!-- Cockpit -->
                <ellipse cx="60" cy="42" rx="7" ry="15" fill="#38BDF8" stroke="#0284C7" stroke-width="2"/>
                <!-- Laser Canons -->
                <rect x="18" y="55" width="4" height="20" rx="2" fill="#EF4444"/>
                <rect x="98" y="55" width="4" height="20" rx="2" fill="#EF4444"/>
            </svg>`
        },
        {
            name: "fighter-thrust",
            dataFormat: "svg",
            content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
                <!-- Wings -->
                <polygon points="10,80 60,30 110,80 60,65" fill="#2563EB" stroke="#1D4ED8" stroke-width="3"/>
                <!-- Main Body -->
                <polygon points="60,10 75,70 60,65 45,70" fill="#E2E8F0" stroke="#94A3B8" stroke-width="3"/>
                <!-- Cockpit -->
                <ellipse cx="60" cy="42" rx="7" ry="15" fill="#38BDF8" stroke="#0284C7" stroke-width="2"/>
                <!-- Laser Canons -->
                <rect x="18" y="55" width="4" height="20" rx="2" fill="#EF4444"/>
                <rect x="98" y="55" width="4" height="20" rx="2" fill="#EF4444"/>
                <!-- Thruster Flame -->
                <polygon points="52,70 60,115 68,70" fill="#F97316"/>
                <polygon points="56,70 60,95 64,70" fill="#FDE047"/>
            </svg>`
        }
    ]
};

// 3. Cyber Bot (Robotics character)
const cyberBot = {
    name: "Cyber Bot",
    tags: ["people", "robot", "scifi", "character"],
    pivotType: "feet",
    costumes: [
        {
            name: "bot-idle",
            dataFormat: "svg",
            content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 110" width="90" height="110">
                <!-- Head -->
                <rect x="25" y="15" width="40" height="32" rx="8" fill="#475569" stroke="#1E293B" stroke-width="3"/>
                <!-- Screen / Eyes -->
                <rect x="30" y="24" width="30" height="14" rx="4" fill="#0EA5E9"/>
                <circle cx="38" cy="31" r="3" fill="#FFFFFF"/>
                <circle cx="52" cy="31" r="3" fill="#FFFFFF"/>
                <line x1="45" y1="15" x2="45" y2="5" stroke="#1E293B" stroke-width="3"/>
                <circle cx="45" cy="4" r="4" fill="#EF4444"/>
                <!-- Body -->
                <rect x="22" y="52" width="46" height="36" rx="6" fill="#64748B" stroke="#1E293B" stroke-width="3"/>
                <circle cx="45" cy="70" r="8" fill="#F59E0B" stroke="#D97706" stroke-width="2"/>
                <!-- Limbs -->
                <rect x="10" y="55" width="8" height="24" rx="4" fill="#334155"/>
                <rect x="72" y="55" width="8" height="24" rx="4" fill="#334155"/>
                <!-- Treads / Legs -->
                <rect x="26" y="92" width="14" height="16" rx="4" fill="#1E293B"/>
                <rect x="50" y="92" width="14" height="16" rx="4" fill="#1E293B"/>
            </svg>`
        },
        {
            name: "bot-wave",
            dataFormat: "svg",
            content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 110" width="90" height="110">
                <rect x="25" y="15" width="40" height="32" rx="8" fill="#475569" stroke="#1E293B" stroke-width="3"/>
                <rect x="30" y="24" width="30" height="14" rx="4" fill="#0EA5E9"/>
                <circle cx="38" cy="31" r="3" fill="#FFFFFF"/>
                <circle cx="52" cy="31" r="3" fill="#FFFFFF"/>
                <line x1="45" y1="15" x2="45" y2="5" stroke="#1E293B" stroke-width="3"/>
                <circle cx="45" cy="4" r="4" fill="#EF4444"/>
                <rect x="22" y="52" width="46" height="36" rx="6" fill="#64748B" stroke="#1E293B" stroke-width="3"/>
                <circle cx="45" cy="70" r="8" fill="#10B981" stroke="#059669" stroke-width="2"/>
                <!-- Left arm down, right arm waving up -->
                <rect x="10" y="55" width="8" height="24" rx="4" fill="#334155"/>
                <polygon points="72,55 86,30 80,26 68,50" fill="#334155"/>
                <rect x="26" y="92" width="14" height="16" rx="4" fill="#1E293B"/>
                <rect x="50" y="92" width="14" height="16" rx="4" fill="#1E293B"/>
            </svg>`
        }
    ]
};

console.log('--- Ingestando nuevos sprites con pines calculados ---');
ingestSprite(alienGreen);
ingestSprite(starFighter);
ingestSprite(cyberBot);
console.log('--- Proceso completado exitosamente ---');

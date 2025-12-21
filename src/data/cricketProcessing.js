// src/data/cricketProcessing.js
import { MOCK_DB } from "./mockDb";

/**
 * Small helper to get initials from a player name.
 * Used by TeamListItem / PlayerCard.
 */
export const getInitials = (name) => {
    if (!name || typeof name !== "string") return "??";
    return name
        .split(" ")
        .filter(Boolean)
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase();
};

/**
 * Get player image URL
 * Priority: player.img from API > UI Avatars service
 */
export const getPlayerImageUrl = (player) => {
    // If player has image from API, use it
    if (player?.img && player.img.trim()) {
        return player.img;
    }
    
    // Fallback to UI Avatars service with player name
    if (player?.name) {
        const name = encodeURIComponent(player.name);
        const gradient = getPlayerGradient(player.name);
        // Extract colors from gradient class
        const colorMap = {
            'blue': '3B82F6',
            'purple': '9333EA',
            'pink': 'EC4899',
            'red': 'EF4444',
            'orange': 'F97316',
            'yellow': 'EAB308',
            'green': '10B981',
            'teal': '14B8A6',
            'cyan': '06B6D4',
            'indigo': '6366F1',
        };
        
        const colorKey = gradient.split('-')[1]; // Extract 'blue' from 'from-blue-600'
        const bgColor = colorMap[colorKey] || '6366F1';
        
        return `https://ui-avatars.com/api/?name=${name}&size=256&background=${bgColor}&color=fff&bold=true&format=png`;
    }
    
    return null;
};

/**
 * Generate a gradient background color based on player name
 * Creates consistent colors for each player
 */
export const getPlayerGradient = (name) => {
    if (!name) return "from-slate-600 to-slate-700";
    
    const colors = [
        "from-blue-600 to-blue-700",
        "from-purple-600 to-purple-700",
        "from-pink-600 to-pink-700",
        "from-red-600 to-red-700",
        "from-orange-600 to-orange-700",
        "from-yellow-600 to-yellow-700",
        "from-green-600 to-green-700",
        "from-teal-600 to-teal-700",
        "from-cyan-600 to-cyan-700",
        "from-indigo-600 to-indigo-700",
    ];
    
    // Generate consistent color based on name
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
};

/**
 * Convert IPL-style JSON (with op_team, Bt_Runs, etc.)
 * into the flat player objects your sim uses:
 * { id, name, role, avg, sr, bowlAvg, bowlEcon }
 */
// List of overseas players from IPL 2025 Auction data
const OVERSEAS_PLAYERS = new Set([
    // From auction list - exact names
    'Jos Buttler', 'Kagiso Rabada', 'Mitchell Starc', 'Liam Livingstone', 'David Miller',
    'Harry Brook', 'Devon Conway', 'Jake Fraser-Mcgurk', 'Aiden Markram', 'David Warner',
    'Mitchell Marsh', 'Glenn Maxwell', 'Rachin Ravindra', 'Marcus Stoinis', 'Jonny Bairstow',
    'Quinton De Kock', 'Rahmanullah Gurbaz', 'Phil Salt', 'Trent Boult', 'Josh Hazlewood',
    'Anrich Nortje', 'Noor Ahmad', 'Wanindu Hasaranga', 'Waqar Salamkheil', 'Maheesh Theekshana',
    'Adam Zampa', 'Faf Du Plessis', 'Glenn Phillips', 'Rovman Powell', 'Kane Williamson',
    'Sam Curran', 'Marco Jansen', 'Daryl Mitchell', 'Alex Carey', 'Donovan Ferreira',
    'Shai Hope', 'Josh Inglis', 'Ryan Rickelton', 'Gerald Coetzee', 'Lockie Ferguson',
    'Allah Ghazanfar', 'Akeal Hosein', 'Keshav Maharaj', 'Mujeeb Ur Rahman', 'Adil Rashid',
    'Vijayakanth Viyaskanth', 'Tom Kohler-Cadmore', 'Finn Allen', 'Dewald Brevis', 'Ben Duckett',
    'Rilee Rossouw', 'Sherfane Rutherford', 'Ashton Turner', 'James Vince', 'Moeen Ali',
    'Tim David', 'Will Jacks', 'Azmatullah Omarzai', 'Romario Shepherd', 'Tom Banton',
    'Sam Billings', 'Jordan Cox', 'Ben McDermott', 'Kusal Mendis', 'Kusal Perera',
    'Josh Philippe', 'Tim Seifert', 'Nandre Burger', 'Spencer Johnson', 'Mustafizur Rahman',
    'Nuwan Thushara', 'Naveen Ul Haq', 'Rishad Hossain', 'Zahir Khan Pakten', 'Nqabayomzi Peter',
    'Tanveer Sangha', 'Tabraiz Shamsi', 'Jeffrey Vandersay',
    // Abbreviated versions from iplData.json
    'JC Buttler', 'K Rabada', 'MA Starc', 'LS Livingstone', 'DA Miller', 'H Brook',
    'J Fraser-McGurk', 'AK Markram', 'DA Warner', 'MR Marsh', 'GJ Maxwell', 'R Ravindra',
    'MP Stoinis', 'JM Bairstow', 'Q de Kock', 'Rahmanullah Gurbaz', 'PD Salt', 'TA Boult',
    'JR Hazlewood', 'A Nortje', 'Noor Ahmad', 'W Hasaranga', 'M Theekshana', 'A Zampa',
    'F du Plessis', 'GD Phillips', 'R Powell', 'KS Williamson', 'SM Curran', 'M Jansen',
    'DJ Mitchell', 'D Ferreira', 'G Coetzee', 'LH Ferguson', 'MM Ali', 'TH David',
    'WG Jacks', 'Azmatullah Omarzai', 'R Shepherd', 'D Brevis', 'R Rossouw', 'SH Johnson',
    'Mustafizur Rahman', 'N Thushara', 'T Shamsi', 'SP Narine', 'AD Russell', 'N Pooran',
    'SO Hetmyer', 'M Pathirana', 'PVD Chameera', 'RJ Gleeson', 'RJW Topley', 'NT Ellis',
    'KT Maphaka', 'T Stubbs', 'MJ Santner'
]);

// Common overseas name patterns
const OVERSEAS_PATTERNS = [
    /^[A-Z]{2,3}\s+de\s+/i,  // AB de Villiers, Q de Kock
    /\s+van\s+der\s+/i,       // Rassie van der Dussen
    /^Mohammad\s+/i,          // Mohammad Nabi, Mohammad Amir
    /^Mustafizur\s+/i,        // Mustafizur Rahman
    /^Shakib\s+/i,            // Shakib Al Hasan
    /^Rashid\s+/i,            // Rashid Khan
    /^Imran\s+/i,             // Imran Tahir
    /^Kagiso\s+/i,            // Kagiso Rabada
    /^Lungi\s+/i,             // Lungi Ngidi
    /^Anrich\s+/i,            // Anrich Nortje
    /^Wanindu\s+/i,           // Wanindu Hasaranga
    /^Dushmantha\s+/i,        // Dushmantha Chameera
    /^Lasith\s+/i,            // Lasith Malinga
];

// Helper to check if player is overseas
const isOverseasPlayer = (name) => {
    // Direct match
    if (OVERSEAS_PLAYERS.has(name)) return true;
    
    // Check common abbreviations
    const normalized = name.replace(/\./g, '').trim();
    for (const overseas of OVERSEAS_PLAYERS) {
        const overseasNorm = overseas.replace(/\./g, '').trim();
        if (normalized === overseasNorm) return true;
    }
    
    // Check name patterns
    for (const pattern of OVERSEAS_PATTERNS) {
        if (pattern.test(name)) return true;
    }
    
    return false;
};

export const processIPLData = (data) => {
    const defaultDB = MOCK_DB || [];

    if (!data || Object.keys(data).length === 0) {
        return defaultDB;
    }

    try {
        return Object.entries(data)
            .map(([name, pData]) => {
                let totalRuns = 0;
                let totalBalls = 0;
                let totalOuts = 0;

                let totalBowlRuns = 0;
                let totalBowlBalls = 0;
                let totalWickets = 0;

                if (pData.op_team) {
                    Object.values(pData.op_team).forEach((teamStats) => {
                        totalRuns += teamStats.Bt_Runs || 0;
                        totalBalls += teamStats.Bt_Balls || 0;

                        if (Array.isArray(teamStats.Bt_W_list)) {
                            totalOuts += teamStats.Bt_W_list.filter((w) => w === 1).length;
                        }

                        totalBowlRuns += teamStats.Bw_Runs || 0;
                        totalBowlBalls += teamStats.Bw_Balls || 0;

                        if (Array.isArray(teamStats.Bw_W_list)) {
                            totalWickets += teamStats.Bw_W_list.reduce(
                                (sum, val) => sum + val,
                                0
                            );
                        }
                    });
                }

                // Skip players with almost no data
                if (totalBalls < 10 && totalBowlBalls < 10) return null;

                const batAvg = totalOuts > 0 ? totalRuns / totalOuts : totalRuns;
                const batSr = totalBalls > 0 ? (totalRuns / totalBalls) * 100 : 0;
                const bowlAvg = totalWickets > 0 ? totalBowlRuns / totalWickets : 99;
                const bowlEcon =
                    totalBowlBalls > 0 ? totalBowlRuns / (totalBowlBalls / 6) : 12;

                let role = "All";
                if (totalBalls > 200 && totalWickets < 10) role = "Bat";
                else if (totalBalls < 200 && totalWickets > 10) role = "Bowl";
                else if (totalWickets === 0) role = "Bat";

                return {
                    id: name.replace(/\s+/g, "_").toLowerCase(),
                    name,
                    role,
                    avg: Number(batAvg.toFixed(2)),
                    sr: Number(batSr.toFixed(2)),
                    bowlAvg: Number(bowlAvg.toFixed(2)),
                    bowlEcon: Number(bowlEcon.toFixed(2)),
                    isOverseas: isOverseasPlayer(name),
                };
            })
            .filter((p) => p !== null)
            .sort((a, b) => b.avg - a.avg);
    } catch (e) {
        console.error("Data processing error:", e);
        return defaultDB;
    }
};

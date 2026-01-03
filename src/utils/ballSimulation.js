/**
 * ballSimulation.js - Ball outcome simulation logic
 * Extracted from useMatchEngine.js to separate simulation from state management
 * This allows for easier testing and reuse of simulation logic
 */

/**
 * Simulate a single ball outcome based on batsman and bowler stats
 * Uses player averages and strike rates to determine probabilities
 * 
 * @param {Object} batsman - Batsman object with avg, sr properties
 * @param {Object} bowler - Bowler object with bowlAvg, bowlEcon properties
 * @returns {string} Outcome: "0"|"1"|"2"|"3"|"4"|"6"|"W"|"Ex"
 */
export const simulateBallOutcome = (batsman, bowler) => {
    const batAvg = batsman?.avg || 30;
    const batSr = batsman?.sr || 130;
    const bowlAvg = bowler?.bowlAvg || 25;
    const bowlEcon = bowler?.bowlEcon || 8;

    const batFactor = batAvg / 35 + batSr / 130;
    const bowlFactor = 30 / bowlAvg + 9 / bowlEcon;
    const difficulty = bowlFactor / batFactor;

    let probs = {
        0: 30,
        1: 28,
        2: 6,
        3: 1,
        4: 12,
        6: 6,
        W: 4,
        Ex: 3,
    };

    // Adjust probabilities based on difficulty match-up
    if (difficulty > 1.1) {
        // Bowling is dominant
        probs[0] += 10;
        probs["W"] += 3;
        probs[4] -= 4;
        probs[6] -= 2;
    } else if (difficulty < 0.9) {
        // Batting is dominant
        probs[4] += 5;
        probs[6] += 5;
        probs[0] -= 8;
        probs[1] -= 2;
    }

    // Weighted random selection
    let total = Object.values(probs).reduce((a, b) => a + b, 0);
    let rand = Math.random() * total;
    let cumulative = 0;
    
    for (let outcome in probs) {
        cumulative += probs[outcome];
        if (rand <= cumulative) return outcome;
    }
    
    return "0"; // Default to dot ball
};

/**
 * Apply outcome to batsman stats
 */
export const applyOutcomeToBatsman = (stats, outcome, isFour = false, isSix = false) => {
    if (outcome === "W") {
        stats.out = true;
    } else if (outcome === "Ex") {
        // Extra ball - handled separately
    } else {
        stats.balls += 1;
        const runs = parseInt(outcome) || 0;
        stats.runs += runs;
        if (isFour) stats.fours += 1;
        if (isSix) stats.sixes += 1;
    }
    return stats;
};

/**
 * Apply outcome to bowler stats
 */
export const applyOutcomeToBowler = (stats, outcome) => {
    if (outcome !== "Ex") {
        stats.balls += 1;
        const runs = parseInt(outcome) || 0;
        stats.runs += runs;
        if (outcome === "W") stats.wickets += 1;
    }
    return stats;
};

/**
 * Calculate over progress percentage (0-100)
 */
export const getOverProgress = (ballsBowled) => {
    const ballsInOver = ballsBowled % 6;
    return (ballsInOver / 6) * 100;
};

/**
 * Check if over is complete
 */
export const isOverComplete = (ballsBowled) => {
    return (ballsBowled % 6) === 0 && ballsBowled > 0;
};

/**
 * Get next batter from team
 */
export const getNextBatter = (team, batsmanStats, previousBatterId) => {
    return team.players.find(p => {
        const id = p.instanceId || p.id;
        if (id === previousBatterId) return false;
        const stats = batsmanStats[id];
        return !stats.out && stats.balls === 0; // Not out and not yet batted
    });
};

/**
 * Get next bowler from team (cycle through bowlers)
 */
export const getNextBowler = (team, currentBowlerId, ballsBowled) => {
    // Rotate bowlers - one over per bowler
    const bowlerIndex = Math.floor(ballsBowled / 6) % team.players.length;
    return team.players[bowlerIndex];
};

/**
 * Format over.ball notation (e.g., "5.3" means 5 overs, 3 balls)
 */
export const formatOverNotation = (ballsBowled) => {
    const overs = Math.floor(ballsBowled / 6);
    const balls = ballsBowled % 6;
    return `${overs}.${balls}`;
};

export default {
    simulateBallOutcome,
    applyOutcomeToBatsman,
    applyOutcomeToBowler,
    getOverProgress,
    isOverComplete,
    getNextBatter,
    getNextBowler,
    formatOverNotation,
};

/**
 * commentary.js - Ball commentary generation
 * Extracted from useMatchEngine.js to separate text generation from simulation logic
 * Makes it easy to improve commentary without affecting game mechanics
 */

const COMMENTARY_TEMPLATES = {
  "0": [
    `${player} defended solidly.`,
    `A tight delivery from ${bowler}. ${player} blocks it away.`,
    `Good line bowling. Nothing for ${player} to get at.`,
  ],
  "1": [
    `${player} pushes forward for a single.`,
    `Off the mark! ${player} nudges it down for one.`,
    `Quick single taken by ${player}.`,
    `${player} gets off the mark with a single.`,
  ],
  "2": [
    `Driven through the gap! Two runs for ${player}.`,
    `Nice placement by ${player}, they come back for two.`,
    `Easy two for ${player} in the open field.`,
  ],
  "3": [
    `Good running! Three taken by ${player}.`,
    `Three more for ${player}! Excellent acceleration.`,
    `Boundary to boundary run for three.`,
  ],
  "4": [
    `CRACK! ${player} finds the rope for FOUR!`,
    `FOUR! Beautiful drive by ${player}!`,
    `Boundaries flowing now! ${player} hits another FOUR!`,
    `Excellent shot by ${player}, that's a deliberate four.`,
    `Streaky four! ${player} gets lucky with the willow.`,
  ],
  "6": [
    `MAXIMUM! ${player} sends it out of the park!`,
    `SIX! Over the boundary! What a shot by ${player}!`,
    `Towering six by ${player}! That's sailing away!`,
    `${player} takes on ${bowler}... SIX! Into the crowd!`,
  ],
  "W": [
    `GONE! ${player} is out, ${bowler} strikes!`,
    `WICKET! ${player} departs, ${bowler} gets the breakthrough!`,
    `OUT! ${player} has to walk back after ${bowler}'s brilliant delivery.`,
    `${bowler} draws the batsman out! ${player} is gone!`,
  ],
  "Ex": [
    `Wide! Wasted delivery from ${bowler}.`,
    `That's outside the line. Wide called!`,
    `Too wide from ${bowler}, extra run conceded.`,
    `The bowler overstepped. Free run to the batting side.`,
  ],
};

/**
 * Generate commentary text for a ball outcome
 * Randomly picks from template options and fills in player names
 * 
 * @param {string} outcome - Ball result: "0"|"1"|"2"|"3"|"4"|"6"|"W"|"Ex"
 * @param {Object} batsman - Batsman object with name property
 * @param {Object} bowler - Bowler object with name property
 * @param {number} ballsBowled - Total balls bowled in match
 * @returns {string} Commentary text
 */
export const getCommentaryText = (outcome, batsman, bowler, ballsBowled) => {
    const overStr = Math.floor(ballsBowled / 6) + "." + (ballsBowled % 6);
    const player = batsman?.name || "Batsman";
    const bowlerName = bowler?.name || "Bowler";

    console.log("🎾 Ball bowled:", { outcome, batsman: batsman?.name, bowler: bowler?.name }); // Debug

    const templates = COMMENTARY_TEMPLATES[outcome] || ["Play continues."];
    const selected = templates[Math.floor(Math.random() * templates.length)];
    
    // Replace placeholders
    let commentary = selected
        .replace(/\${player}/g, player)
        .replace(/\${bowler}/g, bowlerName);

    return `${overStr} - ${commentary}`;
};

/**
 * Get exciting commentary for milestone moments
 */
export const getMilestoneCommentary = (milestoneType, player, score = null) => {
    const templates = {
        fifty: [
            `🎯 FIFTY for ${player}! What an effort!`,
            `${player} reaches the half-century! Excellent innings!`,
            `FIFTY UP for ${player}! The crowd goes wild!`,
        ],
        century: [
            `🔥 CENTURY for ${player}! Outstanding!`,
            `A MAGNIFICENT HUNDRED from ${player}!`,
            `${player} brings up their century! What a performance!`,
        ],
        partnership: [
            `The partnership is building nicely between these two.`,
            `A solid partnership forming at the crease.`,
            `They're batting with real intent now.`,
        ],
    };

    const options = templates[milestoneType] || [];
    if (options.length === 0) return null;
    return options[Math.floor(Math.random() * options.length)];
};

/**
 * Get toss commentary
 */
export const getTossCommentary = (winner, loser, choice = "bat") => {
    const templates = {
        bat: [
            `${winner.name} have won the toss and decided to bat first.`,
            `Toss won by ${winner.name}. They choose to bat.`,
            `${winner.name} will open the innings.`,
        ],
        field: [
            `${winner.name} have won the toss and opted to field first.`,
            `${winner.name} will bowl first after winning the toss.`,
            `${loser.name} will open the batting.`,
        ],
    };

    const options = templates[choice] || [];
    if (options.length === 0) return `${winner.name} won the toss and chose to ${choice}.`;
    return options[Math.floor(Math.random() * options.length)];
};

/**
 * Get dismissal commentary with variation
 */
export const getDismissalCommentary = (batsman, bowler, dismissalType = "bowled") => {
    const templates = {
        bowled: [
            `Bowled! ${batsman} is done in by ${bowler}.`,
            `Castled! Perfect yorker from ${bowler}. ${batsman} has no answer.`,
            `${batsman} makes a complete mess of that. Bowled by ${bowler}!`,
        ],
        caught: [
            `Caught! ${batsman} couldn't control that delivery from ${bowler}.`,
            `Out caught! A soft dismissal for ${batsman}.`,
            `${bowler} gets the breakthrough. ${batsman} is caught out.`,
        ],
        lbw: [
            `LBW! ${batsman} is trapped in front by ${bowler}.`,
            `Plumb lbw! ${batsman} has no complaint there.`,
            `${bowler} draws out ${batsman}. That's lbw!`,
        ],
    };

    const options = templates[dismissalType] || templates["bowled"];
    return options[Math.floor(Math.random() * options.length)];
};

/**
 * Get match situation commentary based on scorecard state
 */
export const getMatchSituationCommentary = (innings1, innings2, battingTeam) => {
    if (!innings1 || !innings2) return null;

    const isChasing = innings2.teamId === battingTeam.id;
    const target = isChasing ? innings1.score : null;
    const currentScore = isChasing ? innings2.score : innings1.score;
    const needed = isChasing ? target - currentScore : null;

    if (!isChasing) {
        // Building first innings
        if (currentScore < 80) {
            return `${battingTeam.name} are struggling to get going here.`;
        } else if (currentScore < 150) {
            return `${battingTeam.name} are building a decent total.`;
        } else if (currentScore < 200) {
            return `${battingTeam.name} are posting a strong total here!`;
        } else {
            return `${battingTeam.name} are putting up a formidable total!`;
        }
    } else {
        // Chasing
        const runRate = (currentScore / innings2.overs).toFixed(1);
        const required = (needed / (20 - Math.floor(innings2.overs))).toFixed(1);

        if (needed <= 0) {
            return `${battingTeam.name} have CHASED IT DOWN!`;
        } else if (needed <= 30) {
            return `${battingTeam.name} are closing in! Needing ${needed} from ${6 - (Math.floor(innings2.overs * 6) % 6)} balls.`;
        } else if (required > runRate) {
            return `The asking rate is climbing. ${battingTeam.name} need ${needed} from ${20 - Math.floor(innings2.overs)} overs.`;
        } else {
            return `${battingTeam.name} have got this under control. Needing ${needed} from ${20 - Math.floor(innings2.overs)} overs.`;
        }
    }
};

export default {
    getCommentaryText,
    getMilestoneCommentary,
    getTossCommentary,
    getDismissalCommentary,
    getMatchSituationCommentary,
};

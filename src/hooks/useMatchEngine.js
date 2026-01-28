/**
 * @fileoverview Cricket match simulation engine using player statistics
 * @module useMatchEngine
 * @description Simulates ball-by-ball cricket matches with realistic outcomes based on player averages, strike rates, and bowling stats
 */

// src/hooks/useMatchEngine.js
import { useState } from "react";

// --- COMMENTARY & SIMULATION HELPERS ---

/**
 * Generate commentary text for a ball outcome
 * @param {string} outcome - Ball outcome code ('0', '1', '2', '3', '4', '6', 'W', 'Ex')
 * @param {Object} batsman - Batsman player object
 * @param {string} batsman.name - Batsman's name
 * @param {Object} bowler - Bowler player object
 * @param {string} bowler.name - Bowler's name
 * @param {number} ballsBowled - Total balls bowled in innings
 * @returns {string} Commentary text for the ball
 */
const getCommentaryText = (outcome, batsman, bowler, ballsBowled) => {
    const overStr =
        Math.floor(ballsBowled / 6) + "." + (ballsBowled % 6);

    console.log("🎾 Ball bowled:", { outcome, batsman: batsman.name, bowler: bowler.name }); // 🔍 Debug

    switch (outcome) {
        case "0":
            return `${overStr} - Defended solidly by ${batsman.name}.`;
        case "1":
            return `${overStr} - ${batsman.name} pushes for a single.`;
        case "2":
            return `${overStr} - Driven through the gap, they come back for two.`;
        case "3":
            return `${overStr} - Good running! Three taken.`;
        case "4":
            return `${overStr} - CRACK! ${batsman.name} finds the rope for FOUR!`;
        case "6":
            return `${overStr} - MAXIMUM! ${batsman.name} sends it out of the park!`;
        case "W":
            return `${overStr} - GONE! ${batsman.name} is out, ${bowler.name} strikes!`;
        case "Ex":
            return `${overStr} - Wide ball from ${bowler.name}.`;
        default:
            return `${overStr} - Play continues.`;
    }
};

/**
 * Simulate a single ball outcome based on player statistics
 * @param {Object} batsman - Batsman player object with avg, sr properties
 * @param {number} batsman.avg - Batting average
 * @param {number} batsman.sr - Strike rate
 * @param {Object} bowler - Bowler player object with bowlAvg, bowlEcon properties
 * @param {number} bowler.bowlAvg - Bowling average
 * @param {number} bowler.bowlEcon - Economy rate
 * @param {Object} [matchState] - Optional match state for phase adjustments
 * @param {number} matchState.ballsBowled - Balls bowled in current innings
 * @returns {string} Outcome code ('0', '1', '2', '3', '4', '6', 'W', 'Ex')
 * @description Uses batting average, strike rate, bowling average, and economy for realistic simulation
 */
// simple outcome using player averages (can be improved)
const simulateBallOutcome = (batsman, bowler, matchState = null) => {
    const batAvg = batsman?.avg || 30;
    const batSr = batsman?.sr || 130;
    const bowlAvg = bowler?.bowlAvg || 25;
    const bowlEcon = bowler?.bowlEcon || 8;
    
    // Determine if batsman is a power hitter (high SR)
    const isPowerHitter = batSr > 140;
    const isRegularBatsman = batAvg > 35 && batSr < 130;

    const batFactor = batAvg / 35 + batSr / 130;
    const bowlFactor = 30 / bowlAvg + 9 / bowlEcon;
    const difficulty = bowlFactor / batFactor;

    // Get match phase from state
    let ballsInInnings = 0;
    let oversPlayed = 0;
    if (matchState) {
      ballsInInnings = matchState.ballsBowled || 0;
      oversPlayed = Math.floor(ballsInInnings / 6);
    }

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

    // POWERPLAY PHASE (0-6 overs): Conservative batting
    if (oversPlayed < 6) {
      probs[0] += 8;      // More dots
      probs[1] -= 3;      // Fewer singles
      probs[4] -= 3;      // Fewer fours
      probs[6] -= 2;      // Fewer sixes
      
      if (isPowerHitter) {
        probs[4] += 5;    // Power hitters attack even in powerplay
        probs[6] += 2;
        probs[0] -= 5;
      }
    }
    // MIDDLE OVERS (7-15): Accumulation
    else if (oversPlayed >= 6 && oversPlayed < 16) {
      probs[1] += 2;
      probs[2] += 2;
      probs[4] += 2;
      
      if (isPowerHitter) {
        probs[4] += 3;
        probs[6] += 2;
        probs[0] -= 4;
      }
    }
    // DEATH OVERS (16-20): Aggressive batting
    else if (oversPlayed >= 16) {
      probs[4] += 8;      // More fours
      probs[6] += 6;      // More sixes
      probs[0] -= 8;      // Fewer dots
      probs[1] -= 3;
      probs[2] -= 2;
      
      if (isPowerHitter) {
        probs[6] += 5;    // Power hitters go for sixes
        probs[4] += 3;
        probs[0] -= 8;
        probs["W"] += 2;  // Higher risk
      } else if (isRegularBatsman) {
        probs["W"] += 3;  // Regular batsmen struggle in death
        probs[0] += 4;
      }
    }

    if (difficulty > 1.1) {
        probs[0] += 10;
        probs["W"] += 3;
        probs[4] -= 4;
        probs[6] -= 2;
    } else if (difficulty < 0.9) {
        probs[4] += 5;
        probs[6] += 5;
        probs[0] -= 8;
        probs[1] -= 2;
    }

    let total = Object.values(probs).reduce((a, b) => a + b, 0);
    let rand = Math.random() * total;
    let cumulative = 0;
    for (let outcome in probs) {
        cumulative += probs[outcome];
        if (rand <= cumulative) return outcome;
    }
    return "0";
};

const deepClone = (obj) => JSON.parse(JSON.stringify(obj));

// --- HOOK ---

export default function useMatchEngine() {
    const [matchState, setMatchState] = useState(null);

    // ---------- INITIALISE MATCH ----------

    const initStatsForTeams = (teamA, teamB) => {
        const batsmanStats = {};
        const bowlerStats = {};

        [...teamA.players, ...teamB.players].forEach((p) => {
            const id = p.instanceId || p.id;
            batsmanStats[id] = {
                runs: 0,
                balls: 0,
                fours: 0,
                sixes: 0,
                out: false,
            };
            bowlerStats[id] = {
                balls: 0,
                runs: 0,
                wickets: 0,
            };
        });

        return { batsmanStats, bowlerStats };
    };

    const startMatchInternal = (mode, teamA, teamB, fixtureId = null, playerName = null) => {
        if (!teamA || !teamB || !teamA.players?.length || !teamB.players?.length) {
            console.error("startMatchInternal: invalid teams");
            return;
        }

        const tossWin = Math.random() > 0.5 ? teamA : teamB;
        const batFirst = tossWin;
        const bowlFirst = tossWin.id === teamA.id ? teamB : teamA;

        const { batsmanStats, bowlerStats } = initStatsForTeams(
            teamA,
            teamB
        );

        const striker = batFirst.players[0];
        const nonStriker = batFirst.players[1] || batFirst.players[0];
        const bowler = bowlFirst.players[bowlFirst.players.length - 1];

        setMatchState({
            mode, // 'quick' or 'tourn'
            fixtureId,
            playerName: playerName || null, // Store player's entered name
            teamA, // Store team A reference
            teamB, // Store team B reference
            innings: 1,
            battingTeam: batFirst,
            bowlingTeam: bowlFirst,
            totalOvers: 20,
            score: 0,
            wickets: 0,
            ballsBowled: 0,
            thisOver: [],
            recentBalls: [],
            commentary: [
                `Match Started. ${tossWin.name} won the toss and elected to bat.`,
            ],
            target: null,
            batsmanStats,
            bowlerStats,
            strikerId: striker.instanceId || striker.id,
            nonStrikerId: nonStriker.instanceId || nonStriker.id,
            bowlerId: bowler.instanceId || bowler.id,
            isMatchOver: false,
            winner: null,
            impactPlayer: null,
            eventOverlay: null,
            innings1: null, // Will store { teamId, score, overs }
            innings2: null, // Will store { teamId, score, overs }
        });
    };

    // PUBLIC: quick match between teamA & teamB
    const startQuickMatch = (teamA, teamB, playerName = null) => {
        startMatchInternal("quick", teamA, teamB, null, playerName);
    };

    // PUBLIC: tournament match
    const startTournamentMatch = (fixtureId, teamA, teamB, playerName = null) => {
        startMatchInternal("tourn", teamA, teamB, fixtureId, playerName);
    };

    // ---------- CORE BALL SIM ----------

    // Calculate impact player based on batting and bowling performance
    const getImpactPlayer = (state) => {
        if (!state.batsmanStats || !state.bowlerStats) return null;

        let bestPlayer = null;
        let bestScore = -Infinity;

        // Check batsmen - impact based on runs and strike rate
        Object.entries(state.batsmanStats).forEach(([playerId, stats]) => {
            if (stats.balls > 0) {
                const strikeRate = (stats.runs / stats.balls) * 100;
                const impactScore = stats.runs + (strikeRate / 50); // Weight runs heavily
                if (impactScore > bestScore) {
                    bestScore = impactScore;
                    bestPlayer = { id: playerId, name: null, type: 'batsman', stats };
                }
            }
        });

        // Check bowlers - impact based on wickets and economy
        Object.entries(state.bowlerStats).forEach(([playerId, stats]) => {
            if (stats.balls > 0) {
                const overs = stats.balls / 6;
                const economy = stats.runs / overs;
                const impactScore = (stats.wickets * 50) - (economy * 5); // Wickets heavily weighted
                if (impactScore > bestScore) {
                    bestScore = impactScore;
                    bestPlayer = { id: playerId, name: null, type: 'bowler', stats };
                }
            }
        });

        // Get player name from teams
        if (bestPlayer) {
            const player = [...state.battingTeam.players, ...state.bowlingTeam.players].find(
                p => (p.instanceId || p.id) === bestPlayer.id
            );
            if (player) {
                bestPlayer.name = player.name;
            }
        }

        return bestPlayer;
    };

    const simulateOneBall = (prevState, showOverlay = true) => {
        if (!prevState || prevState.isMatchOver) return prevState;

        const state = deepClone(prevState);
        const { battingTeam, bowlingTeam } = state;

        const getPlayer = (id) => {
            if (!id) return null;
            return (
                battingTeam.players.find((p) => (p.instanceId || p.id) === id) ||
                bowlingTeam.players.find((p) => (p.instanceId || p.id) === id)
            );
        };

        const striker = getPlayer(state.strikerId);
        const bowler = getPlayer(state.bowlerId);

        if (!striker || !bowler) return state;

        const outcome = simulateBallOutcome(striker, bowler, state);
        let runs = 0;
        let isWicket = false;
        let extra = 0;

        if (outcome === "W") {
            isWicket = true;
        } else if (outcome === "Ex") {
            extra = 1; // wide
        } else {
            runs = parseInt(outcome, 10);
        }

        const batStats =
            state.batsmanStats[state.strikerId] || (state.batsmanStats[state.strikerId] = {
                runs: 0,
                balls: 0,
                fours: 0,
                sixes: 0,
                out: false,
            });

        const bowlStats =
            state.bowlerStats[state.bowlerId] || (state.bowlerStats[state.bowlerId] = {
                balls: 0,
                runs: 0,
                wickets: 0,
            });

        // apply stats
        if (!extra) {
            batStats.balls += 1;
            batStats.runs += runs;

            if (runs === 4) batStats.fours += 1;
            if (runs === 6) batStats.sixes += 1;

            bowlStats.balls += 1;
            bowlStats.runs += runs;
        } else {
            // wide
            bowlStats.runs += 1;
        }

        if (isWicket) {
            batStats.out = true;
            bowlStats.wickets += 1;

            const allOut = state.wickets >= state.battingTeam.players.length - 1;

            if (!allOut) {
                const outBatsmanId = state.strikerId;

                // Find the next available batsman who is not already in the match (striker/non-striker) and not out
                const nextBatsman = state.battingTeam.players.find(p => {
                    const pId = p.instanceId || p.id;
                    const isAlreadyPlaying = (pId === outBatsmanId || pId === state.nonStrikerId);
                    const isOut = state.batsmanStats[pId]?.out;
                    return !isAlreadyPlaying && !isOut;
                });

                if (nextBatsman) {
                    state.strikerId = nextBatsman.instanceId || nextBatsman.id;
                } else {
                     // This case should ideally not be reached if allOut check is correct, but as a fallback,
                     // let's check for any player who is not out, in case both striker/non-striker are the last men.
                     const lastManStanding = state.battingTeam.players.find(p => !state.batsmanStats[p.instanceId || p.id]?.out);
                     if(lastManStanding) {
                        state.strikerId = lastManStanding.instanceId || lastManStanding.id;
                     } else {
                        console.log("Could not find next batsman, even though not all out.");
                     }
                }
            }
        }

        state.score += runs + extra;
        if (isWicket) state.wickets += 1;
        if (!extra) state.ballsBowled += 1;

        // event overlay
        state.eventOverlay = null;
        if (showOverlay) {
            if (isWicket) {
                state.eventOverlay = { type: "WICKET", text: "WICKET" };
            } else if (runs === 4) {
                state.eventOverlay = { type: "FOUR", text: "FOUR" };
            } else if (runs === 6) {
                state.eventOverlay = { type: "SIX", text: "SIX" };
            }
        }

        // commentary
        const comm = getCommentaryText(
            outcome,
            striker,
            bowler,
            state.ballsBowled
        );
        state.commentary.push(comm);

        // recent balls
        state.recentBalls.push(isWicket ? "W" : outcome === "Ex" ? "Wd" : runs.toString());
        if (state.recentBalls.length > 12) state.recentBalls.shift();

        // rotate strike on odd runs (non-extra, non-wicket)
        if (!isWicket && !extra && runs % 2 === 1) {
            const tmp = state.strikerId;
            state.strikerId = state.nonStrikerId;
            state.nonStrikerId = tmp;
        }

        // end of over rotation
        if (!extra && state.ballsBowled > 0 && state.ballsBowled % 6 === 0) {
            const tmp = state.strikerId;
            state.strikerId = state.nonStrikerId;
            state.nonStrikerId = tmp;

            // rotate bowler among last 5 players of bowling team
            // Max 4 overs per bowler rule
            const bowlers = state.bowlingTeam.players.slice(-5);
            const currentBowler = state.bowlerId;
            const currentBowlerOvers = Math.floor((state.bowlerStats[currentBowler]?.balls || 0) / 6);
            
            // Find a bowler who hasn't bowled 4 overs yet (excluding current bowler if they've bowled 4)
            let nextBowler = null;
            for (const bowler of bowlers) {
                const bowlerId = bowler.instanceId || bowler.id;
                const oversForBowler = Math.floor((state.bowlerStats[bowlerId]?.balls || 0) / 6);
                // Don't allow bowler to continue if they've reached 4 overs
                if (oversForBowler < 4) {
                    nextBowler = bowler;
                    break;
                }
            }
            
            // If no bowler with <4 overs found, find anyone different from current
            if (!nextBowler) {
                nextBowler = bowlers.find((b) => (b.instanceId || b.id) !== currentBowler) || bowlers[0];
            }
            
            state.bowlerId = nextBowler.instanceId || nextBowler.id;

            state.thisOver = [];
        } else {
            // track ball in current over
            state.thisOver = state.thisOver || [];
            state.thisOver.push(isWicket ? "W" : outcome === "Ex" ? "Wd" : runs.toString());
        }

        // all out?
        const allOut =
            state.wickets >= state.battingTeam.players.length - 1;

        // chase logic
        if (state.innings === 2) {
            if (state.score > state.target) {
                state.isMatchOver = true;
                state.winner = state.battingTeam;
                state.impactPlayer = getImpactPlayer(state);
                state.innings2 = {
                    teamId: state.battingTeam.id,
                    score: state.score,
                    overs: state.ballsBowled / 6,
                    wickets: state.wickets
                };
                state.commentary.push(
                    `${state.battingTeam.name} win by ${
                        state.battingTeam.players.length - 1 - state.wickets
                    } wicket(s)!`
                );
            } else if (
                (state.ballsBowled >= state.totalOvers * 6 || allOut) &&
                state.score < state.target
            ) {
                state.isMatchOver = true;
                state.winner = state.bowlingTeam;
                state.impactPlayer = getImpactPlayer(state);
                state.innings2 = {
                    teamId: state.battingTeam.id,
                    score: state.score,
                    overs: state.ballsBowled / 6,
                    wickets: state.wickets
                };
                state.commentary.push(`${state.bowlingTeam.name} defend the total!`);
            } else if (
                (state.ballsBowled >= state.totalOvers * 6 || allOut) &&
                state.score === state.target
            ) {
                state.isMatchOver = true;
                state.winner = "Tie";
                state.innings2 = {
                    teamId: state.battingTeam.id,
                    score: state.score,
                    overs: state.ballsBowled / 6,
                    wickets: state.wickets
                };
                state.commentary.push(`Match tied!`);
            }
        } else if (
            state.innings === 1 &&
            (state.ballsBowled >= state.totalOvers * 6 || allOut)
        ) {
            // end of first innings; UI will handle "Start 2nd innings"
            state.commentary.push(
                `${state.battingTeam.name} finish on ${state.score}/${state.wickets}.`
            );
        }

        return state;
    };

    const runManyBalls = (prevState, count) => {
        if (!prevState) return prevState;
        let state = deepClone(prevState);
        for (let i = 0; i < count; i++) {
            if (!state || state.isMatchOver) break;
            state = simulateOneBall(state, false);
        }
        return state;
    };

    // ---------- PUBLIC ACTIONS ----------

    const bowlBall = () => {
        setMatchState((prev) => {
            if (!prev) return prev;
            const next = simulateOneBall(prev, true);
            if (next?.eventOverlay) {
                // auto-clear overlay
                setTimeout(() => {
                    setMatchState((current) => {
                        if (!current) return current;
                        return { ...current, eventOverlay: null };
                    });
                }, 2500);
            }
            return next;
        });
    };

    const skipOver = () => {
        setMatchState((prev) => {
            if (!prev) return prev;
            const ballsIntoOver = prev.ballsBowled % 6;
            const toBowl = ballsIntoOver === 0 ? 6 : 6 - ballsIntoOver;
            return runManyBalls(prev, toBowl);
        });
    };

    const skipFiveOvers = () => {
        setMatchState((prev) => runManyBalls(prev, 30));
    };

    const skipTenOvers = () => {
        setMatchState((prev) => runManyBalls(prev, 60));
    };

    const skipInnings = () => {
        setMatchState((prev) => {
            if (!prev) return prev;
            const remaining =
                prev.totalOvers * 6 - prev.ballsBowled;
            if (remaining <= 0) return prev;
            return runManyBalls(prev, remaining);
        });
    };

    const handleInningsBreak = () => {
        console.log("📋 handleInningsBreak called");
        setMatchState((prev) => {
            if (!prev) {
                console.log("⚠️ No previous match state");
                return prev;
            }

            const firstInningsScore = prev.score;
            const firstInningsOvers = prev.ballsBowled / 6;
            const newBat = prev.bowlingTeam;
            const newBowl = prev.battingTeam;

            const striker = newBat.players[0];
            const nonStriker = newBat.players[1] || newBat.players[0];
            const bowler =
                newBowl.players[newBowl.players.length - 1];

            const next = {
                ...prev,
                innings: 2,
                target: firstInningsScore,
                battingTeam: newBat,
                bowlingTeam: newBowl,
                score: 0,
                wickets: 0,
                innings1: {
                    teamId: prev.battingTeam.id,
                    score: firstInningsScore,
                    overs: firstInningsOvers,
                    wickets: prev.wickets
                },
                ballsBowled: 0,
                thisOver: [],
                recentBalls: [],
                strikerId: striker.instanceId || striker.id,
                nonStrikerId: nonStriker.instanceId || nonStriker.id,
                bowlerId: bowler.instanceId || bowler.id,
                // Preserve teamA and teamB for control logic
                teamA: prev.teamA,
                teamB: prev.teamB,
            };

            next.commentary = [
                ...prev.commentary,
                `Innings break. Target is ${firstInningsScore + 1}.`,
            ];

            console.log("✅ Innings switched to 2, new batting team:", next.battingTeam.name, "Target:", next.target + 1);
            return next;
        });
    };

    const resetMatch = () => {
        setMatchState(null);
    };

    const syncMatchState = (externalState) => {
        setMatchState(externalState);
    };

    // endMatch is handled by App via view state; we just expose matchState

    return {
        matchState,
        startQuickMatch,
        startTournamentMatch,
        bowlBall,
        skipOver,
        skipFiveOvers,
        skipTenOvers,
        skipInnings,
        handleInningsBreak,
        resetMatch,
        syncMatchState,
    };
}

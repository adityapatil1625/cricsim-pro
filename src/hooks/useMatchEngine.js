// src/hooks/useMatchEngine.js
import { useState } from "react";

// --- COMMENTARY & SIMULATION HELPERS ---

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

// simple outcome using player averages (can be improved)
const simulateBallOutcome = (batsman, bowler) => {
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

    const startMatchInternal = (mode, teamA, teamB, fixtureId = null) => {
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
            eventOverlay: null,
            innings1: null, // Will store { teamId, score, overs }
            innings2: null, // Will store { teamId, score, overs }
        });
    };

    // PUBLIC: quick match between teamA & teamB
    const startQuickMatch = (teamA, teamB) => {
        startMatchInternal("quick", teamA, teamB, null);
    };

    // PUBLIC: tournament match
    const startTournamentMatch = (fixtureId, teamA, teamB) => {
        startMatchInternal("tourn", teamA, teamB, fixtureId);
    };

    // ---------- CORE BALL SIM ----------

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

        const outcome = simulateBallOutcome(striker, bowler);
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
            const bowlers = state.bowlingTeam.players.slice(-5);
            const currentBowler = state.bowlerId;
            const nextBowler =
                bowlers.find((b) => (b.instanceId || b.id) !== currentBowler) || bowlers[0];
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
        setMatchState((prev) => {
            if (!prev) return prev;

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
            };

            next.commentary = [
                ...prev.commentary,
                `Innings break. Target is ${firstInningsScore + 1}.`,
            ];

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

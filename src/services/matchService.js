/**
 * @fileoverview Match storage and retrieval service
 * @module matchService
 * @description Handles saving and fetching cricket match data from Firestore
 */

import { db } from '../config/firebaseConfig';
import { collection, addDoc, query, where, getDocs, updateDoc, doc, orderBy, limit } from 'firebase/firestore';

/**
 * Save match to Firestore
 * @param {string} userId - User ID who created the match
 * @param {Object} matchData - Match information
 * @param {string} matchData.type - Match type (quick, tournament, auction)
 * @param {Object} matchData.teamA - Team A data
 * @param {Object} matchData.teamB - Team B data
 * @param {Object} matchData.matchState - Final match state
 * @param {number} matchData.duration - Match duration in seconds
 * @returns {Promise} Match ID
 * 
 * @example
 * const matchId = await matchService.saveMatch('user-123', {
 *   type: 'quick',
 *   teamA: { name: 'Team Alpha', score: 150 },
 *   teamB: { name: 'Team Beta', score: 145 },
 *   matchState: {...},
 *   duration: 3600
 * });
 */
export const saveMatch = async (userId, matchData) => {
  try {
    const docRef = await addDoc(collection(db, 'matches'), {
      userId,
      type: matchData.type,
      teamA: matchData.teamA,
      teamB: matchData.teamB,
      matchState: matchData.matchState,
      duration: matchData.duration,
      winner: matchData.teamA?.score > matchData.teamB?.score ? 'teamA' : 'teamB',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return docRef.id;
  } catch (error) {
    throw new Error(`Failed to save match: ${error.message}`);
  }
};

/**
 * Get user's match history
 * @param {string} userId - User ID
 * @param {number} [limitCount=10] - Number of matches to fetch
 * @returns {Promise} Array of match objects
 * 
 * @example
 * const matches = await matchService.getUserMatches('user-123', 20);
 */
export const getUserMatches = async (userId, limitCount = 10) => {
  try {
    const q = query(
      collection(db, 'matches'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const matches = [];

    querySnapshot.forEach((doc) => {
      matches.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return matches;
  } catch (error) {
    throw new Error(`Failed to fetch matches: ${error.message}`);
  }
};

/**
 * Get single match by ID
 * @param {string} matchId - Match ID
 * @returns {Promise} Match object
 * 
 * @example
 * const match = await matchService.getMatch('match-123');
 */
export const getMatch = async (matchId) => {
  try {
    const matchDoc = await getDoc(doc(db, 'matches', matchId));
    if (matchDoc.exists()) {
      return { id: matchDoc.id, ...matchDoc.data() };
    }
    return null;
  } catch (error) {
    throw new Error(`Failed to fetch match: ${error.message}`);
  }
};

/**
 * Save tournament to Firestore
 * @param {string} userId - Creator's user ID
 * @param {Object} tournData - Tournament information
 * @returns {Promise} Tournament ID
 * 
 * @example
 * const tournId = await matchService.saveTournament('user-123', {
 *   name: 'My Tournament',
 *   teams: [...],
 *   fixtures: [...],
 *   phase: 'league'
 * });
 */
export const saveTournament = async (userId, tournData) => {
  try {
    const docRef = await addDoc(collection(db, 'tournaments'), {
      userId,
      name: tournData.name,
      teams: tournData.teams,
      fixtures: tournData.fixtures,
      phase: tournData.phase,
      matches: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return docRef.id;
  } catch (error) {
    throw new Error(`Failed to save tournament: ${error.message}`);
  }
};

/**
 * Get user's tournaments
 * @param {string} userId - User ID
 * @param {number} [limitCount=10] - Number of tournaments to fetch
 * @returns {Promise} Array of tournament objects
 * 
 * @example
 * const tournaments = await matchService.getUserTournaments('user-123');
 */
export const getUserTournaments = async (userId, limitCount = 10) => {
  try {
    const q = query(
      collection(db, 'tournaments'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const tournaments = [];

    querySnapshot.forEach((doc) => {
      tournaments.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return tournaments;
  } catch (error) {
    throw new Error(`Failed to fetch tournaments: ${error.message}`);
  }
};

/**
 * Update tournament after match completion
 * @param {string} tournId - Tournament ID
 * @param {Object} updates - Updates to apply
 * @returns {Promise} Void
 * 
 * @example
 * await matchService.updateTournament('tourn-123', {
 *   phase: 'semi',
 *   matches: [...]
 * });
 */
export const updateTournament = async (tournId, updates) => {
  try {
    await updateDoc(doc(db, 'tournaments', tournId), {
      ...updates,
      updatedAt: new Date(),
    });
  } catch (error) {
    throw new Error(`Failed to update tournament: ${error.message}`);
  }
};

export default {
  saveMatch,
  getUserMatches,
  getMatch,
  saveTournament,
  getUserTournaments,
  updateTournament,
};

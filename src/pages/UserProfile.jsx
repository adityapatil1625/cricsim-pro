/**
 * @component UserProfile - Display user account info and match statistics
 * @description Show user profile, stats, and match history with logout option
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import matchService from '../services/matchService';

const UserProfile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        navigate('/auth');
        return;
      }

      setUser(currentUser);

      // Load user profile
      const userProfile = await authService.getUserProfile(currentUser.uid);
      setProfile(userProfile);

      // Load recent matches
      const userMatches = await matchService.getUserMatches(currentUser.uid, 10);
      setMatches(userMatches);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate('/auth');
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const stats = profile || { wins: 0, matches: 0, winRate: 0 };

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-emerald-900/20 via-slate-950 to-slate-950" />
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-brand-gold/10 rounded-full blur-[128px]" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="font-broadcast text-3xl text-white">My Account</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition"
          >
            Logout
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
            {error}
          </div>
        )}

        {/* Profile Card */}
        <div
          className="rounded-2xl p-6 border border-slate-700/50 mb-8"
          style={{
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-slate-400 text-sm mb-1">Email</p>
              <p className="text-white font-semibold">{user.email}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm mb-1">Display Name</p>
              <p className="text-white font-semibold">{user.displayName || 'Not set'}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm mb-1">Member Since</p>
              <p className="text-white font-semibold">
                {new Date(user.metadata.creationTime).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div
            className="rounded-2xl p-6 border border-emerald-700/30"
            style={{
              background: 'linear-gradient(135deg, rgba(5, 46, 22, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)',
            }}
          >
            <p className="text-emerald-400 text-sm mb-2">MATCHES PLAYED</p>
            <p className="text-3xl font-bold text-white">{stats.matches || 0}</p>
          </div>

          <div
            className="rounded-2xl p-6 border border-brand-gold/30"
            style={{
              background: 'linear-gradient(135deg, rgba(70, 54, 0, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)',
            }}
          >
            <p className="text-brand-gold text-sm mb-2">WINS</p>
            <p className="text-3xl font-bold text-white">{stats.wins || 0}</p>
          </div>

          <div
            className="rounded-2xl p-6 border border-blue-700/30"
            style={{
              background: 'linear-gradient(135deg, rgba(7, 33, 66, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)',
            }}
          >
            <p className="text-blue-400 text-sm mb-2">WIN RATE</p>
            <p className="text-3xl font-bold text-white">
              {stats.matches ? Math.round((stats.wins / stats.matches) * 100) : 0}%
            </p>
          </div>
        </div>

        {/* Match History */}
        <div
          className="rounded-2xl p-6 border border-slate-700/50"
          style={{
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <h2 className="text-xl font-bold text-white mb-4">Recent Matches</h2>

          {matches.length === 0 ? (
            <p className="text-slate-400 text-center py-8">No matches played yet</p>
          ) : (
            <div className="space-y-3">
              {matches.map((match) => (
                <div
                  key={match.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700/30"
                >
                  <div>
                    <p className="font-semibold text-white">
                      {match.team1} vs {match.team2}
                    </p>
                    <p className="text-sm text-slate-400">
                      {new Date(match.timestamp?.toDate?.() || match.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-bold ${
                        match.winner === match.team1 ? 'text-emerald-400' : 'text-slate-400'
                      }`}
                    >
                      {match.team1}: {match.team1Runs}
                    </p>
                    <p
                      className={`font-bold ${
                        match.winner === match.team2 ? 'text-emerald-400' : 'text-slate-400'
                      }`}
                    >
                      {match.team2}: {match.team2Runs}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;

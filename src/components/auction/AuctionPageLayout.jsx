/**
 * AuctionPageLayout.jsx
 * Complete IPL Auction page layout with all zones
 * Wraps AuctionRoom with header, sidebars, controls, and analytics
 */

import React, { useState, useCallback } from 'react';
import AuctionRoom from './AuctionRoom';
import AuctionHeader from './AuctionHeader';
import BidHistorySidebar from './BidHistorySidebar';
import TeamsOverviewPanel from './TeamsOverviewPanel';
import MySquadPanel from './MySquadPanel';
import AdminControls from './AdminControls';
import AuctionAnalytics from './AuctionAnalytics';
import AuctionAlerts from './AuctionAlerts';
import { getSetById } from '../../data/playerPoolV2';

const AuctionPageLayout = (props) => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showTeamsPanel, setShowTeamsPanel] = useState(true);
  const [bidHistory, setBidHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [displayTeams, setDisplayTeams] = useState(props.teams || []);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [queue, setQueue] = useState([]);
  const [fullQueue, setFullQueue] = useState([]);
  const [auctionLog, setAuctionLog] = useState([]);

  // Simulate data load stabilization
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // Handle teams update from AuctionRoom
  const handleTeamsUpdate = useCallback((updatedTeams) => {
    setDisplayTeams(updatedTeams);
  }, []);

  // Handle player and queue updates from AuctionRoom
  const handlePlayerUpdate = useCallback((player, q, fullQ) => {
    setCurrentPlayer(player);
    setQueue(q);
    setFullQueue(fullQ);
  }, []);

  // Handle auction log updates from AuctionRoom
  const handleAuctionLogUpdate = useCallback((log) => {
    setAuctionLog(log);
  }, []);

  // Intercept bid placements to track history
  const handleBidHistory = (bid) => {
    setBidHistory(prev => [
      {
        teamId: props.myTeamId,
        teamName: displayTeams?.find(t => t.id === props.myTeamId)?.name,
        bid,
        timestamp: new Date(),
      },
      ...prev.slice(0, 49), // Keep last 50 bids
    ]);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col relative">
      {/* Header */}
      <AuctionHeader
        season="IPL 2026"
        type="Mega Auction"
        isLive={props.isOnline}
        soundEnabled={soundEnabled}
        onSoundToggle={() => setSoundEnabled(!soundEnabled)}
      />

      {/* Main Content Area - With smooth fade-in to prevent jitter */}
      <div
        className={`flex-1 flex flex-col lg:flex-row gap-4 p-4 overflow-hidden transition-opacity duration-300 ${
          isLoading ? 'opacity-50' : 'opacity-100'
        }`}
        style={{
          pointerEvents: isLoading ? 'none' : 'auto',
        }}
      >
        {/* Left Sidebar - Bid History + Auction Log */}
        <div className="hidden xl:flex xl:w-72 flex-col gap-3 max-h-[calc(100vh-49px)]">
          {/* Bid History - Fixed height */}
          <div className="glass-panel rounded-2xl p-0 bg-slate-950/50 border border-slate-700 h-72 flex-shrink-0 min-h-0 overflow-hidden flex flex-col">
            <BidHistorySidebar bids={bidHistory} teams={displayTeams || []} />
          </div>
          
          {/* Auction Log - Takes remaining space */}
          <div className="glass-panel rounded-2xl p-0 bg-slate-950/50 border border-slate-700 flex-1 min-h-0 overflow-hidden flex flex-col">
            <h4 className="text-xs font-bold text-white px-4 py-3 border-b border-slate-700 bg-slate-900/50 flex-shrink-0">📜 Auction Log</h4>
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 p-3">
              {auctionLog.length > 0 ? (
                auctionLog.map((entry, i) => (
                  <div
                    key={i}
                    className={`text-[10px] p-1 rounded ${
                      entry.type === 'sold'
                        ? 'bg-green-500/20 text-green-400'
                        : entry.type === 'unsold'
                        ? 'bg-red-500/20 text-red-400'
                        : entry.type === 'bid'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-slate-800/50 text-slate-300'
                    }`}
                  >
                    {entry.message}
                  </div>
                ))
              ) : (
                <div className="text-center text-slate-500 text-xs py-1">
                  No activity yet...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Center - Main Auction Room */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto custom-scrollbar">
          <AuctionRoom
            {...props}
            onBidPlaced={handleBidHistory}
            onTeamsUpdate={handleTeamsUpdate}
            onPlayerUpdate={handlePlayerUpdate}
            onAuctionLogUpdate={handleAuctionLogUpdate}
          />
        </div>

        {/* Right Sidebar - Teams & Analytics */}
        <div className="hidden lg:flex lg:w-96 flex-col gap-4 h-full max-h-[calc(100vh-28px)] overflow-y-auto custom-scrollbar">
          {/* Teams Overview - Flexible height */}
          <div className="flex-shrink-0">
            <TeamsOverviewPanel
              teams={displayTeams || []}
              onTeamSelect={(team) => console.log('Selected team:', team)}
            />
          </div>

          {/* My Squad Panel */}
          {displayTeams && props.myTeamId && (
            <div className="flex-shrink-0 min-h-[480px]">
              <MySquadPanel
                team={displayTeams.find(t => t.id === props.myTeamId)}
              />
            </div>
          )}

          {/* Admin Controls - Host only */}
          {props.isOnline && props.myTeamId && (
            <AdminControls
              isHost={props.isOnlineHost || false}
              auctionPhase={props.auctionPhase || 'ready'}
              onStart={() => {
                if (props.socket) {
                  props.socket.emit('startAuction', { code: props.onlineRoom?.code });
                }
              }}
              onSkip={() => console.log('Skip player')}
              onUndo={() => console.log('Undo last action')}
            />
          )}

          {/* Current Team Alerts */}
          {displayTeams && props.myTeamId && (
            <AuctionAlerts
              team={displayTeams.find(t => t.id === props.myTeamId)}
              currentBid={props.currentBid || 0}
              nextBidAmount={(props.currentBid || 0) + 10}
            />
          )}
        </div>
      </div>

      {/* Bottom - Analytics & Insights */}
      <div className="px-4 py-3 border-t border-slate-800 bg-slate-900/50 overflow-x-auto">
        <AuctionAnalytics
          teams={displayTeams || []}
          soldPlayers={props.soldPlayers || []}
          currentPlayer={currentPlayer}
          queue={queue}
          fullQueue={fullQueue}
          getSetById={getSetById}
        />
      </div>

      {/* Loading Overlay - Smooth transition */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm z-50">
          <div className="text-center">
            <div className="inline-block mb-4">
              <div className="w-12 h-12 border-3 border-slate-700 border-t-brand-gold rounded-full animate-spin"></div>
            </div>
            <div className="text-slate-300 font-semibold text-sm">Loading Auction...</div>
          </div>
        </div>
      )}

      {/* Mobile Bid History - Bottom Drawer */}
      <div className="xl:hidden sticky bottom-0 max-h-32 bg-slate-900 border-t border-slate-800">
        <div className="px-4 py-2 text-xs font-bold text-slate-300 uppercase">
          📊 Recent Bids
        </div>
        <div className="flex gap-2 px-4 pb-2 overflow-x-auto">
          {bidHistory.slice(0, 5).map((bid, idx) => (
            <div key={idx} className="flex-shrink-0 bg-slate-800 px-3 py-1 rounded text-xs">
              <div className="text-slate-400">{bid.teamName}</div>
              <div className="text-brand-gold font-bold">₹{bid.bid}L</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AuctionPageLayout;

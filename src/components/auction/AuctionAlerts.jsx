/**
 * AuctionAlerts.jsx
 * Validation alerts and notifications for auction constraints
 */

import React from 'react';
import { formatAuctionPrice } from '../../utils/auctionUtils';

const AuctionAlerts = ({ team = null, nextBidAmount = 0 }) => {
  if (!team) return null;

  const alerts = [];

  // Check purse
  if (team.purse < nextBidAmount) {
    alerts.push({
      type: 'error',
      icon: '💸',
      message: `Purse insufficient: ${formatAuctionPrice(team.purse)} available, ${formatAuctionPrice(nextBidAmount)} required`,
    });
  } else if (team.purse < nextBidAmount * 1.2) {
    alerts.push({
      type: 'warning',
      icon: '⚠️',
      message: `Low purse: Only ${formatAuctionPrice(team.purse)} left`,
    });
  }

  // Check squad size
  if (team.squad && team.squad.length >= 25) {
    alerts.push({
      type: 'error',
      icon: '👥',
      message: 'Squad full: Maximum 25 players reached',
    });
  } else if (team.squad && team.squad.length >= 23) {
    alerts.push({
      type: 'warning',
      icon: '👥',
      message: `Squad near full: ${team.squad.length}/25 players`,
    });
  }

  // Check overseas limit
  if (team.overseasCount >= 8) {
    alerts.push({
      type: 'error',
      icon: '🌍',
      message: 'Overseas limit reached: 8/8 players',
    });
  }

  if (alerts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {alerts.map((alert, idx) => (
        <div
          key={idx}
          className={`flex items-start gap-3 p-3 rounded-lg border ${
            alert.type === 'error'
              ? 'bg-red-900/20 border-red-700/50 text-red-300'
              : alert.type === 'warning'
              ? 'bg-yellow-900/20 border-yellow-700/50 text-yellow-300'
              : alert.type === 'success'
              ? 'bg-emerald-900/20 border-emerald-700/50 text-emerald-300'
              : 'bg-blue-900/20 border-blue-700/50 text-blue-300'
          }`}
        >
          <span className="text-lg flex-shrink-0">{alert.icon}</span>
          <p className="text-xs leading-relaxed flex-1">
            {alert.message}
          </p>
        </div>
      ))}
    </div>
  );
};

export default AuctionAlerts;

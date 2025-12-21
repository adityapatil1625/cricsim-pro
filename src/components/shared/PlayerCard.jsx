// components/shared/PlayerCard.jsx
import React from 'react';
import { Plus } from './Icons';

const PlayerCard = ({ player, onAdd }) => (
    <div className="glass-card rounded-lg p-3 flex items-center justify-between gap-3 cursor-pointer group hover:bg-slate-800/50 border-l-2 border-transparent hover:border-l-brand-gold">
        <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-100 text-base truncate pr-2 font-broadcast tracking-wide text-lg">
                    {player.name}
                </h4>
                <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border ${
                        player.role === 'Bat'
                            ? 'border-blue-500/50 text-blue-400 bg-blue-500/10'
                            : player.role === 'Bowl'
                                ? 'border-red-500/50 text-red-400 bg-red-500/10'
                                : 'border-purple-500/50 text-purple-400 bg-purple-500/10'
                    }`}
                >
          {player.role}
        </span>
            </div>
            <div className="flex gap-4 text-xs text-slate-400 font-mono mt-1">
        <span>
          Avg: <span className="text-white">{player.avg}</span>
        </span>
                <span>
          SR: <span className="text-white">{player.sr}</span>
        </span>
                {player.role !== 'Bat' && (
                    <span>
            Econ: <span className="text-white">{player.bowlEcon}</span>
          </span>
                )}
            </div>
        </div>
        {onAdd && (
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onAdd(player);
                }}
                className="bg-white/5 hover:bg-green-600 text-white p-2 rounded-lg transition-all hover:scale-110 border border-white/10"
            >
                <Plus size={16} />
            </button>
        )}
    </div>
);

export default PlayerCard;

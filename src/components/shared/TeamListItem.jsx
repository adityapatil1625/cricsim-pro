// components/shared/TeamListItem.jsx
import React from 'react';
import { X } from './Icons';
import { getInitials } from '../../data/cricketProcessing';

const TeamListItem = ({ player, onRemove }) => (
    <div className="flex justify-between items-center bg-slate-900/60 p-2.5 rounded border border-white/5 mb-2 group hover:border-white/20 transition-colors">
        <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-6 h-6 rounded flex items-center justify-center bg-slate-800 text-[10px] font-bold text-slate-400 border border-slate-700 group-hover:border-brand-gold group-hover:text-brand-gold transition-colors">
                {getInitials(player.name)}
            </div>
            <span className="font-medium text-sm text-slate-200 truncate font-broadcast tracking-wide">
        {player.name}
      </span>
        </div>
        {onRemove && (
            <button
                onClick={onRemove}
                className="text-slate-500 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <X size={14} />
            </button>
        )}
    </div>
);

export default TeamListItem;

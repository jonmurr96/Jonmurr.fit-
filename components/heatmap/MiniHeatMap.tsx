import React from 'react';
import { HeatMapDay, ActivityLevel } from '../../services/database/heatMapService';

interface MiniHeatMapProps {
    days: HeatMapDay[];
    onDayClick?: (day: HeatMapDay) => void;
    showLegend?: boolean;
}

const getActivityColor = (level: ActivityLevel): string => {
    switch (level) {
        case 'perfect': return 'bg-gradient-to-br from-purple-500 to-pink-500';
        case 'complete': return 'bg-green-500';
        case 'moderate': return 'bg-orange-500';
        case 'low': return 'bg-red-500';
        case 'rest': return 'bg-blue-500';
        case 'none': return 'bg-zinc-800';
        default: return 'bg-zinc-800';
    }
};

const getActivityLabel = (level: ActivityLevel): string => {
    switch (level) {
        case 'perfect': return 'Perfect';
        case 'complete': return 'Complete';
        case 'moderate': return 'Moderate';
        case 'low': return 'Low';
        case 'rest': return 'Rest Day';
        case 'none': return 'No Activity';
        default: return 'Unknown';
    }
};

const getActivityEmoji = (level: ActivityLevel): string => {
    switch (level) {
        case 'perfect': return '💎';
        case 'complete': return '🟢';
        case 'moderate': return '🟠';
        case 'low': return '🔴';
        case 'rest': return '🟦';
        case 'none': return '⚫';
        default: return '⚫';
    }
};

export const MiniHeatMap: React.FC<MiniHeatMapProps> = ({ days, onDayClick, showLegend = true }) => {
    const today = new Date().toISOString().split('T')[0];

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-zinc-400">Activity Heat Map</h3>
                {showLegend && (
                    <div className="flex items-center gap-1 text-xs text-zinc-500">
                        <span>⚫</span>
                        <span>🔴</span>
                        <span>🟠</span>
                        <span>🟢</span>
                        <span>💎</span>
                    </div>
                )}
            </div>

            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-2">
                {days.map((day) => {
                    const isToday = day.date === today;
                    const date = new Date(day.date);
                    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' });
                    const dayOfMonth = date.getDate();

                    return (
                        <button
                            key={day.date}
                            onClick={() => onDayClick?.(day)}
                            className={`
                                flex flex-col items-center gap-1 min-w-[48px] group
                                ${onDayClick ? 'cursor-pointer' : 'cursor-default'}
                            `}
                            aria-label={`${dayOfWeek} ${dayOfMonth}: ${getActivityLabel(day.level)}`}
                        >
                            {/* Day label */}
                            <span className={`
                                text-[10px] font-medium
                                ${isToday ? 'text-green-400' : 'text-zinc-500'}
                            `}>
                                {dayOfWeek}
                            </span>

                            {/* Activity square */}
                            <div className={`
                                w-10 h-10 rounded-lg
                                ${getActivityColor(day.level)}
                                ${onDayClick ? 'group-hover:scale-110 group-active:scale-95' : ''}
                                transition-all duration-200
                                ${isToday ? 'ring-2 ring-green-400 ring-offset-2 ring-offset-zinc-950' : ''}
                                flex items-center justify-center text-lg
                            `}>
                                {day.level === 'perfect' && '💎'}
                            </div>

                            {/* Date */}
                            <span className={`
                                text-[10px] font-medium
                                ${isToday ? 'text-green-400' : 'text-zinc-500'}
                            `}>
                                {dayOfMonth}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Legend (expanded) */}
            {showLegend && (
                <div className="flex flex-wrap gap-3 text-xs text-zinc-500">
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-zinc-800"></div>
                        <span>None</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-red-500"></div>
                        <span>Low</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-orange-500"></div>
                        <span>Moderate</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-green-500"></div>
                        <span>Complete</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-gradient-to-br from-purple-500 to-pink-500"></div>
                        <span>Perfect 💎</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-blue-500"></div>
                        <span>Rest</span>
                    </div>
                </div>
            )}
        </div>
    );
};

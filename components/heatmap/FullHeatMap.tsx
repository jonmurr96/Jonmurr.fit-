import React, { useState } from 'react';
import { HeatMapDay, ActivityLevel } from '../../services/database/heatMapService';
import { ChevronLeftIcon, ChevronRightIcon } from '../Icons';
import { DayDetailModal } from './DayDetailModal';

interface FullHeatMapProps {
  days: HeatMapDay[];
  onMonthChange?: (year: number, month: number) => void;
}

type FilterType = 'all' | 'workouts' | 'meals' | 'water';

const getColorClasses = (day: HeatMapDay, filter: FilterType): string => {
  if (!day || day.level === 'none') return 'bg-zinc-800 border-zinc-700';
  
  const hasWorkout = day.workout_logged;
  const hasMeal = day.meals_logged >= 2;
  const hasWater = day.water_goal_met;

  if (filter === 'workouts' && !hasWorkout) return 'bg-zinc-800 border-zinc-700';
  if (filter === 'meals' && !hasMeal) return 'bg-zinc-800 border-zinc-700';
  if (filter === 'water' && !hasWater) return 'bg-zinc-800 border-zinc-700';

  if (day.is_rest_day) return 'bg-blue-500/40 border-blue-400';
  if (day.level === 'perfect') return 'bg-gradient-to-br from-purple-500 to-pink-500 border-purple-400 shadow-lg shadow-purple-500/50';
  if (day.level === 'complete') return 'bg-green-500/80 border-green-400';
  if (day.level === 'moderate') return 'bg-green-500/60 border-green-500';
  if (day.level === 'low') return 'bg-orange-500/60 border-orange-400';
  if (day.level === 'rest') return 'bg-blue-500/40 border-blue-400';
  
  return 'bg-zinc-800 border-zinc-700';
};

export const FullHeatMap: React.FC<FullHeatMapProps> = ({ days, onMonthChange }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedDay, setSelectedDay] = useState<HeatMapDay | null>(null);

  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const goToPreviousMonth = () => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    setCurrentMonth(newDate);
    onMonthChange?.(newDate.getFullYear(), newDate.getMonth() + 1);
  };

  const goToNextMonth = () => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    setCurrentMonth(newDate);
    onMonthChange?.(newDate.getFullYear(), newDate.getMonth() + 1);
  };

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const startDayOfWeek = firstDay.getDay();
    const totalDays = lastDay.getDate();
    
    const calendarDays: (HeatMapDay | null)[] = [];
    
    for (let i = 0; i < startDayOfWeek; i++) {
      calendarDays.push(null);
    }
    
    for (let day = 1; day <= totalDays; day++) {
      const dateStr = new Date(year, month, day).toISOString().split('T')[0];
      const dayData = days.find(d => d.date === dateStr);
      
      calendarDays.push(dayData || {
        date: dateStr,
        level: 'none' as ActivityLevel,
        workout_logged: false,
        meals_logged: 0,
        water_intake_oz: 0,
        water_goal_met: false,
        hit_macros: false,
        hit_protein_goal: false,
        is_rest_day: false
      });
    }
    
    return calendarDays;
  };

  const calendarDays = generateCalendarDays();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={goToPreviousMonth}
          className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </button>
        
        <h3 className="text-xl font-bold">{monthName}</h3>
        
        <button
          onClick={goToNextMonth}
          className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors"
          aria-label="Next month"
        >
          <ChevronRightIcon className="w-5 h-5" />
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
            filter === 'all'
              ? 'bg-green-500 text-black'
              : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
          }`}
        >
          All Activity
        </button>
        <button
          onClick={() => setFilter('workouts')}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
            filter === 'workouts'
              ? 'bg-blue-500 text-black'
              : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
          }`}
        >
          Workouts
        </button>
        <button
          onClick={() => setFilter('meals')}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
            filter === 'meals'
              ? 'bg-orange-500 text-black'
              : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
          }`}
        >
          Meals
        </button>
        <button
          onClick={() => setFilter('water')}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
            filter === 'water'
              ? 'bg-cyan-500 text-black'
              : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
          }`}
        >
          Water
        </button>
      </div>

      <div className="bg-zinc-900 rounded-2xl p-6">
        <div className="grid grid-cols-7 gap-2 mb-2">
          {weekDays.map(day => (
            <div key={day} className="text-center text-xs font-semibold text-zinc-400">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((day, index) => {
            if (!day) {
              return <div key={`empty-${index}`} className="aspect-square" />;
            }

            const colorClasses = getColorClasses(day, filter);
            const dateNum = new Date(day.date).getDate();
            const isToday = day.date === new Date().toISOString().split('T')[0];

            return (
              <button
                key={day.date}
                onClick={() => setSelectedDay(day)}
                className={`
                  aspect-square rounded-lg border-2 flex items-center justify-center
                  text-sm font-semibold transition-all duration-200
                  hover:scale-110 hover:z-10
                  ${colorClasses}
                  ${isToday ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-zinc-900' : ''}
                `}
                aria-label={`View activity for ${day.date}`}
              >
                {dateNum}
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-zinc-800 border-2 border-zinc-700" />
            <span className="text-zinc-400">No activity</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500/60 border-2 border-red-400" />
            <span className="text-zinc-400">1 type</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-orange-500/60 border-2 border-orange-400" />
            <span className="text-zinc-400">2 types</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500/60 border-2 border-green-500" />
            <span className="text-zinc-400">All 3</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gradient-to-br from-purple-500 to-pink-500 border-2 border-purple-400" />
            <span className="text-zinc-400">Perfect day</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-500/40 border-2 border-blue-400" />
            <span className="text-zinc-400">Rest day</span>
          </div>
        </div>
      </div>

      {selectedDay && (
        <DayDetailModal day={selectedDay} onClose={() => setSelectedDay(null)} />
      )}
    </div>
  );
};

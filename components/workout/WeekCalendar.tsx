import React from 'react';

interface WeekCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  workoutDates?: string[]; // ISO date strings of days with workouts
}

export const WeekCalendar: React.FC<WeekCalendarProps> = ({
  selectedDate,
  onDateSelect,
  workoutDates = [],
}) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get the current week (Monday-Sunday)
  const getWeekDays = (date: Date): Date[] => {
    const days: Date[] = [];
    const current = new Date(date);
    
    // Find Monday of current week
    const dayOfWeek = current.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Handle Sunday
    current.setDate(current.getDate() + diff);
    
    // Get all 7 days
    for (let i = 0; i < 7; i++) {
      const day = new Date(current);
      day.setDate(current.getDate() + i);
      days.push(day);
    }
    
    return days;
  };

  const weekDays = getWeekDays(selectedDate);

  const getDayAbbreviation = (date: Date): string => {
    return date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
  };

  const isSameDay = (date1: Date, date2: Date): boolean => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  const hasWorkout = (date: Date): boolean => {
    const dateStr = date.toISOString().split('T')[0];
    return workoutDates.includes(dateStr);
  };

  return (
    <div className="flex items-center justify-around px-2 py-3 bg-zinc-950 rounded-xl gap-1">
      {weekDays.map((date, index) => {
        const isToday = isSameDay(date, today);
        const isSelected = isSameDay(date, selectedDate);
        const hasWorkoutDay = hasWorkout(date);
        const dayNum = date.getDate();
        const dayAbbr = getDayAbbreviation(date);

        return (
          <button
            key={index}
            onClick={() => onDateSelect(date)}
            className={`
              flex flex-col items-center justify-center
              rounded-lg p-2 min-w-[48px]
              transition-all duration-200
              ${isSelected
                ? 'bg-green-500 text-black scale-105'
                : isToday
                ? 'bg-zinc-800 text-white ring-2 ring-green-500/30'
                : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white'
              }
              ${hasWorkoutDay && !isSelected ? 'ring-2 ring-blue-500/30' : ''}
            `}
          >
            <span className={`text-xs font-bold ${isSelected ? 'text-black' : 'text-zinc-500'}`}>
              {dayAbbr}
            </span>
            <span className={`text-lg font-bold mt-1 ${isSelected ? 'text-black' : ''}`}>
              {dayNum}
            </span>
            {hasWorkoutDay && !isSelected && (
              <div className="w-1 h-1 bg-green-400 rounded-full mt-1"></div>
            )}
          </button>
        );
      })}
    </div>
  );
};

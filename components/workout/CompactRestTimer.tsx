import React, { useState, useEffect, useRef } from 'react';

interface CompactRestTimerProps {
  defaultDuration?: number;
  onComplete?: () => void;
  autoStart?: boolean;
  onDurationChange?: (seconds: number) => void;
}

const PRESET_DURATIONS = [
  { label: '30s', seconds: 30 },
  { label: '1m', seconds: 60 },
  { label: '2m', seconds: 120 },
  { label: '3m', seconds: 180 },
  { label: '5m', seconds: 300 },
];

export const CompactRestTimer: React.FC<CompactRestTimerProps> = ({
  defaultDuration = 120,
  onComplete,
  autoStart = false,
  onDurationChange,
}) => {
  const [duration, setDuration] = useState(defaultDuration);
  const [timeRemaining, setTimeRemaining] = useState(defaultDuration);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const presetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoStart) {
      setIsRunning(true);
    }
  }, [autoStart]);

  useEffect(() => {
    setDuration(defaultDuration);
    setTimeRemaining(defaultDuration);
    setIsCompleted(false);
  }, [defaultDuration]);

  useEffect(() => {
    if (isRunning && timeRemaining > 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsCompleted(true);
            if (navigator.vibrate) {
              navigator.vibrate([200, 100, 200]);
            }
            onComplete?.();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, timeRemaining, onComplete]);

  // Close presets when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (presetRef.current && !presetRef.current.contains(event.target as Node)) {
        setShowPresets(false);
      }
    };

    if (showPresets) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showPresets]);

  const handleTimerClick = () => {
    if (timeRemaining === 0) {
      // Reset to default duration
      setTimeRemaining(duration);
      setIsCompleted(false);
      setIsRunning(true);
    } else {
      // Toggle play/pause
      setIsRunning(!isRunning);
    }
  };

  const handlePresetClick = (seconds: number) => {
    setDuration(seconds);
    setTimeRemaining(seconds);
    setIsCompleted(false);
    setIsRunning(false);
    setShowPresets(false);
    onDurationChange?.(seconds);
  };

  const progress = duration > 0 ? (timeRemaining / duration) * 100 : 0;
  const radius = 14;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    return `${secs}`;
  };

  return (
    <div className="relative" ref={presetRef}>
      {/* Compact Timer Ring */}
      <div className="relative group">
        <button
          onClick={handleTimerClick}
          onContextMenu={(e) => {
            e.preventDefault();
            setShowPresets(!showPresets);
          }}
          className="relative flex-shrink-0 focus:outline-none"
          title="Click to start/pause, right-click for presets"
        >
          <svg width="36" height="36" className="transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="18"
              cy="18"
              r={radius}
              stroke="#27272a"
              strokeWidth="3"
              fill="none"
            />
            {/* Progress circle */}
            <circle
              cx="18"
              cy="18"
              r={radius}
              stroke={isCompleted ? '#10b981' : isRunning ? '#22c55e' : '#52525b'}
              strokeWidth="3"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          
          {/* Timer Display */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className={`text-[9px] font-bold ${
              isCompleted ? 'text-green-500' : 
              isRunning ? 'text-white' : 
              'text-zinc-500'
            }`}>
              {formatTime(timeRemaining)}
            </span>
          </div>
        </button>

        {/* Settings Icon (appears on hover) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowPresets(!showPresets);
          }}
          className="absolute -bottom-1 -right-1 w-4 h-4 bg-zinc-700 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none"
          title="Rest duration presets"
        >
          <svg className="w-2.5 h-2.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      {/* Preset Duration Dropdown */}
      {showPresets && (
        <div className="absolute top-full right-0 mt-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-50 py-1 min-w-[120px]">
          <div className="px-2 py-1 text-xs font-semibold text-zinc-400 border-b border-zinc-700">
            Rest Duration
          </div>
          {PRESET_DURATIONS.map((preset) => (
            <button
              key={preset.seconds}
              onClick={() => handlePresetClick(preset.seconds)}
              className={`w-full px-3 py-1.5 text-left text-sm transition-colors ${
                duration === preset.seconds
                  ? 'bg-green-500/20 text-green-400 font-semibold'
                  : 'text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              {preset.label}
            </button>
          ))}
          
          {/* Reset Button */}
          {timeRemaining !== duration && (
            <>
              <div className="border-t border-zinc-700 my-1"></div>
              <button
                onClick={() => {
                  setTimeRemaining(duration);
                  setIsCompleted(false);
                  setIsRunning(false);
                  setShowPresets(false);
                }}
                className="w-full px-3 py-1.5 text-left text-sm text-zinc-400 hover:bg-zinc-700 transition-colors"
              >
                Reset Timer
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

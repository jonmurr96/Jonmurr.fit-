import React, { useState, useEffect, useRef } from 'react';

interface RestTimerProps {
  defaultDuration?: number;
  onComplete?: () => void;
  autoStart?: boolean;
  className?: string;
  onDurationChange?: (seconds: number) => void;
}

const PRESET_DURATIONS = [
  { label: '30s', seconds: 30 },
  { label: '1m', seconds: 60 },
  { label: '2m', seconds: 120 },
  { label: '3m', seconds: 180 },
  { label: '5m', seconds: 300 },
];

export const RestTimer: React.FC<RestTimerProps> = ({
  defaultDuration = 120,
  onComplete,
  autoStart = false,
  className = '',
  onDurationChange,
}) => {
  const [duration, setDuration] = useState(defaultDuration);
  const [timeRemaining, setTimeRemaining] = useState(defaultDuration);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [customInput, setCustomInput] = useState('');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const collapseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (autoStart) {
      setIsRunning(true);
    }

    return () => {
      if (collapseTimeoutRef.current) {
        clearTimeout(collapseTimeoutRef.current);
        collapseTimeoutRef.current = null;
      }
    };
  }, [autoStart]);

  useEffect(() => {
    setDuration(defaultDuration);
    setTimeRemaining(defaultDuration);
    setIsCompleted(false);
  }, [defaultDuration]);

  useEffect(() => {
    if (isRunning && timeRemaining > 0) {
      setIsExpanded(true); // Auto-expand when running
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
            collapseTimeoutRef.current = setTimeout(() => {
              setIsExpanded(false);
            }, 3000);
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

  const handleStart = () => {
    if (collapseTimeoutRef.current) {
      clearTimeout(collapseTimeoutRef.current);
      collapseTimeoutRef.current = null;
    }
    if (timeRemaining === 0) {
      setTimeRemaining(duration);
      setIsCompleted(false);
    }
    setIsRunning(true);
    setIsExpanded(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleStop = () => {
    if (collapseTimeoutRef.current) {
      clearTimeout(collapseTimeoutRef.current);
      collapseTimeoutRef.current = null;
    }
    setIsRunning(false);
    setTimeRemaining(duration);
    setIsCompleted(false);
  };

  const handleSkip = () => {
    if (collapseTimeoutRef.current) {
      clearTimeout(collapseTimeoutRef.current);
    }
    setIsRunning(false);
    setTimeRemaining(0);
    setIsCompleted(true);
    onComplete?.();
    collapseTimeoutRef.current = setTimeout(() => {
      setIsExpanded(false);
    }, 3000);
  };

  const handlePresetClick = (seconds: number) => {
    setDuration(seconds);
    setTimeRemaining(seconds);
    setIsCompleted(false);
    setIsRunning(false);
    setCustomInput('');
    onDurationChange?.(seconds);
  };

  const handleCustomDurationSubmit = () => {
    const seconds = parseInt(customInput, 10);
    if (!isNaN(seconds) && seconds > 0 && seconds <= 600) {
      setDuration(seconds);
      setTimeRemaining(seconds);
      setIsCompleted(false);
      setIsRunning(false);
      onDurationChange?.(seconds);
    }
    setCustomInput('');
  };

  const progress = duration > 0 ? (timeRemaining / duration) * 100 : 0;
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isExpanded) {
    return (
      <div className={`bg-zinc-800 rounded-lg p-2 ${className}`}>
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full flex items-center justify-between text-sm text-zinc-400 hover:text-white transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-zinc-600'}`}></div>
            <span>Rest Timer: {formatTime(timeRemaining)}</span>
          </div>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className={`bg-zinc-800 rounded-lg p-3 ${className}`}>
      {/* Header with minimize button */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-zinc-400">REST TIMER</span>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-zinc-500 hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
      </div>

      <div className="flex items-center gap-3">
        {/* Circular Progress Timer */}
        <div className="relative flex-shrink-0">
          <svg width="80" height="80" className="transform -rotate-90">
            <circle
              cx="40"
              cy="40"
              r={radius}
              stroke="#27272a"
              strokeWidth="6"
              fill="none"
            />
            <circle
              cx="40"
              cy="40"
              r={radius}
              stroke={isCompleted ? '#10b981' : isRunning ? '#22c55e' : '#71717a'}
              strokeWidth="6"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className={`text-lg font-bold ${isCompleted ? 'text-green-500' : 'text-white'}`}>
              {formatTime(timeRemaining)}
            </div>
          </div>
        </div>

        {/* Controls and Presets */}
        <div className="flex-1 flex flex-col gap-2">
          {/* Control Buttons */}
          <div className="flex gap-1.5">
            {!isRunning ? (
              <button
                onClick={handleStart}
                className="flex-1 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                {timeRemaining === 0 ? 'Restart' : 'Start'}
              </button>
            ) : (
              <button
                onClick={handlePause}
                className="flex-1 px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                Pause
              </button>
            )}
            <button
              onClick={handleStop}
              className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Reset
            </button>
            <button
              onClick={handleSkip}
              className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Skip
            </button>
          </div>

          {/* Preset Duration Buttons */}
          <div className="flex gap-1.5">
            {PRESET_DURATIONS.map((preset) => (
              <button
                key={preset.seconds}
                onClick={() => handlePresetClick(preset.seconds)}
                disabled={isRunning}
                className={`
                  flex-1 px-2 py-1 rounded text-xs font-semibold transition-all
                  ${duration === preset.seconds
                    ? 'bg-green-500 text-white'
                    : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                  }
                  ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Custom Duration Input */}
          <div className="flex gap-1.5">
            <input
              type="number"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCustomDurationSubmit()}
              disabled={isRunning}
              placeholder="Custom (sec)"
              className={`
                flex-1 px-2 py-1 rounded text-xs bg-zinc-700 border border-zinc-600
                text-white placeholder-zinc-500 focus:border-green-500 focus:outline-none
                ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              min="1"
              max="600"
            />
            <button
              onClick={handleCustomDurationSubmit}
              disabled={isRunning || !customInput}
              className={`
                px-3 py-1 rounded text-xs font-semibold transition-colors
                ${isRunning || !customInput
                  ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
                }
              `}
            >
              Set
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

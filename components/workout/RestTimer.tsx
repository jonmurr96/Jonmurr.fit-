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
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

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
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeRemaining, onComplete]);

  const handleStart = () => {
    if (timeRemaining === 0) {
      setTimeRemaining(duration);
      setIsCompleted(false);
    }
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleStop = () => {
    setIsRunning(false);
    setTimeRemaining(duration);
    setIsCompleted(false);
  };

  const handleSkip = () => {
    setIsRunning(false);
    setTimeRemaining(0);
    setIsCompleted(true);
    onComplete?.();
  };

  const handlePresetClick = (seconds: number) => {
    setDuration(seconds);
    setTimeRemaining(seconds);
    setIsCompleted(false);
    setIsRunning(false);
    onDurationChange?.(seconds);
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

  return (
    <div className={`bg-zinc-800 rounded-lg p-3 ${className}`}>
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
        </div>
      </div>
    </div>
  );
};

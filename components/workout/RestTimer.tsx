import React, { useState, useEffect, useRef } from 'react';

interface RestTimerProps {
  isOpen: boolean;
  onClose: () => void;
  initialDuration?: number; // seconds
  onComplete?: () => void;
}

export const RestTimer: React.FC<RestTimerProps> = ({
  isOpen,
  onClose,
  initialDuration = 45,
  onComplete,
}) => {
  const [duration, setDuration] = useState(initialDuration);
  const [timeRemaining, setTimeRemaining] = useState(initialDuration);
  const [isRunning, setIsRunning] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDuration(initialDuration);
      setTimeRemaining(initialDuration);
      setIsRunning(true);
    }
  }, [isOpen, initialDuration]);

  useEffect(() => {
    if (!isOpen || !isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          onComplete?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isOpen, isRunning, onComplete]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const adjustTime = (adjustment: number) => {
    setTimeRemaining((prev) => Math.max(0, prev + adjustment));
    setDuration((prev) => Math.max(0, prev + adjustment));
  };

  const skip = () => {
    setIsRunning(false);
    onClose();
  };

  const togglePause = () => {
    setIsRunning((prev) => !prev);
  };

  if (!isOpen) return null;

  const progress = duration > 0 ? ((duration - timeRemaining) / duration) * 100 : 0;
  const circumference = 2 * Math.PI * 90;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-zinc-900 rounded-2xl p-8 w-full max-w-md border border-zinc-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-white">Rest Timer</h2>
          <p className="text-sm text-zinc-400 mt-1">
            Take a break and get ready for your next set
          </p>
        </div>

        {/* Circular Progress */}
        <div className="relative flex items-center justify-center mb-8">
          <svg className="w-64 h-64 transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="128"
              cy="128"
              r="90"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              className="text-zinc-800"
            />
            {/* Progress circle */}
            <circle
              cx="128"
              cy="128"
              r="90"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="text-blue-500 transition-all duration-300"
              strokeLinecap="round"
            />
          </svg>

          {/* Time Display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-6xl font-bold text-white">
              {formatTime(timeRemaining)}
            </div>
            <div className="text-lg text-zinc-400 mt-2">
              {formatTime(duration)}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <button
            onClick={() => adjustTime(-30)}
            className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-semibold text-white transition-colors"
          >
            -30s
          </button>
          
          <button
            onClick={togglePause}
            className="px-8 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-semibold text-white transition-colors"
          >
            {isRunning ? 'Pause' : 'Resume'}
          </button>

          <button
            onClick={() => adjustTime(30)}
            className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-semibold text-white transition-colors"
          >
            +30s
          </button>
        </div>

        {/* Skip Button */}
        <button
          onClick={skip}
          className="w-full py-3 bg-blue-500 hover:bg-blue-600 rounded-lg font-bold text-white transition-colors"
        >
          Skip
        </button>
      </div>
    </div>
  );
};

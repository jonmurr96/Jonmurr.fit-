import React, { useEffect, useRef } from 'react';

interface XPToastProps {
  amount: number;
  reason: string;
  onDismiss: () => void;
  duration?: number;
}

export const XPToast: React.FC<XPToastProps> = ({ amount, reason, onDismiss, duration = 3000 }) => {
  const dismissRef = useRef(onDismiss);
  
  useEffect(() => {
    dismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    const timer = setTimeout(() => {
      dismissRef.current();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration]);

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-slide-down">
      <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-full shadow-lg flex items-center space-x-3">
        <div className="text-2xl">⚡</div>
        <div>
          <div className="font-bold text-lg">+{amount} XP</div>
          <div className="text-sm opacity-90">{reason}</div>
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useRef } from 'react';
import { useScrollSpy } from './ScrollSpyContext';

interface ProgressSectionProps {
  id: string;
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultCollapsed?: boolean;
}

export const ProgressSection: React.FC<ProgressSectionProps> = ({
  id,
  label,
  icon,
  children,
  defaultCollapsed = false
}) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { registerSection, unregisterSection } = useScrollSpy();

  useEffect(() => {
    if (sectionRef.current) {
      registerSection(id, sectionRef.current, label, icon);
    }
    
    return () => {
      unregisterSection(id);
    };
  }, [id, label, icon, registerSection, unregisterSection]);

  return (
    <div
      ref={sectionRef}
      data-section-id={id}
      className="scroll-mt-40"
    >
      <div className="mb-3">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          {icon}
          {label}
        </h2>
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
};

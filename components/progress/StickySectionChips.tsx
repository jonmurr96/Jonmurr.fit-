import React from 'react';
import { useScrollSpy } from './ScrollSpyContext';
import { 
  ListIcon, 
  ChartBarIconOutline, 
  CameraIcon, 
  WaterDropIcon, 
  FireIcon, 
  TrophyIcon 
} from '../Icons';

const sections = [
  { id: 'summary', label: 'Summary', icon: <ListIcon className="w-4 h-4" /> },
  { id: 'weight', label: 'Weight', icon: <ChartBarIconOutline className="w-4 h-4" /> },
  { id: 'water', label: 'Water', icon: <WaterDropIcon className="w-4 h-4" /> },
  { id: 'heatmap', label: 'Activity', icon: <FireIcon className="w-4 h-4" /> },
  { id: 'photos', label: 'Photos', icon: <CameraIcon className="w-4 h-4" /> },
  { id: 'achievements', label: 'Rewards', icon: <TrophyIcon className="w-4 h-4" /> },
];

export const StickySectionChips: React.FC = () => {
  const { activeSection, scrollToSection } = useScrollSpy();

  return (
    <div className="sticky top-0 z-30 bg-zinc-950/95 backdrop-blur-sm pb-4 -mx-4 px-4 pt-4">
      <div className="flex flex-wrap gap-2 justify-center">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => scrollToSection(section.id)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold
              transition-all duration-200 transform
              ${activeSection === section.id 
                ? 'bg-green-500 text-black shadow-lg shadow-green-500/30 scale-105' 
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:scale-105'
              }
            `}
          >
            {section.icon}
            <span className="hidden sm:inline">{section.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

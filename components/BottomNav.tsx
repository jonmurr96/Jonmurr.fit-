import React from 'react';
import { Screen } from '../types';
import {
  HomeIconOutline, HomeIconSolid,
  DumbbellIcon, DumbbellIconSolid,
  UtensilsIcon, UtensilsSolidIcon,
  ChartBarIconOutline, ChartBarIconSolid,
  SparklesIcon, SparklesIconSolid,
} from './Icons';

interface BottomNavProps {
  activeScreen: Screen;
  setActiveScreen: (screen: Screen) => void;
}

const navItems = [
  { screen: 'home' as Screen, label: 'Home', icon: { outline: HomeIconOutline, solid: HomeIconSolid } },
  { screen: 'train' as Screen, label: 'Train', icon: { outline: DumbbellIcon, solid: DumbbellIconSolid } },
  { screen: 'log' as Screen, label: 'Log', icon: { outline: UtensilsIcon, solid: UtensilsSolidIcon } },
  { screen: 'progress' as Screen, label: 'Progress', icon: { outline: ChartBarIconOutline, solid: ChartBarIconSolid } },
  { screen: 'coach' as Screen, label: 'Coach', icon: { outline: SparklesIcon, solid: SparklesIconSolid } },
];

const NavItem: React.FC<{
  item: typeof navItems[0];
  isActive: boolean;
  onClick: () => void;
}> = ({ item, isActive, onClick }) => {
  const Icon = isActive ? item.icon.solid : item.icon.outline;
  
  const activeColor = 'text-green-400';
  const inactiveColor = 'text-zinc-500';

  return (
    <button
      onClick={onClick}
      className="relative flex flex-col items-center justify-center w-full h-full transition-colors duration-300 group focus:outline-none"
      aria-label={item.label}
    >
      <div className={`absolute top-0 w-8 h-1 bg-green-400 rounded-b-full transition-all duration-300 ease-in-out ${isActive ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'}`} style={{ boxShadow: '0 0 10px #34d399' }}/>

      <div className={`transition-transform duration-300 ease-in-out ${isActive ? 'scale-110' : 'group-hover:scale-105'}`}>
         <Icon className={`w-7 h-7 mb-1 transition-all duration-300 ease-in-out ${isActive ? `${activeColor} active-glow` : `${inactiveColor} group-hover:text-zinc-300`}`} />
      </div>

      <span className={`text-xs font-medium transition-all duration-300 ease-in-out ${isActive ? activeColor : `${inactiveColor} opacity-80 group-hover:opacity-100`}`}>
        {item.label}
      </span>
    </button>
  );
};

export const BottomNav: React.FC<BottomNavProps> = ({ activeScreen, setActiveScreen }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-20 bg-zinc-900 border-t border-zinc-800 flex justify-around items-center max-w-lg mx-auto">
      {navItems.map((item) => (
        <NavItem
          key={item.screen}
          item={item}
          isActive={activeScreen === item.screen}
          onClick={() => setActiveScreen(item.screen)}
        />
      ))}
    </nav>
  );
};
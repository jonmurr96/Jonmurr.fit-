
import React from 'react';
import { Screen } from '../types';
import { HomeIcon, DumbbellIcon, UtensilsIcon, ChartLineIcon, TrophyIcon } from './Icons';

interface BottomNavProps {
  activeScreen: Screen;
  setActiveScreen: (screen: Screen) => void;
}

const navItems = [
  { screen: 'home' as Screen, label: 'Home', icon: HomeIcon },
  { screen: 'train' as Screen, label: 'Train', icon: DumbbellIcon },
  { screen: 'log' as Screen, label: 'Log', icon: UtensilsIcon },
  { screen: 'analytics' as Screen, label: 'Stats', icon: TrophyIcon },
  { screen: 'progress' as Screen, label: 'Progress', icon: ChartLineIcon },
];

const NavItem: React.FC<{
  item: typeof navItems[0];
  isActive: boolean;
  onClick: () => void;
}> = ({ item, isActive, onClick }) => {
  const Icon = item.icon;
  const activeColor = 'text-green-400';
  const inactiveColor = 'text-zinc-500';

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center w-full h-full transition-colors duration-200"
    >
      <Icon className={`w-6 h-6 mb-1 ${isActive ? activeColor : inactiveColor}`} />
      <span className={`text-xs font-medium ${isActive ? activeColor : inactiveColor}`}>
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

import React from 'react';
import { Home, ShoppingBag, MapPin, User } from 'lucide-react';

export const BottomNav: React.FC<{
  currentTab: string;
  onTabChange: (tab: string) => void;
}> = ({ currentTab, onTabChange }) => {
  const tabs = [
    { id: 'home', label: 'Shop', icon: Home },
    { id: 'cart', label: 'Cart', icon: ShoppingBag },
    { id: 'areas', label: 'Areas', icon: MapPin },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30 flex items-center justify-around py-2">
      {tabs.map((t) => {
        const Icon = t.icon;
        const active = currentTab === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onTabChange(t.id)}
            className={`flex flex-col items-center gap-0.5 text-xs ${
              active ? 'text-emerald-700 font-bold' : 'text-gray-500'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
};

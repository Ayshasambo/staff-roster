import React from 'react';
import { Calendar, Users, FileText, BarChart3 } from 'lucide-react';

export default function BottomNav({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'roster', label: 'Roster', icon: Calendar },
    { id: 'staff', label: 'Staff', icon: Users },
    { id: 'leaves', label: 'Leaves', icon: FileText },
    { id: 'analytics', label: 'Stats', icon: BarChart3 },
  ];

  return (
    <nav className="mobile-bottom-nav">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            className={`mobile-nav-btn ${isActive ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            aria-label={tab.label}
          >
            <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

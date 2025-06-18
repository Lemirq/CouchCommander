"use client";

import { useState } from "react";

interface Tab {
  id: string;
  label: string;
  icon: string;
}

interface NavigationTabsProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export default function NavigationTabs({
  activeTab,
  onTabChange,
}: NavigationTabsProps) {
  const tabs: Tab[] = [
    {
      id: "media",
      label: "Media",
      icon: "🎵",
    },
    {
      id: "trackpad",
      label: "Trackpad",
      icon: "👆",
    },
    {
      id: "keyboard",
      label: "Keyboard",
      icon: "⌨️",
    },
    {
      id: "websites",
      label: "Websites",
      icon: "🌐",
    },
  ];

  return (
    <div className="glass-card rounded-2xl p-3 shadow-2xl mb-6">
      <div className="flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex-1 flex flex-col items-center justify-center p-4 rounded-xl transition-all min-h-[72px]
              ${
                activeTab === tab.id
                  ? "bg-hulu-green text-hulu-black shadow-lg border-glow-active font-semibold"
                  : "text-hulu-text-gray hover:bg-hulu-gray hover:text-hulu-white btn-secondary"
              }
            `}
          >
            <span className="text-2xl mb-2">{tab.icon}</span>
            <span className="text-sm font-medium">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

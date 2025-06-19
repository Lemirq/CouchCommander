"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Music, Hand, Keyboard, Globe } from "lucide-react";

interface NavigationTabsProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function NavigationTabs({
  activeTab,
  onTabChange,
}: NavigationTabsProps) {
  const tabs = [
    {
      id: "media",
      label: "Media",
      icon: Music,
    },
    {
      id: "trackpad",
      label: "Trackpad",
      icon: Hand,
    },
    {
      id: "keyboard",
      label: "Keyboard",
      icon: Keyboard,
    },
    {
      id: "websites",
      label: "Websites",
      icon: Globe,
    },
  ];

  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="mb-6">
      <TabsList className="grid w-full grid-cols-4 h-auto p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="flex flex-col gap-2 py-3 px-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{tab.label}</span>
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}

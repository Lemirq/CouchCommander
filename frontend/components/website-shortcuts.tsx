"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Globe, Search, Folder, ExternalLink } from "lucide-react";

interface WebsiteShortcut {
  name: string;
  url: string;
  icon: string;
  color: string;
}

interface WebsiteShortcutsProps {
  onOpenWebsite: (url: string) => void;
  isConnected: boolean;
}

export function WebsiteShortcuts({
  onOpenWebsite,
  isConnected,
}: WebsiteShortcutsProps) {
  const [customUrl, setCustomUrl] = useState("");

  const predefinedWebsites: WebsiteShortcut[] = [
    {
      name: "Netflix",
      url: "https://www.netflix.com",
      icon: "🎬",
      color: "bg-red-600 hover:bg-red-700 text-white",
    },
    {
      name: "YouTube",
      url: "https://www.youtube.com",
      icon: "📺",
      color: "bg-red-700 hover:bg-red-800 text-white",
    },
    {
      name: "Crunchyroll",
      url: "https://www.crunchyroll.com",
      icon: "🍜",
      color: "bg-orange-600 hover:bg-orange-700 text-white",
    },
    {
      name: "Disney+",
      url: "https://www.disneyplus.com",
      icon: "🏰",
      color: "bg-blue-700 hover:bg-blue-800 text-white",
    },
    {
      name: "Hulu",
      url: "https://www.hulu.com",
      icon: "🌊",
      color: "bg-green-600 hover:bg-green-700 text-white",
    },
    {
      name: "Prime Video",
      url: "https://www.primevideo.com",
      icon: "📦",
      color: "bg-blue-600 hover:bg-blue-700 text-white",
    },
    {
      name: "HBO Max",
      url: "https://www.hbomax.com",
      icon: "👑",
      color: "bg-purple-700 hover:bg-purple-800 text-white",
    },
    {
      name: "Twitch",
      url: "https://www.twitch.tv",
      icon: "🎮",
      color: "bg-purple-600 hover:bg-purple-700 text-white",
    },
  ];

  const handleWebsiteClick = (url: string) => {
    if (!isConnected) return;
    onOpenWebsite(url);
  };

  const handleCustomUrl = () => {
    if (!isConnected || !customUrl.trim()) return;

    let url = customUrl.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }

    onOpenWebsite(url);
    setCustomUrl("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Website Shortcuts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Custom URL Input */}
        <div className="space-y-2">
          <Label htmlFor="custom-url">Custom URL</Label>
          <div className="flex gap-2">
            <Input
              id="custom-url"
              type="text"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="Enter website URL or search term..."
              onKeyPress={(e) => e.key === "Enter" && handleCustomUrl()}
              disabled={!isConnected}
            />
            <Button
              onClick={handleCustomUrl}
              disabled={!isConnected || !customUrl.trim()}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Enter a URL or search term to open in default browser
          </p>
        </div>

        {/* Predefined Website Grid */}
        <div className="grid grid-cols-2 gap-3">
          {predefinedWebsites.map((website) => (
            <Button
              key={website.name}
              onClick={() => handleWebsiteClick(website.url)}
              disabled={!isConnected}
              variant="outline"
              className={`h-20 flex-col gap-2 ${
                isConnected ? website.color : ""
              }`}
            >
              <span className="text-2xl">{website.icon}</span>
              <span className="text-sm font-medium">{website.name}</span>
            </Button>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold">Quick Actions</h4>
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={() => handleWebsiteClick("https://www.google.com")}
              disabled={!isConnected}
              variant="outline"
              className="h-16 flex items-center gap-2"
            >
              <Search className="h-5 w-5" />
              Google Search
            </Button>
            <Button
              onClick={() => onOpenWebsite("file:///")}
              disabled={!isConnected}
              variant="outline"
              className="h-16 flex items-center gap-2"
            >
              <Folder className="h-5 w-5" />
              File Explorer
            </Button>
          </div>
        </div>

        {/* Usage Tips */}
        <div className="p-3 bg-muted rounded-lg">
          <div className="text-sm text-muted-foreground">
            <strong className="text-foreground">💡 Tips:</strong>
            <div className="mt-2 space-y-1">
              <div>• Click any service to open in your default browser</div>
              <div>• Enter custom URLs in the search box above</div>
              <div>• URLs without http:// will automatically add https://</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

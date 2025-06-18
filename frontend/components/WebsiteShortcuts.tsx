'use client';

import { useState } from 'react';

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

export default function WebsiteShortcuts({
  onOpenWebsite,
  isConnected
}: WebsiteShortcutsProps) {
  const [customUrl, setCustomUrl] = useState('');

  const predefinedWebsites: WebsiteShortcut[] = [
    {
      name: 'Netflix',
      url: 'https://www.netflix.com',
      icon: '🎬',
      color: 'bg-red-500 hover:bg-red-600'
    },
    {
      name: 'YouTube',
      url: 'https://www.youtube.com',
      icon: '📺',
      color: 'bg-red-600 hover:bg-red-700'
    },
    {
      name: 'Crunchyroll',
      url: 'https://www.crunchyroll.com',
      icon: '🍜',
      color: 'bg-orange-500 hover:bg-orange-600'
    },
    {
      name: 'Disney+',
      url: 'https://www.disneyplus.com',
      icon: '🏰',
      color: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      name: 'Hulu',
      url: 'https://www.hulu.com',
      icon: '🌊',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      name: 'Prime Video',
      url: 'https://www.primevideo.com',
      icon: '📦',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      name: 'HBO Max',
      url: 'https://www.hbomax.com',
      icon: '👑',
      color: 'bg-purple-600 hover:bg-purple-700'
    },
    {
      name: 'Twitch',
      url: 'https://www.twitch.tv',
      icon: '🎮',
      color: 'bg-purple-500 hover:bg-purple-600'
    }
  ];

  const handleWebsiteClick = (url: string) => {
    if (!isConnected) return;
    onOpenWebsite(url);
  };

  const handleCustomUrl = () => {
    if (!isConnected || !customUrl.trim()) return;

    let url = customUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    onOpenWebsite(url);
    setCustomUrl('');
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        🌐 Website Shortcuts
      </h3>

      {/* Custom URL Input */}
      <div className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            placeholder="Enter website URL or search term..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
            onKeyPress={(e) => e.key === 'Enter' && handleCustomUrl()}
            disabled={!isConnected}
          />
          <button
            onClick={handleCustomUrl}
            disabled={!isConnected || !customUrl.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm"
          >
            Open
          </button>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Enter a URL or search term to open in default browser
        </div>
      </div>

      {/* Predefined Website Grid */}
      <div className="grid grid-cols-2 gap-3">
        {predefinedWebsites.map((website) => (
          <button
            key={website.name}
            onClick={() => handleWebsiteClick(website.url)}
            disabled={!isConnected}
            className={`
              flex flex-col items-center justify-center p-4 rounded-xl transition-all
              ${isConnected
                ? `${website.color} text-white active:scale-95 shadow-md`
                : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
              }
            `}
          >
            <span className="text-2xl mb-2">{website.icon}</span>
            <span className="text-sm font-medium">{website.name}</span>
          </button>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Quick Actions</h4>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleWebsiteClick('https://www.google.com')}
            disabled={!isConnected}
            className={`
              flex items-center justify-center p-3 rounded-lg transition-all text-sm
              ${isConnected
                ? 'bg-gray-100 hover:bg-gray-200 active:scale-95'
                : 'bg-gray-50 cursor-not-allowed opacity-50'
              }
            `}
          >
            <span className="mr-2">🔍</span>
            Google Search
          </button>
          <button
            onClick={() => onOpenWebsite('file:///')}
            disabled={!isConnected}
            className={`
              flex items-center justify-center p-3 rounded-lg transition-all text-sm
              ${isConnected
                ? 'bg-gray-100 hover:bg-gray-200 active:scale-95'
                : 'bg-gray-50 cursor-not-allowed opacity-50'
              }
            `}
          >
            <span className="mr-2">📁</span>
            File Explorer
          </button>
        </div>
      </div>

      {/* Usage Tips */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <div className="text-xs text-blue-700">
          <strong>💡 Tips:</strong>
          <div>• Click any service to open in your default browser</div>
          <div>• Enter custom URLs in the search box above</div>
          <div>• URLs without http:// will automatically add https://</div>
        </div>
      </div>
    </div>
  );
}

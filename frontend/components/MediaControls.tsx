"use client";

import { useState } from "react";

interface MediaControlsProps {
  onCommand: (command: { type: string; [key: string]: any }) => void;
  isConnected: boolean;
}

export default function MediaControls({
  onCommand,
  isConnected,
}: MediaControlsProps) {
  const [volume, setVolume] = useState(50);
  const [brightness, setBrightness] = useState(75);

  const handleMediaCommand = (type: string) => {
    if (!isConnected) return;
    onCommand({ type });
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (isConnected) {
      onCommand({ type: "volume_set", value: newVolume });
    }
  };

  const handleBrightnessChange = (newBrightness: number) => {
    setBrightness(newBrightness);
    if (isConnected) {
      onCommand({ type: "brightness_set", value: newBrightness });
    }
  };

  const mediaButtons = [
    { type: "play_pause", label: "Play/Pause", icon: "⏯️" },
    { type: "previous", label: "Previous", icon: "⏮️" },
    { type: "next", label: "Next", icon: "⏭️" },
    { type: "stop", label: "Stop", icon: "⏹️" },
  ];

  const volumeButtons = [
    { type: "volume_up", label: "Volume Up", icon: "🔊" },
    { type: "volume_down", label: "Volume Down", icon: "🔉" },
    { type: "volume_mute", label: "Mute", icon: "🔇" },
  ];

  return (
    <div className="space-y-6">
      {/* Media Controls */}
      <div className="glass-card rounded-2xl p-6 shadow-2xl">
        <h3 className="text-xl font-semibold text-hulu-white mb-6 flex items-center gap-3">
          🎵 Media Controls
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {mediaButtons.map((button) => (
            <button
              key={button.type}
              onClick={() => handleMediaCommand(button.type)}
              disabled={!isConnected}
              className={`
                flex flex-col items-center justify-center p-6 rounded-xl transition-all min-h-[80px]
                ${
                  isConnected
                    ? "btn-secondary hover:bg-hulu-light-gray hover:border-hulu-text-gray active:scale-95 border-glow"
                    : "btn-secondary opacity-50 cursor-not-allowed"
                }
              `}
            >
              <span className="text-3xl mb-2">{button.icon}</span>
              <span className="text-base font-semibold text-hulu-white">
                {button.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Volume Controls */}
      <div className="glass-card rounded-2xl p-6 shadow-2xl">
        <h3 className="text-xl font-semibold text-hulu-white mb-6 flex items-center gap-3">
          🔊 Volume Control
        </h3>

        {/* Volume Slider */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-base text-hulu-text-gray">Volume</span>
            <span className="text-lg font-semibold text-hulu-green">
              {volume}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
            disabled={!isConnected}
            className="w-full h-3 rounded-lg cursor-pointer"
          />
        </div>

        {/* Volume Buttons */}
        <div className="grid grid-cols-3 gap-3">
          {volumeButtons.map((button) => (
            <button
              key={button.type}
              onClick={() => handleMediaCommand(button.type)}
              disabled={!isConnected}
              className={`
                flex flex-col items-center justify-center p-4 rounded-lg transition-all min-h-[64px]
                ${
                  isConnected
                    ? "btn-secondary hover:bg-hulu-light-gray active:scale-95"
                    : "btn-secondary opacity-50 cursor-not-allowed"
                }
              `}
            >
              <span className="text-xl mb-1">{button.icon}</span>
              <span className="text-xs text-hulu-text-gray font-medium">
                {button.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Brightness Control */}
      <div className="glass-card rounded-2xl p-6 shadow-2xl">
        <h3 className="text-xl font-semibold text-hulu-white mb-6 flex items-center gap-3">
          ☀️ Brightness Control
        </h3>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-base text-hulu-text-gray">Brightness</span>
            <span className="text-lg font-semibold text-hulu-green">
              {brightness}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={brightness}
            onChange={(e) => handleBrightnessChange(parseInt(e.target.value))}
            disabled={!isConnected}
            className="w-full h-3 rounded-lg cursor-pointer"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleMediaCommand("brightness_down")}
            disabled={!isConnected}
            className={`
              flex items-center justify-center p-4 rounded-lg transition-all min-h-[56px]
              ${
                isConnected
                  ? "btn-secondary hover:bg-hulu-light-gray active:scale-95"
                  : "btn-secondary opacity-50 cursor-not-allowed"
              }
            `}
          >
            <span className="text-xl mr-2">🔅</span>
            <span className="text-base text-hulu-white font-medium">
              Decrease
            </span>
          </button>
          <button
            onClick={() => handleMediaCommand("brightness_up")}
            disabled={!isConnected}
            className={`
              flex items-center justify-center p-4 rounded-lg transition-all min-h-[56px]
              ${
                isConnected
                  ? "btn-secondary hover:bg-hulu-light-gray active:scale-95"
                  : "btn-secondary opacity-50 cursor-not-allowed"
              }
            `}
          >
            <span className="text-xl mr-2">🔆</span>
            <span className="text-base text-hulu-white font-medium">
              Increase
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

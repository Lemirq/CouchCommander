"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import {
  Play,
  SkipBack,
  SkipForward,
  VolumeX,
  Volume1,
  Volume2,
  Sun,
  SunDim,
  Music,
} from "lucide-react";

interface MediaControlsProps {
  onCommand: (
    command: string,
    data?: Record<string, unknown>,
    id?: string,
  ) => void;
  isConnected: boolean;
}

export function MediaControls({ onCommand, isConnected }: MediaControlsProps) {
  const [volume, setVolume] = useState([50]);
  const [brightness, setBrightness] = useState([75]);

  const handleMediaCommand = (command: string) => {
    if (!isConnected) return;
    onCommand(command);
  };

  const handleVolumeChange = (newVolume: number[]) => {
    setVolume(newVolume);
    if (isConnected) {
      // Note: volume_set command not implemented in backend yet
      onCommand("volume_set", { value: newVolume[0] });
    }
  };

  const handleBrightnessChange = (newBrightness: number[]) => {
    setBrightness(newBrightness);
    if (isConnected) {
      // Note: brightness_set command not implemented in backend yet
      onCommand("brightness_set", { value: newBrightness[0] });
    }
  };

  const mediaButtons = [
    { command: "media_previous", label: "Previous", icon: SkipBack },
    { command: "play_pause", label: "Play/Pause", icon: Play },
    { command: "media_next", label: "Next", icon: SkipForward },
  ];

  return (
    <div className="space-y-6">
      {/* Media Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="h-5 w-5" />
            Media Controls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {mediaButtons.map((button) => {
              const Icon = button.icon;
              return (
                <Button
                  key={button.command}
                  onClick={() => handleMediaCommand(button.command)}
                  disabled={!isConnected}
                  variant="outline"
                  className="h-16 flex-col gap-2"
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs">{button.label}</span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Volume Control */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            Volume Control
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Volume</Label>
              <span className="text-sm font-medium text-primary">
                {volume[0]}%
              </span>
            </div>
            <Slider
              value={volume}
              onValueChange={handleVolumeChange}
              max={100}
              step={1}
              disabled={!isConnected}
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Button
              onClick={() => handleMediaCommand("volume_down")}
              disabled={!isConnected}
              variant="outline"
              size="sm"
            >
              <Volume1 className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => handleMediaCommand("volume_mute")}
              disabled={!isConnected}
              variant="outline"
              size="sm"
            >
              <VolumeX className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => handleMediaCommand("volume_up")}
              disabled={!isConnected}
              variant="outline"
              size="sm"
            >
              <Volume2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Brightness Control */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sun className="h-5 w-5" />
            Brightness Control
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Brightness</Label>
              <span className="text-sm font-medium text-primary">
                {brightness[0]}%
              </span>
            </div>
            <Slider
              value={brightness}
              onValueChange={handleBrightnessChange}
              max={100}
              step={1}
              disabled={!isConnected}
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={() => handleMediaCommand("brightness_down")}
              disabled={!isConnected}
              variant="outline"
              className="flex items-center gap-2"
            >
              <SunDim className="h-4 w-4" />
              Decrease
            </Button>
            <Button
              onClick={() => handleMediaCommand("brightness_up")}
              disabled={!isConnected}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Sun className="h-4 w-4" />
              Increase
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

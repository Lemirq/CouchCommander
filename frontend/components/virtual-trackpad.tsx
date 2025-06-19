"use client";

import type React from "react";

import { useRef, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Hand, MousePointer, Move, Scroll } from "lucide-react";

interface VirtualTrackpadProps {
  onMouseMove: (deltaX: number, deltaY: number) => void;
  onMouseClick: (button: "left" | "right") => void;
  onScroll: (deltaX: number, deltaY: number) => void;
  isConnected: boolean;
}

export function VirtualTrackpad({
  onMouseMove,
  onMouseClick,
  onScroll,
  isConnected,
}: VirtualTrackpadProps) {
  const trackpadRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [lastPosition, setLastPosition] = useState({ x: 0, y: 0 });
  const [touches, setTouches] = useState<React.Touch[]>([]);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!isConnected) return;

      e.preventDefault();
      const touch = e.touches[0];

      if (e.touches.length === 1) {
        setIsDragging(true);
        setLastPosition({ x: touch.clientX, y: touch.clientY });
      } else if (e.touches.length === 2) {
        setIsScrolling(true);
        setTouches(Array.from(e.touches) as React.Touch[]);
      }
    },
    [isConnected],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isConnected) return;

      e.preventDefault();

      if (e.touches.length === 1 && isDragging) {
        const touch = e.touches[0];
        const deltaX = touch.clientX - lastPosition.x;
        const deltaY = touch.clientY - lastPosition.y;

        const sensitivity = 2.5;
        onMouseMove(deltaX * sensitivity, deltaY * sensitivity);

        setLastPosition({ x: touch.clientX, y: touch.clientY });
      } else if (e.touches.length === 2 && isScrolling) {
        const currentTouches = Array.from(e.touches);

        if (touches.length === 2) {
          const prevTouch1 = touches[0];
          const prevTouch2 = touches[1];
          const currTouch1 = currentTouches[0];
          const currTouch2 = currentTouches[1];

          const deltaX =
            (currTouch1.clientX + currTouch2.clientX) / 2 -
            (prevTouch1.clientX + prevTouch2.clientX) / 2;
          const deltaY =
            (currTouch1.clientY + currTouch2.clientY) / 2 -
            (prevTouch1.clientY + prevTouch2.clientY) / 2;

          onScroll(deltaX, -deltaY * 3);
        }

        setTouches(currentTouches as React.Touch[]);
      }
    },
    [
      isConnected,
      isDragging,
      isScrolling,
      lastPosition,
      touches,
      onMouseMove,
      onScroll,
    ],
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!isConnected) return;

      e.preventDefault();

      if (e.touches.length === 0) {
        if (isDragging && !isScrolling) {
          const touchDuration = Date.now() - (e.timeStamp || 0);
          if (touchDuration < 300) {
            onMouseClick("left");
          }
        }

        setIsDragging(false);
        setIsScrolling(false);
        setTouches([]);
      } else if (e.touches.length === 1 && isScrolling) {
        setIsScrolling(false);
        setIsDragging(true);
        const touch = e.touches[0];
        setLastPosition({ x: touch.clientX, y: touch.clientY });
      }
    },
    [isConnected, isDragging, isScrolling, onMouseClick],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!isConnected) return;
      setIsDragging(true);
      setLastPosition({ x: e.clientX, y: e.clientY });
    },
    [isConnected],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isConnected || !isDragging) return;

      const deltaX = e.clientX - lastPosition.x;
      const deltaY = e.clientY - lastPosition.y;

      onMouseMove(deltaX * 2.5, deltaY * 2.5);
      setLastPosition({ x: e.clientX, y: e.clientY });
    },
    [isConnected, isDragging, lastPosition, onMouseMove],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Hand className="h-5 w-5" />
            Virtual Trackpad
          </div>
          {(isDragging || isScrolling) && (
            <Badge variant="secondary">
              {isDragging && <Move className="h-3 w-3 mr-1" />}
              {isScrolling && <Scroll className="h-3 w-3 mr-1" />}
              {isDragging ? "Moving" : "Scrolling"}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Trackpad Area */}
        <div
          ref={trackpadRef}
          className={`
            relative w-full h-80 rounded-lg border-2 border-dashed transition-all cursor-pointer
            ${
              isConnected
                ? "border-primary/50 bg-muted/30 hover:bg-muted/50"
                : "border-muted bg-muted/20 cursor-not-allowed opacity-50"
            }
            ${isDragging ? "bg-primary/10 border-primary" : ""}
            ${isScrolling ? "bg-primary/20 border-primary" : ""}
          `}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
            {!isConnected ? (
              <div className="text-muted-foreground">
                <MousePointer className="h-12 w-12 mx-auto mb-3" />
                <div className="text-base font-medium">
                  Connect to use trackpad
                </div>
              </div>
            ) : isDragging ? (
              <div className="text-primary">
                <Move className="h-12 w-12 mx-auto mb-3" />
                <div className="text-base font-semibold">Moving cursor...</div>
              </div>
            ) : isScrolling ? (
              <div className="text-primary">
                <Scroll className="h-12 w-12 mx-auto mb-3" />
                <div className="text-base font-semibold">Scrolling...</div>
              </div>
            ) : (
              <div className="text-muted-foreground">
                <Hand className="h-12 w-12 mx-auto mb-4" />
                <div className="text-sm space-y-1">
                  <div>• Drag to move cursor</div>
                  <div>• Two fingers to scroll</div>
                  <div>• Tap to click</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Click Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => onMouseClick("left")}
            disabled={!isConnected}
            variant="outline"
            className="h-16 flex items-center gap-2"
          >
            <MousePointer className="h-5 w-5" />
            Left Click
          </Button>
          <Button
            onClick={() => onMouseClick("right")}
            disabled={!isConnected}
            variant="outline"
            className="h-16 flex items-center gap-2"
          >
            <MousePointer className="h-5 w-5" />
            Right Click
          </Button>
        </div>

        {/* Instructions */}
        <div className="p-3 bg-muted rounded-lg">
          <div className="text-sm text-muted-foreground">
            <strong className="text-foreground">Touch Gestures:</strong>
            <div className="mt-2 space-y-1">
              <div>• Single finger: Move cursor</div>
              <div>• Quick tap: Left click</div>
              <div>• Two fingers: Scroll</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

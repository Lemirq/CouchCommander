'use client';

import { useRef, useState, useCallback } from 'react';

interface VirtualTrackpadProps {
  onMouseMove: (deltaX: number, deltaY: number) => void;
  onMouseClick: (button: 'left' | 'right') => void;
  onScroll: (deltaX: number, deltaY: number) => void;
  isConnected: boolean;
}

export default function VirtualTrackpad({
  onMouseMove,
  onMouseClick,
  onScroll,
  isConnected
}: VirtualTrackpadProps) {
  const trackpadRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [lastPosition, setLastPosition] = useState({ x: 0, y: 0 });
  const [touches, setTouches] = useState<Touch[]>([]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isConnected) return;

    e.preventDefault();
    const touch = e.touches[0];

    if (e.touches.length === 1) {
      // Single finger - mouse movement
      setIsDragging(true);
      setLastPosition({ x: touch.clientX, y: touch.clientY });
    } else if (e.touches.length === 2) {
      // Two fingers - scrolling
      setIsScrolling(true);
      setTouches(Array.from(e.touches));
    }
  }, [isConnected]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isConnected) return;

    e.preventDefault();

    if (e.touches.length === 1 && isDragging) {
      // Single finger mouse movement
      const touch = e.touches[0];
      const deltaX = touch.clientX - lastPosition.x;
      const deltaY = touch.clientY - lastPosition.y;

      // Apply sensitivity multiplier
      const sensitivity = 2;
      onMouseMove(deltaX * sensitivity, deltaY * sensitivity);

      setLastPosition({ x: touch.clientX, y: touch.clientY });
    } else if (e.touches.length === 2 && isScrolling) {
      // Two finger scrolling
      const currentTouches = Array.from(e.touches);

      if (touches.length === 2) {
        const prevTouch1 = touches[0];
        const prevTouch2 = touches[1];
        const currTouch1 = currentTouches[0];
        const currTouch2 = currentTouches[1];

        // Calculate average movement for scrolling
        const deltaX = ((currTouch1.clientX + currTouch2.clientX) / 2) -
                     ((prevTouch1.clientX + prevTouch2.clientX) / 2);
        const deltaY = ((currTouch1.clientY + currTouch2.clientY) / 2) -
                     ((prevTouch1.clientY + prevTouch2.clientY) / 2);

        // Invert Y for natural scrolling
        onScroll(deltaX, -deltaY * 2);
      }

      setTouches(currentTouches);
    }
  }, [isConnected, isDragging, isScrolling, lastPosition, touches, onMouseMove, onScroll]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!isConnected) return;

    e.preventDefault();

    if (e.touches.length === 0) {
      // All fingers lifted
      if (isDragging && !isScrolling) {
        // Single tap for left click
        const touchDuration = Date.now() - (e.timeStamp || 0);
        if (touchDuration < 200) { // Quick tap
          onMouseClick('left');
        }
      }

      setIsDragging(false);
      setIsScrolling(false);
      setTouches([]);
    } else if (e.touches.length === 1 && isScrolling) {
      // One finger remaining after two-finger scroll
      setIsScrolling(false);
      setIsDragging(true);
      const touch = e.touches[0];
      setLastPosition({ x: touch.clientX, y: touch.clientY });
    }
  }, [isConnected, isDragging, isScrolling, onMouseClick]);

  // Mouse events for desktop testing
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isConnected) return;

    setIsDragging(true);
    setLastPosition({ x: e.clientX, y: e.clientY });
  }, [isConnected]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isConnected || !isDragging) return;

    const deltaX = e.clientX - lastPosition.x;
    const deltaY = e.clientY - lastPosition.y;

    onMouseMove(deltaX * 2, deltaY * 2);
    setLastPosition({ x: e.clientX, y: e.clientY });
  }, [isConnected, isDragging, lastPosition, onMouseMove]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        👆 Virtual Trackpad
      </h3>

      {/* Trackpad Area */}
      <div
        ref={trackpadRef}
        className={`
          relative w-full h-64 rounded-xl border-2 border-dashed transition-all
          ${isConnected
            ? 'border-blue-300 bg-blue-50/50 hover:bg-blue-50'
            : 'border-gray-300 bg-gray-50 cursor-not-allowed opacity-50'
          }
          ${isDragging ? 'bg-blue-100 border-blue-400' : ''}
          ${isScrolling ? 'bg-green-100 border-green-400' : ''}
        `}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
          {!isConnected ? (
            <div className="text-gray-400">
              <div className="text-2xl mb-2">🔌</div>
              <div className="text-sm">Connect to use trackpad</div>
            </div>
          ) : isDragging ? (
            <div className="text-blue-600">
              <div className="text-2xl mb-2">👆</div>
              <div className="text-sm">Moving cursor...</div>
            </div>
          ) : isScrolling ? (
            <div className="text-green-600">
              <div className="text-2xl mb-2">👆👆</div>
              <div className="text-sm">Scrolling...</div>
            </div>
          ) : (
            <div className="text-gray-500">
              <div className="text-2xl mb-2">👆</div>
              <div className="text-sm">
                <div>• Drag to move cursor</div>
                <div>• Two fingers to scroll</div>
                <div>• Tap to click</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Click Buttons */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        <button
          onClick={() => onMouseClick('left')}
          disabled={!isConnected}
          className={`
            flex items-center justify-center p-4 rounded-xl border-2 transition-all
            ${isConnected
              ? 'bg-blue-50 border-blue-200 hover:bg-blue-100 hover:border-blue-300 active:scale-95'
              : 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-50'
            }
          `}
        >
          <span className="text-lg mr-2">👆</span>
          <span className="text-sm font-medium text-gray-700">Left Click</span>
        </button>

        <button
          onClick={() => onMouseClick('right')}
          disabled={!isConnected}
          className={`
            flex items-center justify-center p-4 rounded-xl border-2 transition-all
            ${isConnected
              ? 'bg-blue-50 border-blue-200 hover:bg-blue-100 hover:border-blue-300 active:scale-95'
              : 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-50'
            }
          `}
        >
          <span className="text-lg mr-2">👆</span>
          <span className="text-sm font-medium text-gray-700">Right Click</span>
        </button>
      </div>

      {/* Instructions */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="text-xs text-gray-600">
          <strong>Touch Gestures:</strong>
          <div>• Single finger: Move cursor</div>
          <div>• Quick tap: Left click</div>
          <div>• Two fingers: Scroll</div>
        </div>
      </div>
    </div>
  );
}

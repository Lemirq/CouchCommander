'use client';

import { useState, useCallback } from 'react';

interface VirtualKeyboardProps {
  onKeyPress: (key: string) => void;
  onTextInput: (text: string) => void;
  isConnected: boolean;
}

export default function VirtualKeyboard({
  onKeyPress,
  onTextInput,
  isConnected
}: VirtualKeyboardProps) {
  const [textInput, setTextInput] = useState('');
  const [isShift, setIsShift] = useState(false);
  const [isCapsLock, setCapsLock] = useState(false);
  const [keyboardLayout, setKeyboardLayout] = useState<'letters' | 'numbers' | 'symbols'>('letters');

  const handleKeyPress = useCallback((key: string) => {
    if (!isConnected) return;

    let finalKey = key;

    // Handle shift/caps lock for letters
    if (key.match(/^[a-z]$/)) {
      finalKey = (isShift || isCapsLock) ? key.toUpperCase() : key;
    }

    // Handle shift for numbers/symbols
    if (isShift && key.match(/^[0-9]$/)) {
      const shiftNumbers: { [key: string]: string } = {
        '1': '!', '2': '@', '3': '#', '4': '$', '5': '%',
        '6': '^', '7': '&', '8': '*', '9': '(', '0': ')'
      };
      finalKey = shiftNumbers[key] || key;
    }

    onKeyPress(finalKey);
    setIsShift(false); // Reset shift after use
  }, [isConnected, isShift, isCapsLock, onKeyPress]);

  const handleSpecialKey = useCallback((key: string) => {
    if (!isConnected) return;

    switch (key) {
      case 'shift':
        setIsShift(!isShift);
        break;
      case 'caps':
        setCapsLock(!isCapsLock);
        break;
      case 'space':
        onKeyPress(' ');
        break;
      case 'enter':
        onKeyPress('Enter');
        break;
      case 'backspace':
        onKeyPress('BackSpace');
        break;
      case 'tab':
        onKeyPress('Tab');
        break;
      case 'escape':
        onKeyPress('Escape');
        break;
      default:
        onKeyPress(key);
    }
  }, [isConnected, isShift, onKeyPress]);

  const handleTextSubmit = () => {
    if (!isConnected || !textInput.trim()) return;

    onTextInput(textInput);
    setTextInput('');
  };

  const letterKeys = [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm']
  ];

  const numberKeys = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    ['-', '=', '[', ']', '\\', ';', "'", ',', '.', '/']
  ];

  const functionKeys = [
    ['F1', 'F2', 'F3', 'F4'],
    ['F5', 'F6', 'F7', 'F8'],
    ['F9', 'F10', 'F11', 'F12']
  ];

  const renderKey = (key: string, extraClasses = '') => (
    <button
      key={key}
      onClick={() => handleKeyPress(key)}
      disabled={!isConnected}
      className={`
        flex items-center justify-center min-h-[44px] px-2 rounded-lg transition-all text-sm
        ${isConnected
          ? 'bg-white border border-gray-300 hover:bg-gray-50 active:bg-gray-100 active:scale-95'
          : 'bg-gray-100 border border-gray-200 cursor-not-allowed opacity-50'
        }
        ${extraClasses}
      `}
    >
      {(isShift || isCapsLock) && key.match(/^[a-z]$/) ? key.toUpperCase() : key}
    </button>
  );

  const renderSpecialKey = (key: string, label: string, extraClasses = '') => (
    <button
      key={key}
      onClick={() => handleSpecialKey(key)}
      disabled={!isConnected}
      className={`
        flex items-center justify-center min-h-[44px] px-3 rounded-lg transition-all text-xs font-medium
        ${isConnected
          ? 'bg-gray-200 border border-gray-300 hover:bg-gray-300 active:bg-gray-400 active:scale-95'
          : 'bg-gray-100 border border-gray-200 cursor-not-allowed opacity-50'
        }
        ${key === 'shift' && isShift ? 'bg-blue-200 border-blue-300' : ''}
        ${key === 'caps' && isCapsLock ? 'bg-blue-200 border-blue-300' : ''}
        ${extraClasses}
      `}
    >
      {label}
    </button>
  );

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        ⌨️ Virtual Keyboard
      </h3>

      {/* Text Input Area */}
      <div className="mb-4 space-y-3">
        <div>
          <label htmlFor="text-input" className="block text-sm font-medium text-gray-700 mb-1">
            Quick Text Input
          </label>
          <div className="flex gap-2">
            <input
              id="text-input"
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Type text to send..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              onKeyPress={(e) => e.key === 'Enter' && handleTextSubmit()}
              disabled={!isConnected}
            />
            <button
              onClick={handleTextSubmit}
              disabled={!isConnected || !textInput.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Send
            </button>
          </div>
        </div>
      </div>

      {/* Keyboard Layout Selector */}
      <div className="flex gap-2 mb-4">
        {(['letters', 'numbers', 'symbols'] as const).map((layout) => (
          <button
            key={layout}
            onClick={() => setKeyboardLayout(layout)}
            className={`
              px-3 py-1 rounded-lg text-sm transition-all
              ${keyboardLayout === layout
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }
            `}
          >
            {layout === 'letters' ? 'ABC' : layout === 'numbers' ? '123' : '!@#'}
          </button>
        ))}
      </div>

      {/* Virtual Keyboard */}
      <div className="space-y-2">
        {keyboardLayout === 'letters' && (
          <>
            {/* Letter rows */}
            {letterKeys.map((row, rowIndex) => (
              <div key={rowIndex} className="flex gap-1 justify-center">
                {rowIndex === 1 && (
                  <div className="w-6" /> // Offset for middle row
                )}
                {row.map((key) => renderKey(key))}
              </div>
            ))}

            {/* Bottom row with special keys */}
            <div className="flex gap-1 justify-center">
              {renderSpecialKey('shift', isShift ? '⇧' : 'shift')}
              {renderKey(' ', 'flex-1 min-w-[120px]')}
              {renderSpecialKey('backspace', '⌫')}
            </div>
          </>
        )}

        {keyboardLayout === 'numbers' && (
          <>
            {numberKeys.map((row, rowIndex) => (
              <div key={rowIndex} className="flex gap-1 justify-center">
                {row.map((key) => renderKey(key))}
              </div>
            ))}
          </>
        )}

        {keyboardLayout === 'symbols' && (
          <>
            {/* Function keys */}
            {functionKeys.map((row, rowIndex) => (
              <div key={rowIndex} className="flex gap-1 justify-center">
                {row.map((key) => renderKey(key, 'text-xs'))}
              </div>
            ))}
          </>
        )}

        {/* Common special keys row */}
        <div className="flex gap-1 justify-center pt-2 border-t border-gray-200">
          {renderSpecialKey('escape', 'Esc')}
          {renderSpecialKey('tab', 'Tab')}
          {renderSpecialKey('caps', isCapsLock ? '⇪' : 'Caps')}
          {renderSpecialKey('enter', '↵')}
        </div>

        {/* Arrow keys */}
        <div className="flex justify-center pt-2">
          <div className="grid grid-cols-3 gap-1 w-32">
            <div></div>
            {renderSpecialKey('ArrowUp', '↑')}
            <div></div>
            {renderSpecialKey('ArrowLeft', '←')}
            {renderSpecialKey('ArrowDown', '↓')}
            {renderSpecialKey('ArrowRight', '→')}
          </div>
        </div>
      </div>

      {/* Status indicators */}
      <div className="mt-4 flex gap-4 justify-center text-xs text-gray-500">
        {isCapsLock && (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>CAPS LOCK</span>
          </div>
        )}
        {isShift && (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>SHIFT</span>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Keyboard, Send, LockIcon as CapsLock, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Command } from 'lucide-react';
interface VirtualKeyboardProps {
  onKeyPress: (key: string) => void;
  onTextInput: (text: string) => void;
  isConnected: boolean;
  sendCommand: (command: string, data?: Record<string, unknown>) => void;
  modifierKeyStates?: {
    cmd?: boolean;
    shift?: boolean;
    alt?: boolean;
    option?: boolean;
    ctrl?: boolean;
    control?: boolean;
  };
}

interface ModifierKeyStates {
  cmd?: boolean;
  shift?: boolean;
  alt?: boolean;
  option?: boolean;
  ctrl?: boolean;
  control?: boolean;
}

export function VirtualKeyboard({ onKeyPress, onTextInput, isConnected, sendCommand, modifierKeyStates = {} }: VirtualKeyboardProps) {
  const [textInput, setTextInput] = useState('');
  const [isShift, setIsShift] = useState(false);
  const [isCapsLock, setCapsLock] = useState(false);
  const [localModifierStates, setLocalModifierStates] = useState<ModifierKeyStates>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);

  // Update local modifier states when prop changes
  useEffect(() => {
    setLocalModifierStates(modifierKeyStates);
  }, [modifierKeyStates]);

  // Fetch modifier key states on component mount and when connection changes
  useEffect(() => {
    if (isConnected) {
      fetchModifierStates();
    }
  }, [isConnected]);

  useEffect(() => {
    if (localModifierStates) {
      setIsShift(!!localModifierStates.shift);
    }
  }, [localModifierStates]);

  const fetchModifierStates = () => {
    if (!isConnected) return;
    sendCommand('get_modifier_key_states');
  };

  const handleModifierToggle = useCallback(
    (key: string) => {
      if (!isConnected) return;
      console.log('Toggling modifier key:', key);
      sendCommand('toggle_modifier_key', { key_name: key });
      // Fetch updated states after toggle with a longer delay to ensure backend has processed
      setTimeout(() => {
        console.log('Fetching updated modifier states...');
        fetchModifierStates();
      }, 200);
    },
    [isConnected, sendCommand]
  );

  const handleClearModifiers = useCallback(() => {
    if (!isConnected) return;
    console.log('Clearing all modifier keys');
    sendCommand('clear_modifier_keys');
    // Fetch updated states after clearing with a longer delay
    setTimeout(() => {
      console.log('Fetching updated modifier states after clear...');
      fetchModifierStates();
    }, 200);
  }, [isConnected, sendCommand]);

  const handleKeyPress = useCallback(
    (key: string) => {
      if (!isConnected) return;

      let finalKey = key;

      if (key.match(/^[a-z]$/)) {
        finalKey = isShift || isCapsLock ? key.toUpperCase() : key;
      }

      if (isShift && key.match(/^[0-9]$/)) {
        const shiftNumbers: { [key: string]: string } = {
          '1': '!',
          '2': '@',
          '3': '#',
          '4': '$',
          '5': '%',
          '6': '^',
          '7': '&',
          '8': '*',
          '9': '(',
          '0': ')',
        };
        finalKey = shiftNumbers[key] || key;
      }

      onKeyPress(finalKey);
      setIsShift(false);
    },
    [isConnected, isShift, isCapsLock, onKeyPress]
  );

  const handleSpecialKey = useCallback(
    (key: string) => {
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
          onKeyPress('return');
          break;
        case 'backspace':
          onKeyPress('backspace');
          break;
        case 'tab':
          onKeyPress('tab');
          break;
        case 'escape':
          onKeyPress('escape');
          break;
        default:
          onKeyPress(key);
      }
    },
    [isConnected, isShift, isCapsLock, onKeyPress]
  );

  const handleTextSubmit = async () => {
    if (!isConnected || !textInput.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setLastResult(null);

    try {
      await onTextInput(textInput);
      setLastResult('Text sent successfully!');
      setTextInput('');
    } catch (error) {
      setLastResult('Failed to send text. Please try again.');
    } finally {
      setIsSubmitting(false);
      // Clear result after 3 seconds
      setTimeout(() => setLastResult(null), 3000);
    }
  };

  const letterKeys = [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
  ];

  const numberKeys = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    ['-', '=', '[', ']', '\\', ';', "'", ',', '.', '/'],
  ];

  const functionKeys = [
    ['F1', 'F2', 'F3', 'F4'],
    ['F5', 'F6', 'F7', 'F8'],
    ['F9', 'F10', 'F11', 'F12'],
  ];

  const renderKey = (key: string, extraClasses = '') => (
    <Button
      key={key}
      onClick={() => handleKeyPress(key)}
      disabled={!isConnected}
      variant='outline'
      size='sm'
      className={`min-h-12 min-w-0! w-full ${extraClasses}`}>
      {(isShift || isCapsLock) && key.match(/^[a-z]$/) ? key.toUpperCase() : key}
    </Button>
  );

  const renderSpecialKey = (key: string, label: string, extraClasses = '') => (
    <Button
      key={key}
      onClick={() => handleSpecialKey(key)}
      disabled={!isConnected}
      variant={(key === 'shift' && isShift) || (key === 'caps' && isCapsLock) ? 'default' : 'secondary'}
      size='sm'
      className={`min-h-12 size-10! ${extraClasses}`}>
      {label}
    </Button>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <Keyboard className='h-5 w-5' />
            Virtual Keyboard
          </div>
          <div className='flex gap-2'>
            {isCapsLock && (
              <Badge variant='default'>
                <CapsLock className='h-3 w-3 mr-1' />
                CAPS
              </Badge>
            )}
            {(isShift || localModifierStates.shift) && <Badge variant='default'>SHIFT</Badge>}
            {localModifierStates.cmd && <Badge variant='default'>CMD</Badge>}
            {(localModifierStates.alt || localModifierStates.option) && <Badge variant='default'>ALT</Badge>}
            {(localModifierStates.ctrl || localModifierStates.control) && <Badge variant='default'>CTRL</Badge>}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-6'>
        {/* Text Input Area */}
        <div className='space-y-2'>
          <Label htmlFor='text-input'>Quick Text Input</Label>
          <div className='flex gap-2'>
            <Input
              id='text-input'
              type='text'
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder='Type text to send...'
              onKeyPress={(e) => e.key === 'Enter' && handleTextSubmit()}
              disabled={!isConnected || isSubmitting}
              maxLength={1000}
            />
            <Button onClick={handleTextSubmit} disabled={!isConnected || !textInput.trim() || isSubmitting}>
              {isSubmitting ? '...' : <Send className='h-4 w-4' />}
            </Button>
          </div>
          <div className='flex justify-between text-sm text-muted-foreground'>
            <span>{textInput.length}/1000 characters</span>
            {lastResult && <span className={textInput.length > 1000 ? 'text-red-500' : 'text-green-500'}>{lastResult}</span>}
          </div>
        </div>

        {/* Virtual Keyboard */}
        <Tabs defaultValue='letters' className='w-full'>
          <TabsList className='grid w-full grid-cols-3 h-auto p-0'>
            <TabsTrigger className='w-full' value='letters'>
              ABC
            </TabsTrigger>
            <TabsTrigger className='w-full' value='numbers'>
              123
            </TabsTrigger>
            <TabsTrigger className='w-full' value='functions'>
              F1-F12
            </TabsTrigger>
          </TabsList>

          <TabsContent value='letters' className='space-y-2 mt-4 w-full'>
            {letterKeys.map((row, rowIndex) => (
              <div key={rowIndex} className='flex gap-0.5 justify-center'>
                {rowIndex === 1 && <div className='w-6' />}
                {row.map((key) => renderKey(key))}
              </div>
            ))}
            <div className='flex gap-1 justify-center'>
              {renderSpecialKey('shift', isShift ? '⇧' : 'Shift')}
              {renderKey(' ', 'flex-1 min-w-32')}
              {renderSpecialKey('backspace', '⌫')}
            </div>
          </TabsContent>

          <TabsContent value='numbers' className='space-y-2 mt-4'>
            {numberKeys.map((row, rowIndex) => (
              <div key={rowIndex} className='flex gap-1 justify-center'>
                {row.map((key) => renderKey(key))}
              </div>
            ))}
          </TabsContent>

          <TabsContent value='functions' className='space-y-2 mt-4'>
            {functionKeys.map((row, rowIndex) => (
              <div key={rowIndex} className='flex gap-1 justify-center'>
                {row.map((key) => (
                  <Button
                    key={key}
                    onClick={() => onKeyPress(key.toLowerCase())}
                    disabled={!isConnected}
                    variant='outline'
                    size='sm'
                    className='min-h-12 p-0 text-xs'>
                    {key}
                  </Button>
                ))}
              </div>
            ))}
          </TabsContent>
        </Tabs>

        {/* Special Keys */}
        <div className='space-y-2'>
          <div className='flex gap-1 justify-center'>
            {renderSpecialKey('escape', 'Esc')}
            {renderSpecialKey('tab', 'Tab')}
            {renderSpecialKey('caps', isCapsLock ? '⇪' : 'Caps')}
            {renderSpecialKey('enter', '↵')}
          </div>

          {/* Modifier Keys */}
          <div className='flex gap-1 justify-center'>
            <Button
              onClick={() => handleModifierToggle('cmd')}
              disabled={!isConnected}
              variant={localModifierStates.cmd ? 'default' : 'secondary'}
              size='sm'
              className={`min-h-10 ${localModifierStates.cmd ? 'bg-white text-black' : ''}`}>
              <Command className='h-4 w-4 mr-1' />
              CMD
            </Button>
            <Button
              onClick={() => handleModifierToggle('shift')}
              disabled={!isConnected}
              variant={localModifierStates.shift ? 'default' : 'secondary'}
              size='sm'
              className={`min-h-10 ${localModifierStates.shift ? 'bg-white text-black' : ''}`}>
              ⇧ SHIFT
            </Button>
            <Button
              onClick={() => handleModifierToggle('alt')}
              disabled={!isConnected}
              variant={localModifierStates.alt || localModifierStates.option ? 'default' : 'secondary'}
              size='sm'
              className={`min-h-10 ${localModifierStates.alt || localModifierStates.option ? 'bg-white text-black' : ''}`}>
              ⌥ ALT
            </Button>
            <Button
              onClick={() => handleModifierToggle('ctrl')}
              disabled={!isConnected}
              variant={localModifierStates.ctrl || localModifierStates.control ? 'default' : 'secondary'}
              size='sm'
              className={`min-h-10 ${localModifierStates.ctrl || localModifierStates.control ? 'bg-white text-black' : ''}`}>
              CTRL
            </Button>
            <Button onClick={handleClearModifiers} disabled={!isConnected} variant='outline' size='sm' className='min-h-10'>
              Clear All
            </Button>
          </div>

          {/* Arrow Keys */}
          <div className='flex justify-center'>
            <div className='grid grid-cols-3 gap-1 w-32'>
              <div></div>
              <Button onClick={() => handleSpecialKey('up')} disabled={!isConnected} variant='outline' size='sm' className='min-h-10'>
                <ArrowUp className='h-4 w-4' />
              </Button>
              <div></div>
              <Button onClick={() => handleSpecialKey('left')} disabled={!isConnected} variant='outline' size='sm' className='min-h-10'>
                <ArrowLeft className='h-4 w-4' />
              </Button>
              <Button onClick={() => handleSpecialKey('down')} disabled={!isConnected} variant='outline' size='sm' className='min-h-10'>
                <ArrowDown className='h-4 w-4' />
              </Button>
              <Button onClick={() => handleSpecialKey('right')} disabled={!isConnected} variant='outline' size='sm' className='min-h-10'>
                <ArrowRight className='h-4 w-4' />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

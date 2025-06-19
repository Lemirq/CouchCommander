"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Keyboard,
  Send,
  LockIcon as CapsLock,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

interface VirtualKeyboardProps {
  onKeyPress: (key: string) => void;
  onTextInput: (text: string) => void;
  isConnected: boolean;
}

export function VirtualKeyboard({
  onKeyPress,
  onTextInput,
  isConnected,
}: VirtualKeyboardProps) {
  const [textInput, setTextInput] = useState("");
  const [isShift, setIsShift] = useState(false);
  const [isCapsLock, setCapsLock] = useState(false);

  const handleKeyPress = useCallback(
    (key: string) => {
      if (!isConnected) return;

      let finalKey = key;

      if (key.match(/^[a-z]$/)) {
        finalKey = isShift || isCapsLock ? key.toUpperCase() : key;
      }

      if (isShift && key.match(/^[0-9]$/)) {
        const shiftNumbers: { [key: string]: string } = {
          "1": "!",
          "2": "@",
          "3": "#",
          "4": "$",
          "5": "%",
          "6": "^",
          "7": "&",
          "8": "*",
          "9": "(",
          "0": ")",
        };
        finalKey = shiftNumbers[key] || key;
      }

      onKeyPress(finalKey);
      setIsShift(false);
    },
    [isConnected, isShift, isCapsLock, onKeyPress],
  );

  const handleSpecialKey = useCallback(
    (key: string) => {
      if (!isConnected) return;

      switch (key) {
        case "shift":
          setIsShift(!isShift);
          break;
        case "caps":
          setCapsLock(!isCapsLock);
          break;
        case "space":
          onKeyPress(" ");
          break;
        case "enter":
          onKeyPress("Enter");
          break;
        case "backspace":
          onKeyPress("BackSpace");
          break;
        case "tab":
          onKeyPress("Tab");
          break;
        case "escape":
          onKeyPress("Escape");
          break;
        default:
          onKeyPress(key);
      }
    },
    [isConnected, isShift, isCapsLock, onKeyPress],
  );

  const handleTextSubmit = () => {
    if (!isConnected || !textInput.trim()) return;
    onTextInput(textInput);
    setTextInput("");
  };

  const letterKeys = [
    ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
    ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
    ["z", "x", "c", "v", "b", "n", "m"],
  ];

  const numberKeys = [
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
    ["-", "=", "[", "]", "\\", ";", "'", ",", ".", "/"],
  ];

  const functionKeys = [
    ["F1", "F2", "F3", "F4"],
    ["F5", "F6", "F7", "F8"],
    ["F9", "F10", "F11", "F12"],
  ];

  const renderKey = (key: string, extraClasses = "") => (
    <Button
      key={key}
      onClick={() => handleKeyPress(key)}
      disabled={!isConnected}
      variant="outline"
      size="sm"
      className={`min-h-12 ${extraClasses}`}
    >
      {(isShift || isCapsLock) && key.match(/^[a-z]$/)
        ? key.toUpperCase()
        : key}
    </Button>
  );

  const renderSpecialKey = (key: string, label: string, extraClasses = "") => (
    <Button
      key={key}
      onClick={() => handleSpecialKey(key)}
      disabled={!isConnected}
      variant={
        (key === "shift" && isShift) || (key === "caps" && isCapsLock)
          ? "default"
          : "secondary"
      }
      size="sm"
      className={`min-h-12 ${extraClasses}`}
    >
      {label}
    </Button>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Virtual Keyboard
          </div>
          <div className="flex gap-2">
            {isCapsLock && (
              <Badge variant="default">
                <CapsLock className="h-3 w-3 mr-1" />
                CAPS
              </Badge>
            )}
            {isShift && <Badge variant="default">SHIFT</Badge>}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Text Input Area */}
        <div className="space-y-2">
          <Label htmlFor="text-input">Quick Text Input</Label>
          <div className="flex gap-2">
            <Input
              id="text-input"
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Type text to send..."
              onKeyPress={(e) => e.key === "Enter" && handleTextSubmit()}
              disabled={!isConnected}
            />
            <Button
              onClick={handleTextSubmit}
              disabled={!isConnected || !textInput.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Virtual Keyboard */}
        <Tabs defaultValue="letters" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="letters">ABC</TabsTrigger>
            <TabsTrigger value="numbers">123</TabsTrigger>
            <TabsTrigger value="functions">F1-F12</TabsTrigger>
          </TabsList>

          <TabsContent value="letters" className="space-y-2 mt-4">
            {letterKeys.map((row, rowIndex) => (
              <div key={rowIndex} className="flex gap-1 justify-center">
                {rowIndex === 1 && <div className="w-6" />}
                {row.map((key) => renderKey(key))}
              </div>
            ))}
            <div className="flex gap-1 justify-center">
              {renderSpecialKey("shift", isShift ? "⇧" : "Shift")}
              {renderKey(" ", "flex-1 min-w-32")}
              {renderSpecialKey("backspace", "⌫")}
            </div>
          </TabsContent>

          <TabsContent value="numbers" className="space-y-2 mt-4">
            {numberKeys.map((row, rowIndex) => (
              <div key={rowIndex} className="flex gap-1 justify-center">
                {row.map((key) => renderKey(key))}
              </div>
            ))}
          </TabsContent>

          <TabsContent value="functions" className="space-y-2 mt-4">
            {functionKeys.map((row, rowIndex) => (
              <div key={rowIndex} className="flex gap-1 justify-center">
                {row.map((key) => renderKey(key, "text-xs"))}
              </div>
            ))}
          </TabsContent>
        </Tabs>

        {/* Special Keys */}
        <div className="space-y-2">
          <div className="flex gap-1 justify-center">
            {renderSpecialKey("escape", "Esc")}
            {renderSpecialKey("tab", "Tab")}
            {renderSpecialKey("caps", isCapsLock ? "⇪" : "Caps")}
            {renderSpecialKey("enter", "↵")}
          </div>

          {/* Arrow Keys */}
          <div className="flex justify-center">
            <div className="grid grid-cols-3 gap-1 w-32">
              <div></div>
              <Button
                onClick={() => handleSpecialKey("ArrowUp")}
                disabled={!isConnected}
                variant="outline"
                size="sm"
                className="min-h-10"
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
              <div></div>
              <Button
                onClick={() => handleSpecialKey("ArrowLeft")}
                disabled={!isConnected}
                variant="outline"
                size="sm"
                className="min-h-10"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => handleSpecialKey("ArrowDown")}
                disabled={!isConnected}
                variant="outline"
                size="sm"
                className="min-h-10"
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => handleSpecialKey("ArrowRight")}
                disabled={!isConnected}
                variant="outline"
                size="sm"
                className="min-h-10"
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

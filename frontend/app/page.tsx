"use client";

import { useState, useCallback } from "react";
import ConnectionStatus from "../components/ConnectionStatus";
import NavigationTabs from "../components/NavigationTabs";
import MediaControls from "../components/MediaControls";
import VirtualTrackpad from "../components/VirtualTrackpad";
import VirtualKeyboard from "../components/VirtualKeyboard";
import WebsiteShortcuts from "../components/WebsiteShortcuts";

export default function Home() {
  const [isConnected, setIsConnected] = useState(false);
  const [serverIP, setServerIP] = useState<string>();
  const [activeTab, setActiveTab] = useState("media");
  const [websocket, setWebsocket] = useState<WebSocket | null>(null);

  const handleConnect = useCallback(
    async (ip: string) => {
      try {
        // Close existing connection
        if (websocket) {
          websocket.close();
        }

        // Create new WebSocket connection
        const ws = new WebSocket(`ws://${ip}:8080`);

        ws.onopen = () => {
          setIsConnected(true);
          setServerIP(ip);
          setWebsocket(ws);
          console.log("Connected to server");
        };

        ws.onclose = () => {
          setIsConnected(false);
          setServerIP(undefined);
          setWebsocket(null);
          console.log("Disconnected from server");
        };

        ws.onerror = (error) => {
          console.error("WebSocket error:", error);
          setIsConnected(false);
          setServerIP(undefined);
          setWebsocket(null);
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            console.log("Received message:", message);
            // Handle server responses here
          } catch (error) {
            console.error("Failed to parse message:", error);
          }
        };
      } catch (error) {
        console.error("Failed to connect:", error);
        throw error;
      }
    },
    [websocket],
  );

  const handleDisconnect = useCallback(() => {
    if (websocket) {
      websocket.close();
    }
    setIsConnected(false);
    setServerIP(undefined);
    setWebsocket(null);
  }, [websocket]);

  const sendCommand = useCallback(
    (command: { type: string; [key: string]: any }) => {
      if (!websocket || websocket.readyState !== WebSocket.OPEN) {
        console.warn("WebSocket not connected");
        return;
      }

      try {
        websocket.send(JSON.stringify(command));
        console.log("Sent command:", command);
      } catch (error) {
        console.error("Failed to send command:", error);
      }
    },
    [websocket],
  );

  // Command handlers
  const handleMouseMove = useCallback(
    (deltaX: number, deltaY: number) => {
      sendCommand({ type: "mouse_move", deltaX, deltaY });
    },
    [sendCommand],
  );

  const handleMouseClick = useCallback(
    (button: "left" | "right") => {
      sendCommand({ type: "mouse_click", button });
    },
    [sendCommand],
  );

  const handleScroll = useCallback(
    (deltaX: number, deltaY: number) => {
      sendCommand({ type: "scroll", deltaX, deltaY });
    },
    [sendCommand],
  );

  const handleKeyPress = useCallback(
    (key: string) => {
      sendCommand({ type: "key_press", key });
    },
    [sendCommand],
  );

  const handleTextInput = useCallback(
    (text: string) => {
      sendCommand({ type: "text_input", text });
    },
    [sendCommand],
  );

  const handleOpenWebsite = useCallback(
    (url: string) => {
      sendCommand({ type: "open_website", url });
    },
    [sendCommand],
  );

  const renderActiveTab = () => {
    switch (activeTab) {
      case "media":
        return (
          <MediaControls onCommand={sendCommand} isConnected={isConnected} />
        );
      case "trackpad":
        return (
          <VirtualTrackpad
            onMouseMove={handleMouseMove}
            onMouseClick={handleMouseClick}
            onScroll={handleScroll}
            isConnected={isConnected}
          />
        );
      case "keyboard":
        return (
          <VirtualKeyboard
            onKeyPress={handleKeyPress}
            onTextInput={handleTextInput}
            isConnected={isConnected}
          />
        );
      case "websites":
        return (
          <WebsiteShortcuts
            onOpenWebsite={handleOpenWebsite}
            isConnected={isConnected}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-hulu-black via-hulu-dark-gray to-hulu-gray">
      <div className="container mx-auto px-4 py-6 max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-hulu-white mb-3 text-shadow">
            🎮 CouchCommander
          </h1>
          <p className="text-hulu-text-gray text-base">
            Control your laptop from your phone
          </p>
        </div>

        {/* Connection Status */}
        <ConnectionStatus
          isConnected={isConnected}
          serverIP={serverIP}
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
        />

        {/* Navigation Tabs */}
        <NavigationTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Active Tab Content */}
        <div className="mb-6">{renderActiveTab()}</div>

        {/* Footer */}
        <div className="text-center text-sm text-hulu-text-gray mt-8">
          <div className="glass-card rounded-xl p-4">
            <div className="mb-3">
              Make sure your laptop and phone are on the same Wi-Fi network
            </div>
            <div className="flex items-center justify-center gap-6">
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${isConnected ? "bg-hulu-green pulse-green" : "bg-red-500"}`}
                ></div>
                <span className="font-medium">
                  {isConnected ? "Online" : "Offline"}
                </span>
              </div>
              {serverIP && (
                <div className="flex items-center gap-2">
                  <span>📡</span>
                  <span className="font-mono text-sm text-hulu-green">
                    {serverIP}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

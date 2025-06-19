"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import { ConnectionStatus } from "@/components/connection-status";
import { NavigationTabs } from "@/components/navigation-tabs";
import { MediaControls } from "@/components/media-controls";
import { VirtualTrackpad } from "@/components/virtual-trackpad";
import { VirtualKeyboard } from "@/components/virtual-keyboard";
import { WebsiteShortcuts } from "@/components/website-shortcuts";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gamepad2, Wifi, WifiOff } from "lucide-react";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";

function HomeContent() {
  const searchParams = useSearchParams();
  const ip = searchParams.get("ip");

  const [isConnected, setIsConnected] = useState(false);
  const [serverIP, setServerIP] = useState<string>();
  const [activeTab, setActiveTab] = useState("media");
  const [websocket, setWebsocket] = useState<WebSocket | null>(null);

  const handleConnect = useCallback(
    async (ip: string) => {
      try {
        if (websocket) {
          websocket.close();
        }

        const ws = new WebSocket(`ws://${ip}:8080`);

        ws.onopen = () => {
          setIsConnected(true);
          setServerIP(ip);
          setWebsocket(ws);
          console.log("Connected to server");
          toast.success("Connected to server");
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
            console.log("Received message:", message.status);
            if (message.status == "error") {
              toast.error(message.message);
            }
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

  // useeffect that triggers the handle connect if search param ip has a value
  useEffect(() => {
    if (ip) {
      if (!isConnected) {
        handleConnect(ip);
      }
    }
  }, [ip, handleConnect]);

  const handleDisconnect = useCallback(() => {
    if (websocket) {
      websocket.close();
    }
    setIsConnected(false);
    setServerIP(undefined);
    setWebsocket(null);
  }, [websocket]);

  const sendCommand = useCallback(
    (command: string, data?: Record<string, unknown>, id?: string) => {
      if (!websocket || websocket.readyState !== WebSocket.OPEN) {
        console.warn("WebSocket not connected");
        toast.warning("WebSocket not connected");
        return;
      }

      const message = {
        command,
        data: data || null,
        id: id || null,
      };

      try {
        websocket.send(JSON.stringify(message));
        console.log("Sent command:", message);
      } catch (error) {
        console.error("Failed to send command:", error);
        toast.warning("Failed to send command");
      }
    },
    [websocket],
  );

  const handleMouseMove = useCallback(
    (deltaX: number, deltaY: number) => {
      // Note: mouse_move command not implemented in backend yet
      sendCommand("mouse_move", { deltaX, deltaY });
    },
    [sendCommand],
  );

  const handleMouseClick = useCallback(
    (button: "left" | "right") => {
      // Note: mouse_click command not implemented in backend yet
      sendCommand("mouse_click", { button });
    },
    [sendCommand],
  );

  const handleScroll = useCallback(
    (deltaX: number, deltaY: number) => {
      // Note: scroll command not implemented in backend yet
      sendCommand("scroll", { deltaX, deltaY });
    },
    [sendCommand],
  );

  const handleKeyPress = useCallback(
    (key: string) => {
      sendCommand("send_key", { key });
    },
    [sendCommand],
  );

  const handleTextInput = useCallback(
    (text: string) => {
      // Note: text_input command not implemented in backend yet
      sendCommand("text_input", { text });
    },
    [sendCommand],
  );

  const handleOpenWebsite = useCallback(
    (url: string) => {
      sendCommand("open_website", { url });
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
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div
        className="container mx-auto px-4 py-6 max-w-md"
        style={{ overscrollBehavior: "none", touchAction: "pan-y" }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Gamepad2 className="h-10 w-10 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">
              CouchCommander
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
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
        <Card className="p-4">
          <div className="text-center text-sm text-muted-foreground mb-3">
            Make sure your laptop and phone are on the same Wi-Fi network
          </div>
          <div className="flex items-center justify-center gap-6">
            <div className="flex items-center gap-2">
              {isConnected ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-destructive" />
              )}
              <Badge variant={isConnected ? "default" : "destructive"}>
                {isConnected ? "Online" : "Offline"}
              </Badge>
            </div>
            {serverIP && (
              <div className="flex items-center gap-2">
                <span className="text-sm">📡</span>
                <code className="text-sm font-mono text-primary">
                  {serverIP}
                </code>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}

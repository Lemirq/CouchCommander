"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Wifi, WifiOff, Unplug } from "lucide-react";

interface ConnectionStatusProps {
  isConnected: boolean;
  serverIP?: string;
  onConnect: (ip: string) => void;
  onDisconnect: () => void;
}

export function ConnectionStatus({
  isConnected,
  serverIP,
  onConnect,
  onDisconnect,
}: ConnectionStatusProps) {
  const [ipInput, setIpInput] = useState("192.168.2.50");
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    if (!ipInput.trim()) return;

    setIsConnecting(true);
    try {
      await onConnect(ipInput.trim());
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    onDisconnect();
    setIpInput("");
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isConnected ? (
              <Wifi className="h-5 w-5 text-green-500" />
            ) : (
              <WifiOff className="h-5 w-5 text-muted-foreground" />
            )}
            <span>Connection Status</span>
          </div>
          <Badge variant={isConnected ? "default" : "secondary"}>
            {isConnected
              ? "Connected"
              : isConnecting
                ? "Connecting..."
                : "Disconnected"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isConnected && serverIP && (
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Connected to:</p>
              <code className="text-sm font-mono text-primary">{serverIP}</code>
            </div>
            <Button onClick={handleDisconnect} variant="destructive" size="sm">
              <Unplug className="h-4 w-4 mr-2" />
              Disconnect
            </Button>
          </div>
        )}

        {!isConnected && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="server-ip">Server IP Address</Label>
              <div className="flex gap-2">
                <Input
                  id="server-ip"
                  type="text"
                  value={ipInput}
                  onChange={(e) => setIpInput(e.target.value)}
                  placeholder="192.168.1.100"
                  onKeyPress={(e) => e.key === "Enter" && handleConnect()}
                  disabled={isConnecting}
                />
                <Button
                  size="sm"
                  onClick={handleConnect}
                  disabled={isConnecting || !ipInput.trim()}
                >
                  {isConnecting ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    "Connect"
                  )}
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Make sure your laptop and phone are on the same Wi-Fi network
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

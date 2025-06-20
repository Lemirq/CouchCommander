import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wifi, WifiOff, Server } from "lucide-react";

interface ConnectionStatusProps {
  isConnected: boolean;
  serverIP?: string;
  clientCount?: number;
  onToggleConnection?: () => void;
  isToggling?: boolean;
}

export function ConnectionStatus({
  isConnected,
  serverIP,
  clientCount = 0,
  onToggleConnection,
  isToggling = false,
}: ConnectionStatusProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Server className="h-5 w-5" />
          Connection Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-destructive" />
            )}
            <Badge variant={isConnected ? "default" : "destructive"}>
              {isConnected ? "Connected" : "Disconnected"}
            </Badge>
          </div>
          {onToggleConnection && (
            <Button
              variant={isConnected ? "destructive" : "default"}
              size="sm"
              onClick={onToggleConnection}
              disabled={isToggling}
            >
              {isToggling ? (
                "Toggling..."
              ) : isConnected ? (
                "Disconnect"
              ) : (
                "Connect"
              )}
            </Button>
          )}
        </div>

        {isConnected && serverIP && (
          <div className="space-y-2 pt-2 border-t">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Server IP:</span>
              <code className="text-xs bg-muted px-2 py-1 rounded">
                {serverIP}
              </code>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Connected Devices:
              </span>
              <Badge variant="secondary">{clientCount}</Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

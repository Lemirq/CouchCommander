"use client";

import { useState } from "react";

interface ConnectionStatusProps {
  isConnected: boolean;
  serverIP?: string;
  onConnect: (ip: string) => void;
  onDisconnect: () => void;
}

export default function ConnectionStatus({
  isConnected,
  serverIP,
  onConnect,
  onDisconnect,
}: ConnectionStatusProps) {
  const [ipInput, setIpInput] = useState("");
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
    <div className="glass-card rounded-2xl p-6 mb-6 shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-4 h-4 rounded-full ${
              isConnected ? "bg-hulu-green glow-green" : "bg-red-500"
            } ${isConnecting ? "pulse-green" : ""}`}
          />
          <span className="font-semibold text-hulu-white text-lg">
            {isConnected
              ? "Connected"
              : isConnecting
                ? "Connecting..."
                : "Disconnected"}
          </span>
        </div>
        {isConnected && (
          <button
            onClick={handleDisconnect}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-base hover:bg-red-700 transition-all min-h-[48px] font-medium"
          >
            Disconnect
          </button>
        )}
      </div>

      {isConnected && serverIP && (
        <div className="text-base text-hulu-text-gray">
          Connected to:{" "}
          <span className="font-mono text-hulu-green">{serverIP}</span>
        </div>
      )}

      {!isConnected && (
        <div className="space-y-3">
          <div>
            <label
              htmlFor="server-ip"
              className="block text-base font-medium text-hulu-white mb-2"
            >
              Server IP Address
            </label>
            <div className="flex gap-2">
              <input
                id="server-ip"
                type="text"
                value={ipInput}
                onChange={(e) => setIpInput(e.target.value)}
                placeholder="192.168.1.100"
                className="flex-1 px-4 py-3 input-hulu rounded-lg outline-none text-base min-h-[48px]"
                onKeyPress={(e) => e.key === "Enter" && handleConnect()}
                disabled={isConnecting}
              />
              <button
                onClick={handleConnect}
                disabled={isConnecting || !ipInput.trim()}
                className="px-6 py-3 btn-hulu rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all text-base font-semibold min-h-[48px] min-w-[100px]"
              >
                {isConnecting ? "Connecting..." : "Connect"}
              </button>
            </div>
          </div>
          <div className="text-sm text-hulu-text-gray">
            Make sure your laptop and phone are on the same Wi-Fi network
          </div>
        </div>
      )}
    </div>
  );
}

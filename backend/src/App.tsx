import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

interface ServerStatus {
  running: boolean;
  port: number;
  clients: number;
  local_ip: string | null;
}

interface ConnectionInfo {
  local_ip: string;
  websocket_port: number;
  web_app_port: number;
  web_app_url: string;
  websocket_url: string;
}

function App() {
  const [serverStatus, setServerStatus] = useState<ServerStatus | null>(null);
  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo | null>(
    null,
  );
  const [qrCodeData, setQrCodeData] = useState<string>("");
  useEffect(() => {
    console.log(qrCodeData);
  }, [qrCodeData]);
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [nextJsRunning, setNextJsRunning] = useState(false);
  const [isStartingNextJs, setIsStartingNextJs] = useState(false);

  // Update server status
  const updateServerStatus = async () => {
    try {
      const status = (await invoke("get_server_status")) as ServerStatus;
      setServerStatus(status);
    } catch (error) {
      console.error("Failed to get server status:", error);
    }
  };

  // Check Next.js server status
  const checkNextJsStatus = async () => {
    try {
      const running = (await invoke("check_nextjs_server")) as boolean;
      setNextJsRunning(running);
    } catch (error) {
      console.error("Failed to check Next.js server:", error);
      setNextJsRunning(false);
    }
  };

  // Start Next.js server
  const startNextJsServer = async () => {
    setIsStartingNextJs(true);
    try {
      (await invoke("start_nextjs_server")) as {
        status: string;
        message: string;
      };
      // Wait a moment for the server to start
      setTimeout(() => {
        checkNextJsStatus();
        setIsStartingNextJs(false);
      }, 3000);
    } catch (error) {
      console.error("Failed to start Next.js server:", error);
      setIsStartingNextJs(false);
    }
  };

  // Get connection info and generate QR code
  const updateConnectionInfo = async () => {
    try {
      const info = (await invoke("get_connection_info")) as ConnectionInfo;
      setConnectionInfo(info);

      // Generate QR code for the web app URL
      const qrData = (await invoke("generate_qr_code", {
        url: info.web_app_url,
      })) as string;
      setQrCodeData(qrData);
    } catch (error) {
      console.error("Failed to get connection info:", error);
    }
  };

  // Start server
  const startServer = async () => {
    setIsStarting(true);
    try {
      await invoke("start_websocket_server", { port: 8080 });
      await updateServerStatus();
      await updateConnectionInfo();
    } catch (error) {
      console.error("Failed to start server:", error);
    } finally {
      setIsStarting(false);
    }
  };

  // Stop server
  const stopServer = async () => {
    setIsStopping(true);
    try {
      await invoke("stop_websocket_server");
      await updateServerStatus();
      setQrCodeData("");
    } catch (error) {
      console.error("Failed to stop server:", error);
    } finally {
      setIsStopping(false);
    }
  };

  // Test media control
  const testMediaControl = async (command: string) => {
    try {
      await invoke(command);
    } catch (error) {
      console.error(`Failed to execute ${command}:`, error);
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // Could add a toast notification here
    });
  };

  useEffect(() => {
    updateServerStatus();
    updateConnectionInfo();
    checkNextJsStatus();

    const interval = setInterval(() => {
      updateServerStatus();
      checkNextJsStatus();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app">
      <div className="app-header">
        <div className="header-content">
          <div className="app-title">
            <h1>🎮 CouchCommander</h1>
            <p>Remote control your computer from your phone</p>
          </div>
          <div className="connection-status">
            <div
              className={`status-indicator ${serverStatus?.running ? "online" : "offline"}`}
            >
              <div className="status-dot"></div>
              <span>{serverStatus?.running ? "Online" : "Offline"}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="app-body">
        <div className="main-grid">
          {/* Server Control Panel */}
          <div className="panel server-panel">
            <h2>🖥️ Server Control</h2>
            <div className="server-controls">
              <button
                className={`btn btn-primary ${serverStatus?.running ? "btn-success" : ""}`}
                onClick={serverStatus?.running ? stopServer : startServer}
                disabled={isStarting || isStopping}
              >
                {isStarting ? (
                  <>⏳ Starting...</>
                ) : isStopping ? (
                  <>⏳ Stopping...</>
                ) : serverStatus?.running ? (
                  <>⏹️ Stop Server</>
                ) : (
                  <>▶️ Start Server</>
                )}
              </button>
            </div>

            {serverStatus?.running && (
              <div className="server-info">
                <div className="info-row">
                  <span className="label">Port:</span>
                  <span className="value">{serverStatus.port}</span>
                </div>
                <div className="info-row">
                  <span className="label">IP Address:</span>
                  <span
                    className="value clickable"
                    onClick={() => copyToClipboard(serverStatus.local_ip || "")}
                  >
                    {serverStatus.local_ip || "Detecting..."}
                  </span>
                </div>
                <div className="info-row">
                  <span className="label">Connected Devices:</span>
                  <span className="value">{serverStatus.clients}</span>
                </div>
              </div>
            )}
          </div>

          {/* QR Code Panel */}
          <div className="panel qr-panel">
            <h2>📱 Mobile Connection</h2>

            {/* Next.js Server Status */}
            <div className="nextjs-status">
              <div className="info-row">
                <span className="label">Web App Server:</span>
                <div className="nextjs-controls">
                  <span
                    className={`value ${nextJsRunning ? "success" : "danger"}`}
                  >
                    {nextJsRunning ? "✅ Running" : "❌ Stopped"}
                  </span>
                  {!nextJsRunning && (
                    <button
                      className="btn btn-small btn-primary"
                      onClick={startNextJsServer}
                      disabled={isStartingNextJs}
                    >
                      {isStartingNextJs ? "⏳ Starting..." : "▶️ Start"}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {serverStatus?.running && nextJsRunning && qrCodeData ? (
              <div className="qr-section">
                <div className="qr-code-container">
                  <img src={qrCodeData} alt="QR Code" className="qr-code" />
                </div>
                <div className="qr-instructions">
                  <p>
                    <strong>📲 Connect your phone:</strong>
                  </p>
                  <ol>
                    <li>Open camera app on your phone</li>
                    <li>Point camera at QR code</li>
                    <li>Tap the notification to open</li>
                  </ol>
                  <div className="manual-connection">
                    <p>
                      <strong>Or visit manually:</strong>
                    </p>
                    <div className="url-container">
                      <code
                        className="connection-url"
                        onClick={() =>
                          copyToClipboard(connectionInfo?.web_app_url || "")
                        }
                      >
                        {connectionInfo?.web_app_url}
                      </code>
                      <button
                        className="btn btn-small"
                        onClick={() =>
                          copyToClipboard(connectionInfo?.web_app_url || "")
                        }
                      >
                        📋 Copy
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="qr-placeholder">
                <div className="placeholder-icon">📱</div>
                <p>
                  {!serverStatus?.running
                    ? "Start the WebSocket server first"
                    : !nextJsRunning
                      ? "Start the web app server to generate QR code"
                      : "Generating QR code..."}
                </p>
              </div>
            )}
          </div>

          {/* Quick Test Panel */}
          <div className="panel test-panel">
            <h2>🎵 Quick Test</h2>
            <div className="test-section">
              <h3>Media Controls</h3>
              <div className="control-grid">
                <button
                  className="btn btn-secondary"
                  onClick={() => testMediaControl("play_pause")}
                >
                  ⏯️ Play/Pause
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => testMediaControl("media_previous")}
                >
                  ⏮️ Previous
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => testMediaControl("media_next")}
                >
                  ⏭️ Next
                </button>
              </div>
            </div>
            <div className="test-section">
              <h3>Volume Controls</h3>
              <div className="control-grid">
                <button
                  className="btn btn-secondary"
                  onClick={() => testMediaControl("volume_up")}
                >
                  🔊 Volume +
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => testMediaControl("volume_down")}
                >
                  🔉 Volume -
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => testMediaControl("volume_mute")}
                >
                  🔇 Mute
                </button>
              </div>
            </div>
          </div>

          {/* Network Info Panel */}
          <div className="panel network-panel">
            <h2>🌐 Network Information</h2>
            {connectionInfo && (
              <div className="network-info">
                <div className="info-section">
                  <h3>Connection Details</h3>
                  <div className="info-row">
                    <span className="label">WebSocket:</span>
                    <span className="value small">
                      {connectionInfo.websocket_url}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="label">Web App:</span>
                    <span className="value small">
                      {connectionInfo.web_app_url}
                    </span>
                  </div>
                </div>
                <div className="network-requirements">
                  <p>
                    <strong>📡 Requirements:</strong>
                  </p>
                  <ul>
                    <li>Computer and phone on same Wi-Fi network</li>
                    <li>
                      Firewall allows connections on port{" "}
                      {connectionInfo.websocket_port}
                    </li>
                    <li>
                      Web app server running on port{" "}
                      {connectionInfo.web_app_port}{" "}
                      <span className={nextJsRunning ? "success" : "danger"}>
                        ({nextJsRunning ? "Running" : "Stopped"})
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="app-footer">
        <p>
          Make sure your phone and computer are connected to the same Wi-Fi
          network
        </p>
      </div>
    </div>
  );
}

export default App;

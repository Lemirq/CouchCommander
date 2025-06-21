import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Gamepad2, Wifi, WifiOff, Server, Smartphone, Network, TestTube2 } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import './App.css';

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
	const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo | null>(null);
	const [qrCodeData, setQrCodeData] = useState<string>('');
	const [isStarting, setIsStarting] = useState(false);
	const [isStopping, setIsStopping] = useState(false);
	const [nextJsRunning, setNextJsRunning] = useState(false);
	const [isStartingNextJs, setIsStartingNextJs] = useState(false);

	// Update server status
	const updateServerStatus = async () => {
		try {
			const status = (await invoke('get_server_status')) as ServerStatus;
			setServerStatus(status);
		} catch (error) {
			console.error('Failed to get server status:', error);
		}
	};

	// Check Next.js server status
	const checkNextJsStatus = async () => {
		try {
			const running = (await invoke('check_nextjs_server')) as boolean;
			setNextJsRunning(running);
		} catch (error) {
			console.error('Failed to check Next.js server:', error);
			setNextJsRunning(false);
		}
	};

	// Start Next.js server
	const startNextJsServer = async () => {
		setIsStartingNextJs(true);
		try {
			await invoke('start_nextjs_server');
			setTimeout(() => {
				checkNextJsStatus();
				setIsStartingNextJs(false);
			}, 3000);
		} catch (error) {
			console.error('Failed to start Next.js server:', error);
			setIsStartingNextJs(false);
		}
	};

	// Get connection info and generate QR code
	const updateConnectionInfo = async () => {
		try {
			const info = (await invoke('get_connection_info')) as ConnectionInfo;
			setConnectionInfo(info);

			// Generate QR code for the web app URL
			const qrData = (await invoke('generate_qr_code', {
				url: info.web_app_url,
			})) as string;
			setQrCodeData(qrData);
		} catch (error) {
			console.error('Failed to get connection info:', error);
		}
	};

	// Start server (now automatically starts frontend too)
	const startServer = async () => {
		setIsStarting(true);
		setIsStartingNextJs(true);
		try {
			// Start WebSocket server (which now also starts Next.js automatically)
			await invoke('start_websocket_server', { port: 8080 });
			await updateServerStatus();
			await updateConnectionInfo();

			// Check Next.js status after a delay to allow it to start
			setTimeout(async () => {
				await checkNextJsStatus();
				setIsStartingNextJs(false);
			}, 3000);
		} catch (error) {
			console.error('Failed to start server:', error);
			setIsStartingNextJs(false);
		} finally {
			setIsStarting(false);
		}
	};

	// Stop server (now automatically stops frontend too)
	const stopServer = async () => {
		setIsStopping(true);
		setIsStartingNextJs(true);
		try {
			await invoke('stop_websocket_server');
			await updateServerStatus();
			setQrCodeData('');

			// Check Next.js status after a delay to confirm it stopped
			setTimeout(async () => {
				await checkNextJsStatus();
				setIsStartingNextJs(false);
			}, 2000);
		} catch (error) {
			console.error('Failed to stop server:', error);
			setIsStartingNextJs(false);
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
			{/* Header */}
			<div className="app-header">
				<div className="header-content">
					<div className="app-title">
						<h1>
							<Gamepad2 className="h-8 w-8" />
							CouchCommander
						</h1>
						<p>Remote control your computer from your phone</p>
					</div>
					<div className="connection-status">
						<div className="flex items-center gap-4">
							<ThemeToggle />
							<div className={`status-indicator ${serverStatus?.running ? 'online' : 'offline'}`}>
								<div className="status-dot"></div>
								{serverStatus?.running ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
								<Badge variant={serverStatus?.running ? 'default' : 'destructive'}>
									{serverStatus?.running ? 'Online' : 'Offline'}
								</Badge>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div className="app-body">
				<div className="main-grid">
					{/* Server Control Panel */}
					<Card className="panel">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Server className="h-5 w-5" />
								Server Control
							</CardTitle>
							<CardDescription>Manage the WebSocket server and frontend for device connections</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="server-controls">
								<Button
									className={serverStatus?.running ? 'btn-success' : 'btn-primary'}
									onClick={serverStatus?.running ? stopServer : startServer}
									disabled={isStarting || isStopping}
									size="lg"
								>
									{isStarting ? (
										<>⏳ Starting Both Servers...</>
									) : isStopping ? (
										<>⏳ Stopping...</>
									) : serverStatus?.running ? (
										<>⏹️ Stop Servers</>
									) : (
										<>▶️ Start Servers</>
									)}
								</Button>
							</div>

							{!serverStatus?.running && (
								<div className="text-xs text-muted-foreground mt-2 p-2 bg-muted/50 rounded">
									ℹ️ Starting the server will automatically launch both the WebSocket server and the mobile web app
								</div>
							)}

							{serverStatus?.running && (
								<div className="server-info">
									<div className="info-row">
										<span className="label">Port:</span>
										<Badge variant="outline">{serverStatus.port}</Badge>
									</div>
									<div className="info-row">
										<span className="label">IP Address:</span>
										<Button
											variant="ghost"
											size="sm"
											className="value clickable h-auto p-0 font-mono text-xs"
											onClick={() => copyToClipboard(serverStatus.local_ip || '')}
										>
											{serverStatus.local_ip || 'Detecting...'}
										</Button>
									</div>
									<div className="info-row">
										<span className="label">Connected Devices:</span>
										<Badge variant="secondary">{serverStatus.clients}</Badge>
									</div>
								</div>
							)}
						</CardContent>
					</Card>

					{/* QR Code Panel */}
					<Card className="panel">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Smartphone className="h-5 w-5" />
								Mobile Connection
							</CardTitle>
							<CardDescription>Connect your phone to control your computer</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							{/* Next.js Server Status */}
							<div className="nextjs-status">
								<div className="info-row">
									<span className="label">Web App Server:</span>
									<div className="nextjs-controls">
										<Badge variant={!isStartingNextJs ? 'secondary' : 'destructive'} className="value">
											{isStartingNextJs ? '⏳ Starting...' : nextJsRunning ? '✅ Running' : '❌ Stopped'}
										</Badge>
										{!nextJsRunning && !serverStatus?.running && !isStartingNextJs && (
											<Button size="sm" onClick={startNextJsServer} disabled={isStartingNextJs}>
												▶️ Start Manually
											</Button>
										)}
									</div>
								</div>
								{serverStatus?.running && (
									<p className="text-xs text-muted-foreground mt-1">ℹ️ Web app server starts automatically with WebSocket server</p>
								)}
							</div>

							<Separator />

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
												<Button
													variant="outline"
													className="connection-url"
													onClick={() => copyToClipboard(connectionInfo?.web_app_url || '')}
												>
													{connectionInfo?.web_app_url}
												</Button>
												<Button size="sm" onClick={() => copyToClipboard(connectionInfo?.web_app_url || '')}>
													📋 Copy
												</Button>
											</div>
										</div>
									</div>
								</div>
							) : (
								<div className="qr-placeholder">
									<div className="placeholder-icon">📱</div>
									<p className="text-muted-foreground text-center">
										{!serverStatus?.running
											? 'Start the WebSocket server first'
											: !nextJsRunning
											? 'Start the web app server to generate QR code'
											: 'Generating QR code...'}
									</p>
								</div>
							)}
						</CardContent>
					</Card>

					{/* Quick Test Panel */}
					<Card className="panel">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<TestTube2 className="h-5 w-5" />
								Quick Test
							</CardTitle>
							<CardDescription>Test media and volume controls</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							<div className="test-section">
								<h3>Media Controls</h3>
								<div className="control-grid">
									<Button variant="secondary" size="sm" onClick={() => testMediaControl('play_pause')}>
										⏯️ Play/Pause
									</Button>
									<Button variant="secondary" size="sm" onClick={() => testMediaControl('media_previous')}>
										⏮️ Previous
									</Button>
									<Button variant="secondary" size="sm" onClick={() => testMediaControl('media_next')}>
										⏭️ Next
									</Button>
								</div>
							</div>
							<div className="test-section">
								<h3>Volume Controls</h3>
								<div className="control-grid">
									<Button variant="secondary" size="sm" onClick={() => testMediaControl('volume_up')}>
										🔊 Volume +
									</Button>
									<Button variant="secondary" size="sm" onClick={() => testMediaControl('volume_down')}>
										🔉 Volume -
									</Button>
									<Button variant="secondary" size="sm" onClick={() => testMediaControl('volume_mute')}>
										🔇 Mute
									</Button>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Network Info Panel */}
					<Card className="panel">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Network className="h-5 w-5" />
								Network Information
							</CardTitle>
							<CardDescription>Connection details and requirements</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							{connectionInfo && (
								<div className="network-info">
									<div className="info-section">
										<h3>Connection Details</h3>
										<div className="space-y-2">
											<div className="info-row">
												<span className="label">WebSocket:</span>
												<code className="value small text-xs bg-muted px-2 py-1 rounded">{connectionInfo.websocket_url}</code>
											</div>
											<div className="info-row">
												<span className="label">Web App:</span>
												<code className="value small text-xs bg-muted px-2 py-1 rounded">{connectionInfo.web_app_url}</code>
											</div>
										</div>
									</div>

									<Separator />

									<div className="network-requirements">
										<p className="font-medium mb-2">
											<strong>📡 Requirements:</strong>
										</p>
										<ul className="space-y-1 text-sm text-muted-foreground">
											<li>• Computer and phone on same Wi-Fi network</li>
											<li>
												• Firewall allows connections on port{' '}
												<Badge variant="outline" className="text-xs">
													{connectionInfo.websocket_port}
												</Badge>
											</li>
											<li className="flex items-center gap-2">
												• Web app server running on port{' '}
												<Badge variant="outline" className="text-xs">
													{connectionInfo.web_app_port}
												</Badge>
												<Badge variant={nextJsRunning ? 'default' : 'destructive'} className="text-xs">
													{nextJsRunning ? 'Running' : 'Stopped'}
												</Badge>
											</li>
										</ul>
									</div>
								</div>
							)}
						</CardContent>
					</Card>
				</div>
			</div>

			<div className="app-footer">
				<p>Make sure your phone and computer are connected to the same Wi-Fi network</p>
			</div>
		</div>
	);
}

export default App;

import { useState, useEffect } from 'react';
import reactLogo from './assets/react.svg';
import { invoke } from '@tauri-apps/api/core';
import './App.css';

interface ServerStatus {
	running: boolean;
	port: number;
	clients: number;
	local_ip: string | null;
}

function App() {
	const [greetMsg, setGreetMsg] = useState('');
	const [name, setName] = useState('');
	const [serverStatus, setServerStatus] = useState<ServerStatus | null>(null);
	const [serverPort, setServerPort] = useState('8080');

	async function greet() {
		setGreetMsg(await invoke('greet', { name }));
	}

	async function startServer() {
		try {
			const result = await invoke('start_websocket_server', {
				port: parseInt(serverPort),
			});
			console.log('Server start result:', result);
			await updateServerStatus();
		} catch (error) {
			console.error('Failed to start server:', error);
		}
	}

	async function stopServer() {
		try {
			const result = await invoke('stop_websocket_server');
			console.log('Server stop result:', result);
			await updateServerStatus();
		} catch (error) {
			console.error('Failed to stop server:', error);
		}
	}

	async function updateServerStatus() {
		try {
			const status = (await invoke('get_server_status')) as ServerStatus;
			setServerStatus(status);
		} catch (error) {
			console.error('Failed to get server status:', error);
		}
	}

	async function testMediaControl(command: string) {
		try {
			const result = await invoke(command);
			console.log(`${command} result:`, result);
		} catch (error) {
			console.error(`Failed to execute ${command}:`, error);
		}
	}

	useEffect(() => {
		updateServerStatus();
		const interval = setInterval(updateServerStatus, 2000);
		return () => clearInterval(interval);
	}, []);

	return (
		<main className="container">
			<h1>CouchCommander Server</h1>

			<div className="server-section">
				<h2>WebSocket Server</h2>
				<div className="server-controls">
					<input
						type="number"
						value={serverPort}
						onChange={(e) => setServerPort(e.target.value)}
						placeholder="Port"
						style={{ width: '100px', marginRight: '10px' }}
					/>
					<button onClick={startServer} disabled={serverStatus?.running}>
						Start Server
					</button>
					<button onClick={stopServer} disabled={!serverStatus?.running}>
						Stop Server
					</button>
				</div>

				{serverStatus && (
					<div className="server-status">
						<p>
							<strong>Status:</strong> {serverStatus.running ? 'Running' : 'Stopped'}
						</p>
						{serverStatus.running && (
							<>
								<p>
									<strong>Port:</strong> {serverStatus.port}
								</p>
								<p>
									<strong>Local IP:</strong> {serverStatus.local_ip || 'Unknown'}
								</p>
								<p>
									<strong>Connected Clients:</strong> {serverStatus.clients}
								</p>
								{serverStatus.local_ip && (
									<p>
										<strong>WebSocket URL:</strong> ws://{serverStatus.local_ip}:{serverStatus.port}
									</p>
								)}
							</>
						)}
					</div>
				)}
			</div>

			<div className="media-controls">
				<h2>Media Control Test</h2>
				<div className="control-buttons">
					<button onClick={() => testMediaControl('play_pause')}>Play/Pause</button>
					<button onClick={() => testMediaControl('media_previous')}>Previous</button>
					<button onClick={() => testMediaControl('media_next')}>Next</button>
				</div>
				<div className="volume-controls">
					<button onClick={() => testMediaControl('volume_up')}>Volume +</button>
					<button onClick={() => testMediaControl('volume_down')}>Volume -</button>
					<button onClick={() => testMediaControl('volume_mute')}>Mute</button>
				</div>
			</div>

			<div className="row">
				<a href="https://vitejs.dev" target="_blank">
					<img src="/vite.svg" className="logo vite" alt="Vite logo" />
				</a>
				<a href="https://tauri.app" target="_blank">
					<img src="/tauri.svg" className="logo tauri" alt="Tauri logo" />
				</a>
				<a href="https://reactjs.org" target="_blank">
					<img src={reactLogo} className="logo react" alt="React logo" />
				</a>
			</div>

			<form
				className="row"
				onSubmit={(e) => {
					e.preventDefault();
					greet();
				}}
			>
				<input id="greet-input" onChange={(e) => setName(e.currentTarget.value)} placeholder="Enter a name..." />
				<button type="submit">Greet</button>
			</form>
			<p>{greetMsg}</p>
		</main>
	);
}

export default App;

use enigo::{Enigo, Key, Keyboard, Settings, Direction};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::runtime::Runtime;

mod websocket;
use websocket::WebSocketServer;

#[derive(Debug, Serialize, Deserialize)]
pub struct CommandResponse {
    pub status: String,
    pub message: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ServerStatus {
    pub running: bool,
    pub port: u16,
    pub clients: usize,
    pub local_ip: Option<String>,
}

// Global WebSocket server state
static mut WEBSOCKET_SERVER: Option<Arc<WebSocketServer>> = None;
static mut RUNTIME: Option<Arc<Runtime>> = None;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

// Simple media control commands
#[tauri::command]
async fn play_pause() -> Result<CommandResponse, String> {
    let mut enigo = Enigo::new(&Settings::default()).map_err(|e| format!("Failed to initialize input: {}", e))?;
    
    // Send spacebar key (universal play/pause shortcut)
    enigo.key(Key::Space, Direction::Click).map_err(|e| format!("Failed to send key: {}", e))?;
    
    Ok(CommandResponse {
        status: "success".to_string(),
        message: "Play/pause command sent".to_string(),
    })
}

#[tauri::command]
async fn media_previous() -> Result<CommandResponse, String> {
    let mut enigo = Enigo::new(&Settings::default()).map_err(|e| format!("Failed to initialize input: {}", e))?;
    
    // Send left arrow key (common previous shortcut in media players)
    enigo.key(Key::LeftArrow, Direction::Click).map_err(|e| format!("Failed to send key: {}", e))?;
    
    Ok(CommandResponse {
        status: "success".to_string(),
        message: "Previous track command sent".to_string(),
    })
}

#[tauri::command]
async fn media_next() -> Result<CommandResponse, String> {
    let mut enigo = Enigo::new(&Settings::default()).map_err(|e| format!("Failed to initialize input: {}", e))?;
    
    // Send right arrow key (common next shortcut in media players)
    enigo.key(Key::RightArrow, Direction::Click).map_err(|e| format!("Failed to send key: {}", e))?;
    
    Ok(CommandResponse {
        status: "success".to_string(),
        message: "Next track command sent".to_string(),
    })
}

#[tauri::command]
async fn volume_up() -> Result<CommandResponse, String> {
    let mut enigo = Enigo::new(&Settings::default()).map_err(|e| format!("Failed to initialize input: {}", e))?;
    
    // Send volume up key
    enigo.key(Key::VolumeUp, Direction::Click).map_err(|e| format!("Failed to send key: {}", e))?;
    
    Ok(CommandResponse {
        status: "success".to_string(),
        message: "Volume up command sent".to_string(),
    })
}

#[tauri::command]
async fn volume_down() -> Result<CommandResponse, String> {
    let mut enigo = Enigo::new(&Settings::default()).map_err(|e| format!("Failed to initialize input: {}", e))?;
    
    // Send volume down key
    enigo.key(Key::VolumeDown, Direction::Click).map_err(|e| format!("Failed to send key: {}", e))?;
    
    Ok(CommandResponse {
        status: "success".to_string(),
        message: "Volume down command sent".to_string(),
    })
}

#[tauri::command]
async fn volume_mute() -> Result<CommandResponse, String> {
    let mut enigo = Enigo::new(&Settings::default()).map_err(|e| format!("Failed to initialize input: {}", e))?;
    
    // Send mute key
    enigo.key(Key::VolumeMute, Direction::Click).map_err(|e| format!("Failed to send key: {}", e))?;
    
    Ok(CommandResponse {
        status: "success".to_string(),
        message: "Mute command sent".to_string(),
    })
}

// Generic key sending command for flexibility
#[tauri::command]
async fn send_key(key_name: String) -> Result<CommandResponse, String> {
    let mut enigo = Enigo::new(&Settings::default()).map_err(|e| format!("Failed to initialize input: {}", e))?;
    
    let key = match key_name.to_lowercase().as_str() {
        "space" => Key::Space,
        "enter" => Key::Return,
        "escape" => Key::Escape,
        "left" => Key::LeftArrow,
        "right" => Key::RightArrow,
        "up" => Key::UpArrow,
        "down" => Key::DownArrow,
        "f" => Key::Unicode('f'), // Fullscreen in many players
        "k" => Key::Unicode('k'), // Pause/play in YouTube
        "j" => Key::Unicode('j'), // Rewind in YouTube
        "l" => Key::Unicode('l'), // Fast forward in YouTube
        _ => return Err(format!("Unsupported key: {}", key_name)),
    };
    
    enigo.key(key, Direction::Click).map_err(|e| format!("Failed to send key: {}", e))?;
    
    Ok(CommandResponse {
        status: "success".to_string(),
        message: format!("Key '{}' sent successfully", key_name),
    })
}

// Open website command
#[tauri::command]
async fn open_website(url: String) -> Result<CommandResponse, String> {
    // Basic URL validation
    if !url.starts_with("http://") && !url.starts_with("https://") {
        return Err("Invalid URL: must start with http:// or https://".to_string());
    }
    
    // Use system default to open URL
    #[cfg(target_os = "macos")]
    let cmd = "open";
    #[cfg(target_os = "windows")]
    let cmd = "start";
    #[cfg(target_os = "linux")]
    let cmd = "xdg-open";
    
    std::process::Command::new(cmd)
        .arg(&url)
        .spawn()
        .map_err(|e| format!("Failed to open URL: {}", e))?;
    
    Ok(CommandResponse {
        status: "success".to_string(),
        message: format!("Opened website: {}", url),
    })
}

// WebSocket Server Commands
#[tauri::command]
async fn start_websocket_server(port: Option<u16>) -> Result<CommandResponse, String> {
    let server_port = port.unwrap_or(8080);
    
    unsafe {
        if WEBSOCKET_SERVER.is_some() {
            return Ok(CommandResponse {
                status: "info".to_string(),
                message: "WebSocket server is already running".to_string(),
            });
        }

        // Initialize runtime if not exists
        if RUNTIME.is_none() {
            let rt = Runtime::new().map_err(|e| format!("Failed to create runtime: {}", e))?;
            RUNTIME = Some(Arc::new(rt));
        }

        let server = Arc::new(WebSocketServer::new(server_port));
        WEBSOCKET_SERVER = Some(Arc::clone(&server));
        
        let server_clone = Arc::clone(&server);
        if let Some(rt) = &RUNTIME {
            rt.spawn(async move {
                if let Err(e) = server_clone.start().await {
                    eprintln!("WebSocket server error: {}", e);
                }
            });
        }
    }
    
    Ok(CommandResponse {
        status: "success".to_string(),
        message: format!("WebSocket server started on port {}", server_port),
    })
}

#[tauri::command]
async fn stop_websocket_server() -> Result<CommandResponse, String> {
    unsafe {
        if WEBSOCKET_SERVER.is_none() {
            return Ok(CommandResponse {
                status: "info".to_string(),
                message: "WebSocket server is not running".to_string(),
            });
        }

        WEBSOCKET_SERVER = None;
        // Note: In a production app, you'd want to properly shutdown the server
        // For now, we'll just remove the reference
    }
    
    Ok(CommandResponse {
        status: "success".to_string(),
        message: "WebSocket server stopped".to_string(),
    })
}

#[tauri::command]
async fn get_server_status() -> Result<ServerStatus, String> {
    let local_ip = get_local_ip();
    
    unsafe {
        if let Some(server) = &WEBSOCKET_SERVER {
            Ok(ServerStatus {
                running: true,
                port: server.addr.port(),
                clients: server.get_client_count(),
                local_ip,
            })
        } else {
            Ok(ServerStatus {
                running: false,
                port: 0,
                clients: 0,
                local_ip,
            })
        }
    }
}

#[tauri::command]
async fn broadcast_message(message: String) -> Result<CommandResponse, String> {
    unsafe {
        if let Some(server) = &WEBSOCKET_SERVER {
            server.broadcast_message(&message).map_err(|e| e.to_string())?;
            Ok(CommandResponse {
                status: "success".to_string(),
                message: "Message broadcasted to all clients".to_string(),
            })
        } else {
            Err("WebSocket server is not running".to_string())
        }
    }
}

fn get_local_ip() -> Option<String> {
    use std::net::UdpSocket;
    
    // Try to get local IP by connecting to a remote address
    if let Ok(socket) = UdpSocket::bind("0.0.0.0:0") {
        if socket.connect("8.8.8.8:80").is_ok() {
            if let Ok(addr) = socket.local_addr() {
                return Some(addr.ip().to_string());
            }
        }
    }
    
    // Fallback: try to get local IP from network interfaces
    #[cfg(target_os = "macos")]
    {
        if let Ok(output) = std::process::Command::new("ifconfig")
            .arg("en0")
            .output() {
            let output_str = String::from_utf8_lossy(&output.stdout);
            for line in output_str.lines() {
                if line.trim().starts_with("inet ") && !line.contains("127.0.0.1") {
                    if let Some(ip) = line.split_whitespace().nth(1) {
                        return Some(ip.to_string());
                    }
                }
            }
        }
    }
    
    None
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            play_pause,
            media_previous,
            media_next,
            volume_up,
            volume_down,
            volume_mute,
            send_key,
            open_website,
            start_websocket_server,
            stop_websocket_server,
            get_server_status,
            broadcast_message
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

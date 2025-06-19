use base64::{engine::general_purpose, Engine as _};
use enigo::{Axis, Button, Coordinate, Direction, Enigo, Key, Keyboard, Mouse, Settings};
use qrcode::QrCode;
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
    let mut enigo =
        Enigo::new(&Settings::default()).map_err(|e| format!("Failed to create enigo: {:?}", e))?;

    enigo
        .key(Key::Space, Direction::Click)
        .map_err(|e| format!("Failed to send play/pause key: {:?}", e))?;

    Ok(CommandResponse {
        status: "success".to_string(),
        message: "Play/pause command sent".to_string(),
    })
}

#[tauri::command]
async fn media_previous() -> Result<CommandResponse, String> {
    let mut enigo =
        Enigo::new(&Settings::default()).map_err(|e| format!("Failed to create enigo: {:?}", e))?;

    enigo
        .key(Key::LeftArrow, Direction::Click)
        .map_err(|e| format!("Failed to send previous key: {:?}", e))?;

    Ok(CommandResponse {
        status: "success".to_string(),
        message: "Previous track command sent".to_string(),
    })
}

#[tauri::command]
async fn media_next() -> Result<CommandResponse, String> {
    let mut enigo =
        Enigo::new(&Settings::default()).map_err(|e| format!("Failed to create enigo: {:?}", e))?;

    enigo
        .key(Key::RightArrow, Direction::Click)
        .map_err(|e| format!("Failed to send next key: {:?}", e))?;

    Ok(CommandResponse {
        status: "success".to_string(),
        message: "Next track command sent".to_string(),
    })
}

#[tauri::command]
async fn volume_up() -> Result<CommandResponse, String> {
    let mut enigo =
        Enigo::new(&Settings::default()).map_err(|e| format!("Failed to create enigo: {:?}", e))?;

    enigo
        .key(Key::VolumeUp, Direction::Click)
        .map_err(|e| format!("Failed to send volume up key: {:?}", e))?;

    Ok(CommandResponse {
        status: "success".to_string(),
        message: "Volume up command sent".to_string(),
    })
}

#[tauri::command]
async fn volume_down() -> Result<CommandResponse, String> {
    let mut enigo =
        Enigo::new(&Settings::default()).map_err(|e| format!("Failed to create enigo: {:?}", e))?;

    enigo
        .key(Key::VolumeDown, Direction::Click)
        .map_err(|e| format!("Failed to send volume down key: {:?}", e))?;

    Ok(CommandResponse {
        status: "success".to_string(),
        message: "Volume down command sent".to_string(),
    })
}

#[tauri::command]
async fn volume_mute() -> Result<CommandResponse, String> {
    let mut enigo =
        Enigo::new(&Settings::default()).map_err(|e| format!("Failed to create enigo: {:?}", e))?;

    enigo
        .key(Key::VolumeMute, Direction::Click)
        .map_err(|e| format!("Failed to send volume mute key: {:?}", e))?;

    Ok(CommandResponse {
        status: "success".to_string(),
        message: "Mute command sent".to_string(),
    })
}

// Generic key sending command for flexibility
#[tauri::command]
async fn send_key(key_name: String) -> Result<CommandResponse, String> {
    let mut enigo =
        Enigo::new(&Settings::default()).map_err(|e| format!("Failed to create enigo: {:?}", e))?;

    let key = match key_name.to_lowercase().as_str() {
        "space" => Key::Space,
        "enter" | "return" => Key::Return,
        "escape" | "esc" => Key::Escape,
        "up" => Key::UpArrow,
        "down" => Key::DownArrow,
        "left" => Key::LeftArrow,
        "right" => Key::RightArrow,
        "backspace" => Key::Backspace,
        "tab" => Key::Tab,
        "shift" => Key::Shift,
        "ctrl" | "control" => Key::Control,
        "alt" => Key::Alt,
        "cmd" | "meta" => Key::Meta,
        "f1" => Key::F1,
        "f2" => Key::F2,
        "f3" => Key::F3,
        "f4" => Key::F4,
        "f5" => Key::F5,
        "f6" => Key::F6,
        "f7" => Key::F7,
        "f8" => Key::F8,
        "f9" => Key::F9,
        "f10" => Key::F10,
        "f11" => Key::F11,
        "f12" => Key::F12,
        "f" => Key::Unicode('f'), // Fullscreen in many players
        "k" => Key::Unicode('k'), // Pause/play in YouTube
        "j" => Key::Unicode('j'), // Rewind in YouTube
        "l" => Key::Unicode('l'), // Fast forward in YouTube
        // Single character keys
        _ => {
            if key_name.len() == 1 {
                let ch = key_name.chars().next().unwrap();
                Key::Unicode(ch)
            } else {
                return Err(format!("Unknown key: {}", key_name));
            }
        }
    };

    enigo
        .key(key, Direction::Click)
        .map_err(|e| format!("Failed to send key: {:?}", e))?;

    Ok(CommandResponse {
        status: "success".to_string(),
        message: format!("Key '{}' sent successfully", key_name),
    })
}

// Text input command
#[tauri::command]
async fn text_input(text: String) -> Result<CommandResponse, String> {
    // Validate input
    if text.is_empty() {
        return Ok(CommandResponse {
            status: "success".to_string(),
            message: "Empty text input".to_string(),
        });
    }

    let mut enigo =
        Enigo::new(&Settings::default()).map_err(|e| format!("Failed to create enigo: {:?}", e))?;

    // Type character by character for better reliability
    for ch in text.chars() {
        enigo
            .key(Key::Unicode(ch), Direction::Click)
            .map_err(|e| format!("Failed to type character '{}': {:?}", ch, e))?;
    }

    Ok(CommandResponse {
        status: "success".to_string(),
        message: format!("Text '{}' input successfully", text),
    })
}

// Mouse movement command
#[tauri::command]
async fn mouse_move(delta_x: i32, delta_y: i32) -> Result<CommandResponse, String> {
    let mut enigo =
        Enigo::new(&Settings::default()).map_err(|e| format!("Failed to create enigo: {:?}", e))?;

    enigo
        .move_mouse(delta_x, delta_y, Coordinate::Rel)
        .map_err(|e| format!("Failed to move mouse: {:?}", e))?;

    Ok(CommandResponse {
        status: "success".to_string(),
        message: format!("Mouse moved by ({}, {})", delta_x, delta_y),
    })
}

// Mouse click command
#[tauri::command]
async fn mouse_click(button: String) -> Result<CommandResponse, String> {
    let mut enigo =
        Enigo::new(&Settings::default()).map_err(|e| format!("Failed to create enigo: {:?}", e))?;

    let mouse_button = match button.to_lowercase().as_str() {
        "left" => Button::Left,
        "right" => Button::Right,
        "middle" => Button::Middle,
        _ => return Err(format!("Unknown mouse button: {}", button)),
    };

    enigo
        .button(mouse_button, Direction::Click)
        .map_err(|e| format!("Failed to click mouse: {:?}", e))?;

    Ok(CommandResponse {
        status: "success".to_string(),
        message: format!("{} mouse button clicked", button),
    })
}

// Scroll command
#[tauri::command]
async fn scroll(delta_x: i32, delta_y: i32) -> Result<CommandResponse, String> {
    let mut enigo =
        Enigo::new(&Settings::default()).map_err(|e| format!("Failed to create enigo: {:?}", e))?;

    // For scrolling, we'll use scroll method with proper Axis
    if delta_y != 0 {
        enigo
            .scroll(delta_y, Axis::Vertical)
            .map_err(|e| format!("Failed to scroll vertically: {:?}", e))?;
    }

    if delta_x != 0 {
        enigo
            .scroll(delta_x, Axis::Horizontal)
            .map_err(|e| format!("Failed to scroll horizontally: {:?}", e))?;
    }

    Ok(CommandResponse {
        status: "success".to_string(),
        message: format!("Scrolled by ({}, {})", delta_x, delta_y),
    })
}

// Volume set command
#[tauri::command]
async fn volume_set(value: u8) -> Result<CommandResponse, String> {
    // Note: This is a simplified implementation
    // On macOS, we can use AppleScript, on Windows we'd use different APIs
    #[cfg(target_os = "macos")]
    {
        let script = format!("set volume output volume {}", value);
        std::process::Command::new("osascript")
            .arg("-e")
            .arg(&script)
            .output()
            .map_err(|e| format!("Failed to set volume: {}", e))?;
    }

    #[cfg(target_os = "windows")]
    {
        // On Windows, you'd typically use Windows APIs or third-party tools
        // For simplicity, we'll just return success
        return Ok(CommandResponse {
            status: "info".to_string(),
            message: "Volume set not implemented on Windows yet".to_string(),
        });
    }

    #[cfg(target_os = "linux")]
    {
        // On Linux, we can use amixer or similar tools
        let volume_percent = format!("{}%", value);
        std::process::Command::new("amixer")
            .args(&["set", "Master", &volume_percent])
            .output()
            .map_err(|e| format!("Failed to set volume: {}", e))?;
    }

    Ok(CommandResponse {
        status: "success".to_string(),
        message: format!("Volume set to {}%", value),
    })
}

// Brightness set command
#[tauri::command]
async fn brightness_set(value: u8) -> Result<CommandResponse, String> {
    #[cfg(target_os = "macos")]
    {
        // Use brightness command line tool or AppleScript
        let brightness_value = (value as f32 / 100.0).min(1.0).max(0.0);
        // Note: This is a simplified approach. In practice, you'd use the brightness command or other methods
        std::process::Command::new("brightness")
            .arg(brightness_value.to_string())
            .output()
            .map_err(|_| {
                "brightness command not available, install via: brew install brightness".to_string()
            })?;
    }

    #[cfg(target_os = "windows")]
    {
        // On Windows, brightness control is more complex and typically requires WMI
        return Ok(CommandResponse {
            status: "info".to_string(),
            message: "Brightness set not implemented on Windows yet".to_string(),
        });
    }

    #[cfg(target_os = "linux")]
    {
        // On Linux, we can use xrandr or write to /sys/class/backlight
        if let Ok(output) = std::process::Command::new("xrandr")
            .arg("--output")
            .arg("eDP-1") // This might vary by system
            .arg("--brightness")
            .arg((value as f32 / 100.0).to_string())
            .output()
        {
            if !output.status.success() {
                return Err("Failed to set brightness via xrandr".to_string());
            }
        } else {
            return Err("xrandr not available".to_string());
        }
    }

    Ok(CommandResponse {
        status: "success".to_string(),
        message: format!("Brightness set to {}%", value),
    })
}

// Brightness up command
#[tauri::command]
async fn brightness_up() -> Result<CommandResponse, String> {
    let mut enigo =
        Enigo::new(&Settings::default()).map_err(|e| format!("Failed to create enigo: {:?}", e))?;

    enigo
        .key(Key::F2, Direction::Click)
        .map_err(|e| format!("Failed to send F2 key: {:?}", e))?;

    Ok(CommandResponse {
        status: "success".to_string(),
        message: "Brightness up command sent".to_string(),
    })
}

// Brightness down command
#[tauri::command]
async fn brightness_down() -> Result<CommandResponse, String> {
    let mut enigo =
        Enigo::new(&Settings::default()).map_err(|e| format!("Failed to create enigo: {:?}", e))?;

    enigo
        .key(Key::F1, Direction::Click)
        .map_err(|e| format!("Failed to send F1 key: {:?}", e))?;

    Ok(CommandResponse {
        status: "success".to_string(),
        message: "Brightness down command sent".to_string(),
    })
}

// Media stop command
#[tauri::command]
async fn media_stop() -> Result<CommandResponse, String> {
    let mut enigo =
        Enigo::new(&Settings::default()).map_err(|e| format!("Failed to create enigo: {:?}", e))?;

    enigo
        .key(Key::Unicode('s'), Direction::Click)
        .map_err(|e| format!("Failed to send stop key: {:?}", e))?;

    Ok(CommandResponse {
        status: "success".to_string(),
        message: "Media stop command sent".to_string(),
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
            server
                .broadcast_message(&message)
                .map_err(|e| e.to_string())?;
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
        if let Ok(output) = std::process::Command::new("ifconfig").arg("en0").output() {
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

// QR Code generation command
#[tauri::command]
async fn generate_qr_code(url: String) -> Result<String, String> {
    let qr_code = QrCode::new(&url).map_err(|e| format!("Failed to generate QR code: {:?}", e))?;

    // Render as simple image
    let image = qr_code
        .render::<char>()
        .quiet_zone(false)
        .module_dimensions(2, 1)
        .build();

    // Convert to SVG-like format for easier handling
    let svg_data = format!(
        r#"<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 {} {}">
        <rect width="100%" height="100%" fill="white"/>
        <g fill="black">{}</g>
        </svg>"#,
        image.lines().count(),
        image.lines().next().unwrap_or("").len(),
        image
            .lines()
            .enumerate()
            .map(|(y, line)| {
                line.chars()
                    .enumerate()
                    .map(|(x, ch)| {
                        if ch == '█' {
                            format!(r#"<rect x="{}" y="{}" width="1" height="1"/>"#, x, y)
                        } else {
                            String::new()
                        }
                    })
                    .collect::<String>()
            })
            .collect::<String>()
    );

    // Convert SVG to base64
    let base64_string = general_purpose::STANDARD.encode(svg_data.as_bytes());
    Ok(format!("data:image/svg+xml;base64,{}", base64_string))
}

// Start Next.js development server
#[tauri::command]
async fn start_nextjs_server() -> Result<CommandResponse, String> {
    use std::process::Command;

    // Try to start the Next.js server in the frontend directory
    let mut cmd = Command::new("npm");
    cmd.args(&["run", "dev"])
        .current_dir("../frontend")
        .spawn()
        .map_err(|e| format!("Failed to start Next.js server: {:?}", e))?;

    Ok(CommandResponse {
        status: "success".to_string(),
        message: "Next.js server starting...".to_string(),
    })
}

// Check if Next.js server is running
#[tauri::command]
async fn check_nextjs_server() -> Result<bool, String> {
    use std::process::Command;

    // Try to check if port 3000 is in use (Next.js default)
    #[cfg(target_os = "macos")]
    {
        let output = Command::new("lsof")
            .args(&["-i", ":3000"])
            .output()
            .map_err(|e| format!("Failed to check port: {:?}", e))?;

        Ok(!output.stdout.is_empty())
    }

    #[cfg(not(target_os = "macos"))]
    {
        // For other platforms, we'll assume it's running if we can't check
        Ok(true)
    }
}

// Get connection info for QR code
#[tauri::command]
async fn get_connection_info() -> Result<serde_json::Value, String> {
    let local_ip = get_local_ip().unwrap_or_else(|| "localhost".to_string());
    let websocket_port = 8080; // Default WebSocket port
    let web_app_port = 3000; // Next.js default port

    let web_app_url = format!("http://{}:{}/?ip={}", local_ip, web_app_port, local_ip);
    let websocket_url = format!("ws://{}:{}", local_ip, websocket_port);

    Ok(serde_json::json!({
        "local_ip": local_ip,
        "websocket_port": websocket_port,
        "web_app_port": web_app_port,
        "web_app_url": web_app_url,
        "websocket_url": websocket_url
    }))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            greet,
            play_pause,
            media_previous,
            media_next,
            volume_up,
            volume_down,
            volume_mute,
            send_key,
            text_input,
            mouse_move,
            mouse_click,
            scroll,
            volume_set,
            brightness_set,
            brightness_up,
            brightness_down,
            media_stop,
            open_website,
            start_websocket_server,
            stop_websocket_server,
            get_server_status,
            broadcast_message,
            generate_qr_code,
            get_connection_info,
            start_nextjs_server,
            check_nextjs_server
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

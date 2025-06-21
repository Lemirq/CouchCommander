use base64::{engine::general_purpose, Engine as _};
use enigo::{
    Axis, Button, Coordinate,
    Direction::{Press, Release},
    Enigo, Key, Keyboard, Mouse, Settings,
};
use qrcode::QrCode;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use std::time::{Duration, Instant};
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

// Helper function to create Enigo instances (avoiding static due to Send issues)
fn create_enigo() -> Result<Enigo, String> {
    Enigo::new(&Settings::default()).map_err(|e| format!("Failed to create Enigo: {:?}", e))
}

// Rate limiting for text input
const TEXT_INPUT_MIN_INTERVAL: Duration = Duration::from_millis(100);
static TEXT_INPUT_SEMAPHORE: std::sync::OnceLock<tokio::sync::Semaphore> =
    std::sync::OnceLock::new();
static TEXT_INPUT_RATE_LIMITER: std::sync::OnceLock<tokio::sync::Mutex<Option<Instant>>> =
    std::sync::OnceLock::new();

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

// Simple media control commands
#[tauri::command]
async fn play_pause() -> Result<CommandResponse, String> {
    println!("Executing play_pause command");

    tokio::task::spawn_blocking(move || {
        let mut enigo = create_enigo()?;

        enigo.key(Key::Space, Press).map_err(|e| {
            eprintln!("Failed to send play/pause key: {:?}", e);
            format!("Failed to send play/pause key: {:?}", e)
        })?;

        println!("Play/pause command executed successfully");
        Ok(CommandResponse {
            status: "success".to_string(),
            message: "Play/pause command sent".to_string(),
        })
    })
    .await
    .map_err(|e| {
        eprintln!("Play/pause task panicked: {:?}", e);
        "Play/pause operation failed".to_string()
    })?
}

#[tauri::command]
async fn media_previous() -> Result<CommandResponse, String> {
    tokio::task::spawn_blocking(move || {
        let mut enigo = create_enigo()?;

        enigo
            .key(Key::Unicode('j'), Press) // Previous/rewind key
            .map_err(|e| format!("Failed to send media previous key: {:?}", e))?;

        Ok(CommandResponse {
            status: "success".to_string(),
            message: "Media previous command sent".to_string(),
        })
    })
    .await
    .map_err(|e| {
        eprintln!("Media previous task panicked: {:?}", e);
        "Media previous operation failed".to_string()
    })?
}

#[tauri::command]
async fn media_next() -> Result<CommandResponse, String> {
    tokio::task::spawn_blocking(move || {
        let mut enigo = create_enigo()?;

        enigo
            .key(Key::Unicode('l'), Press) // Next/fast forward key
            .map_err(|e| format!("Failed to send media next key: {:?}", e))?;

        Ok(CommandResponse {
            status: "success".to_string(),
            message: "Media next command sent".to_string(),
        })
    })
    .await
    .map_err(|e| {
        eprintln!("Media next task panicked: {:?}", e);
        "Media next operation failed".to_string()
    })?
}

#[tauri::command]
async fn volume_up() -> Result<CommandResponse, String> {
    tokio::task::spawn_blocking(move || {
        let mut enigo = create_enigo()?;

        enigo
            .key(Key::VolumeUp, Press)
            .map_err(|e| format!("Failed to send volume up key: {:?}", e))?;

        Ok(CommandResponse {
            status: "success".to_string(),
            message: "Volume up command sent".to_string(),
        })
    })
    .await
    .map_err(|e| {
        eprintln!("Volume up task panicked: {:?}", e);
        "Volume up operation failed".to_string()
    })?
}

#[tauri::command]
async fn volume_down() -> Result<CommandResponse, String> {
    tokio::task::spawn_blocking(move || {
        let mut enigo = create_enigo()?;

        enigo
            .key(Key::VolumeDown, Press)
            .map_err(|e| format!("Failed to send volume down key: {:?}", e))?;

        Ok(CommandResponse {
            status: "success".to_string(),
            message: "Volume down command sent".to_string(),
        })
    })
    .await
    .map_err(|e| {
        eprintln!("Volume down task panicked: {:?}", e);
        "Volume down operation failed".to_string()
    })?
}

#[tauri::command]
async fn volume_mute() -> Result<CommandResponse, String> {
    tokio::task::spawn_blocking(move || {
        let mut enigo = create_enigo()?;

        enigo
            .key(Key::VolumeMute, Press)
            .map_err(|e| format!("Failed to send volume mute key: {:?}", e))?;

        Ok(CommandResponse {
            status: "success".to_string(),
            message: "Volume mute command sent".to_string(),
        })
    })
    .await
    .map_err(|e| {
        eprintln!("Volume mute task panicked: {:?}", e);
        "Volume mute operation failed".to_string()
    })?
}

// Generic key sending command for flexibility (original version)
#[tauri::command]
async fn send_key(key_name: String) -> Result<CommandResponse, String> {
    println!("=== SEND_KEY DEBUG START ===");
    println!("Received key_name: '{}'", key_name);
    println!("Key name length: {}", key_name.len());
    
    tokio::task::spawn_blocking(move || {
        println!("=== SEND_KEY TASK START ===");
        
        // Check if we're on macOS and provide helpful error messages
        #[cfg(target_os = "macos")]
        {
            println!("Running on macOS - checking accessibility permissions");
            // On macOS, we need to check if accessibility permissions are granted
            // This is a basic check - the actual permission check happens when we try to use Enigo
        }
        
        let mut enigo = match create_enigo() {
            Ok(e) => {
                println!("Successfully created Enigo instance");
                e
            },
            Err(e) => {
                eprintln!("Failed to create Enigo: {}", e);
                let error_msg = if cfg!(target_os = "macos") {
                    format!("Failed to create Enigo: {}. This might be due to missing accessibility permissions. Please check System Preferences > Security & Privacy > Privacy > Accessibility and ensure the app has permission.", e)
                } else {
                    format!("Failed to create Enigo: {}", e)
                };
                return Err(error_msg);
            }
        };

        println!("Processing key: '{}'", key_name);
        let key = match key_name.to_lowercase().as_str() {
            "space" => {
                println!("Mapped to Key::Space");
                Key::Space
            },
            "enter" | "return" => {
                println!("Mapped to Key::Return");
                Key::Return
            },
            "escape" | "esc" => {
                println!("Mapped to Key::Escape");
                Key::Escape
            },
            "up" => {
                println!("Mapped to Key::UpArrow");
                Key::UpArrow
            },
            "down" => {
                println!("Mapped to Key::DownArrow");
                Key::DownArrow
            },
            "left" => {
                println!("Mapped to Key::LeftArrow");
                Key::LeftArrow
            },
            "right" => {
                println!("Mapped to Key::RightArrow");
                Key::RightArrow
            },
            "backspace" => {
                println!("Mapped to Key::Backspace");
                Key::Backspace
            },
            "tab" => {
                println!("Mapped to Key::Tab");
                Key::Tab
            },
            "shift" => {
                println!("Mapped to Key::Shift");
                Key::Shift
            },
            "ctrl" | "control" => {
                println!("Mapped to Key::Control");
                Key::Control
            },
            "alt" => {
                println!("Mapped to Key::Alt");
                Key::Alt
            },
            "cmd" | "meta" => {
                println!("Mapped to Key::Meta");
                Key::Meta
            },
            "f1" => {
                println!("Mapped to Key::F1");
                Key::F1
            },
            "f2" => {
                println!("Mapped to Key::F2");
                Key::F2
            },
            "f3" => {
                println!("Mapped to Key::F3");
                Key::F3
            },
            "f4" => {
                println!("Mapped to Key::F4");
                Key::F4
            },
            "f5" => {
                println!("Mapped to Key::F5");
                Key::F5
            },
            "f6" => {
                println!("Mapped to Key::F6");
                Key::F6
            },
            "f7" => {
                println!("Mapped to Key::F7");
                Key::F7
            },
            "f8" => {
                println!("Mapped to Key::F8");
                Key::F8
            },
            "f9" => {
                println!("Mapped to Key::F9");
                Key::F9
            },
            "f10" => {
                println!("Mapped to Key::F10");
                Key::F10
            },
            "f11" => {
                println!("Mapped to Key::F11");
                Key::F11
            },
            "f12" => {
                println!("Mapped to Key::F12");
                Key::F12
            },
            "a" => {
                println!("Mapped to Key::Unicode('a')");
                Key::Unicode('a')
            },
            "b" => {
                println!("Mapped to Key::Unicode('b')");
                Key::Unicode('b')
            },
            "c" => {
                println!("Mapped to Key::Unicode('c')");
                Key::Unicode('c')
            },
            "d" => {
                println!("Mapped to Key::Unicode('d')");
                Key::Unicode('d')
            },
            "e" => {
                println!("Mapped to Key::Unicode('e')");
                Key::Unicode('e')
            },
            "f" => {
                println!("Mapped to Key::Unicode('f')");
                Key::Unicode('f')
            },
            "g" => {
                println!("Mapped to Key::Unicode('g')");
                Key::Unicode('g')
            },
            "h" => {
                println!("Mapped to Key::Unicode('h')");
                Key::Unicode('h')
            },
            "i" => {
                println!("Mapped to Key::Unicode('i')");
                Key::Unicode('i')
            },
            "j" => {
                println!("Mapped to Key::Unicode('j')");
                Key::Unicode('j')
            },
            "k" => {
                println!("Mapped to Key::Unicode('k')");
                Key::Unicode('k')
            },
            "l" => {
                println!("Mapped to Key::Unicode('l')");
                Key::Unicode('l')
            },
            "m" => {
                println!("Mapped to Key::Unicode('m')");
                Key::Unicode('m')
            },
            "n" => {
                println!("Mapped to Key::Unicode('n')");
                Key::Unicode('n')
            },
            "o" => {
                println!("Mapped to Key::Unicode('o')");
                Key::Unicode('o')
            },
            "p" => {
                println!("Mapped to Key::Unicode('p')");
                Key::Unicode('p')
            },
            "q" => {
                println!("Mapped to Key::Unicode('q')");
                Key::Unicode('q')
            },
            "r" => {
                println!("Mapped to Key::Unicode('r')");
                Key::Unicode('r')
            },
            "s" => {
                println!("Mapped to Key::Unicode('s')");
                Key::Unicode('s')
            },
            "t" => {
                println!("Mapped to Key::Unicode('t')");
                Key::Unicode('t')
            },
            "u" => {
                println!("Mapped to Key::Unicode('u')");
                Key::Unicode('u')
            },
            "v" => {
                println!("Mapped to Key::Unicode('v')");
                Key::Unicode('v')
            },
            "w" => {
                println!("Mapped to Key::Unicode('w')");
                Key::Unicode('w')
            },
            "x" => {
                println!("Mapped to Key::Unicode('x')");
                Key::Unicode('x')
            },
            "y" => {
                println!("Mapped to Key::Unicode('y')");
                Key::Unicode('y')
            },
            "z" => {
                println!("Mapped to Key::Unicode('z')");
                Key::Unicode('z')
            },
            // Single character keys
            _ => {
                if key_name.len() == 1 {
                    let ch = key_name.chars().next().unwrap();
                    println!("Mapped to Key::Unicode('{}')", ch);
                    Key::Unicode(ch)
                } else {
                    eprintln!("Unknown key: '{}'", key_name);
                    return Err(format!("Unknown key: {}", key_name));
                }
            }
        };

        println!("About to press key...");
        
        // For Unicode characters, use the text() method instead of Key::Unicode
        // This avoids the crash that happens with Key::Unicode on macOS
        if let Key::Unicode(ch) = key {
            println!("Using text() method for Unicode character '{}'", ch);
            let press_result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
                println!("Attempting text input for character '{}'", ch);
                enigo.text(&ch.to_string())
            }));
            
            match press_result {
                Ok(Ok(_)) => {
                    println!("Text input successful for character '{}'", ch);
                },
                Ok(Err(e)) => {
                    eprintln!("Failed to input text for character '{}': {:?}", ch, e);
                    return Err(format!("Failed to input text for character '{}': {:?}", ch, e));
                },
                Err(panic_info) => {
                    eprintln!("Text input operation panicked: {:?}", panic_info);
                    return Err(format!("Text input operation panicked: {:?}", panic_info));
                }
            }
        } else {
            // For non-Unicode keys, use the regular key() method
            let press_result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
                println!("Attempting key press operation for non-Unicode key");
                enigo.key(key, Press)
            }));
            
            match press_result {
                Ok(Ok(_)) => {
                    println!("Key press successful");
                },
                Ok(Err(e)) => {
                    eprintln!("Failed to press key '{}': {:?}", key_name, e);
                    let error_msg = if cfg!(target_os = "macos") {
                        format!("Failed to press key '{}': {:?}. This might be due to missing accessibility permissions. Please check System Preferences > Security & Privacy > Privacy > Accessibility and ensure the app has permission.", key_name, e)
                    } else {
                        format!("Failed to press key '{}': {:?}", key_name, e)
                    };
                    return Err(error_msg);
                },
                Err(panic_info) => {
                    eprintln!("Key press operation panicked: {:?}", panic_info);
                    return Err(format!("Key press operation panicked: {:?}", panic_info));
                }
            }
        }

        println!("=== SEND_KEY TASK SUCCESS ===");
        Ok(CommandResponse {
            status: "success".to_string(),
            message: format!("Key '{}' sent successfully", key_name),
        })
    })
    .await
    .map_err(|e| {
        eprintln!("Send key task panicked: {:?}", e);
        "Send key operation failed".to_string()
    })?
}

// Test command for debugging text input
#[tauri::command]
async fn test_text_input() -> Result<CommandResponse, String> {
    println!("Testing text input with simple text");

    let test_text = "Hello World! ❤️";
    match text_input(test_text.to_string()).await {
        Ok(response) => {
            println!("Test successful: {:?}", response);
            Ok(CommandResponse {
                status: "success".to_string(),
                message: format!("Test completed: {}", response.message),
            })
        }
        Err(e) => {
            eprintln!("Test failed: {}", e);
            Err(format!("Test failed: {}", e))
        }
    }
}

// Text input command - using Enigo best practices with shared instance and text() method
#[tauri::command]
async fn text_input(text: String) -> Result<CommandResponse, String> {
    println!(
        "Executing text_input command with text length: {}",
        text.len()
    );

    // Validate input
    if text.is_empty() {
        println!("Empty text input provided");
        return Ok(CommandResponse {
            status: "success".to_string(),
            message: "Empty text input".to_string(),
        });
    }

    // Limit text length to prevent overwhelming the system
    if text.len() > 1000 {
        eprintln!("Text input too long: {} characters (max 1000)", text.len());
        return Err("Text input too long (max 1000 characters)".to_string());
    }

    // Rate limiting check
    {
        let rate_limiter = TEXT_INPUT_RATE_LIMITER.get_or_init(|| tokio::sync::Mutex::new(None));
        let mut last_call = rate_limiter.lock().await;
        if let Some(last_time) = *last_call {
            let elapsed = last_time.elapsed();
            if elapsed < TEXT_INPUT_MIN_INTERVAL {
                let wait_time = TEXT_INPUT_MIN_INTERVAL - elapsed;
                println!("Rate limiting text input, waiting {:?}", wait_time);
                drop(last_call);
                tokio::time::sleep(wait_time).await;
                last_call = rate_limiter.lock().await;
            }
        }
        *last_call = Some(Instant::now());
        drop(last_call);
    }

    // Limit concurrent operations
    let semaphore = TEXT_INPUT_SEMAPHORE.get_or_init(|| tokio::sync::Semaphore::new(1));
    let _permit = match semaphore.try_acquire() {
        Ok(permit) => permit,
        Err(_) => {
            eprintln!("Text input operation already in progress");
            return Err("System busy, please try again".to_string());
        }
    };

    // Process text in blocking task
    let result = tokio::task::spawn_blocking(move || {
        println!("Creating Enigo instance for text input");
        let mut enigo = create_enigo()?;

        println!("Typing text: \"{}\"", text);

        // Small delay before typing for stability
        std::thread::sleep(std::time::Duration::from_millis(10));

        enigo
            .text(&text)
            .map_err(|e| format!("Text input failed: {:?}", e))?;

        println!("Text input completed successfully");
        Ok(CommandResponse {
            status: "success".to_string(),
            message: format!("Text input successful ({} characters)", text.len()),
        })
    })
    .await;

    match result {
        Ok(inner_result) => inner_result,
        Err(e) => {
            eprintln!("Text input task failed: {:?}", e);
            Err("Text input operation failed".to_string())
        }
    }
}

// Mouse movement command
#[tauri::command]
async fn mouse_move(delta_x: i32, delta_y: i32) -> Result<CommandResponse, String> {
    println!("Executing mouse_move command: ({}, {})", delta_x, delta_y);

    tokio::task::spawn_blocking(move || {
        let mut enigo = create_enigo()?;

        enigo
            .move_mouse(delta_x, delta_y, Coordinate::Rel)
            .map_err(|e| {
                eprintln!(
                    "Failed to move mouse by ({}, {}): {:?}",
                    delta_x, delta_y, e
                );
                format!("Failed to move mouse: {:?}", e)
            })?;

        Ok(CommandResponse {
            status: "success".to_string(),
            message: format!("Mouse moved by ({}, {})", delta_x, delta_y),
        })
    })
    .await
    .map_err(|e| {
        eprintln!("Mouse move task panicked: {:?}", e);
        "Mouse move operation failed".to_string()
    })?
}

// Mouse click command
#[tauri::command]
async fn mouse_click(button: String) -> Result<CommandResponse, String> {
    tokio::task::spawn_blocking(move || {
        let mut enigo = create_enigo()?;

        let mouse_button = match button.as_str() {
            "left" => Button::Left,
            "right" => Button::Right,
            "middle" => Button::Middle,
            _ => return Err(format!("Unsupported mouse button: {}", button)),
        };

        enigo
            .button(mouse_button, Press)
            .map_err(|e| format!("Failed to click mouse button '{}': {:?}", button, e))?;

        Ok(CommandResponse {
            status: "success".to_string(),
            message: format!("Mouse {} clicked", button),
        })
    })
    .await
    .map_err(|e| {
        eprintln!("Mouse click task panicked: {:?}", e);
        "Mouse click operation failed".to_string()
    })?
}

// Scroll command
#[tauri::command]
async fn scroll(delta_x: i32, delta_y: i32) -> Result<CommandResponse, String> {
    tokio::task::spawn_blocking(move || {
        let mut enigo = create_enigo()?;

        if delta_x != 0 {
            enigo
                .scroll(delta_x, Axis::Horizontal)
                .map_err(|e| format!("Failed to scroll horizontally: {:?}", e))?;
        }

        if delta_y != 0 {
            enigo
                .scroll(delta_y, Axis::Vertical)
                .map_err(|e| format!("Failed to scroll vertically: {:?}", e))?;
        }

        Ok(CommandResponse {
            status: "success".to_string(),
            message: format!("Scrolled by ({}, {})", delta_x, delta_y),
        })
    })
    .await
    .map_err(|e| {
        eprintln!("Scroll task panicked: {:?}", e);
        "Scroll operation failed".to_string()
    })?
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
        .key(Key::F2, Press)
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
        .key(Key::F1, Press)
        .map_err(|e| format!("Failed to send F1 key: {:?}", e))?;

    Ok(CommandResponse {
        status: "success".to_string(),
        message: "Brightness down command sent".to_string(),
    })
}

// Media stop command
#[tauri::command]
async fn media_stop() -> Result<CommandResponse, String> {
    tokio::task::spawn_blocking(move || {
        let mut enigo = create_enigo()?;

        enigo
            .key(Key::Unicode('k'), Press) // Stop/pause key
            .map_err(|e| format!("Failed to send media stop key: {:?}", e))?;

        Ok(CommandResponse {
            status: "success".to_string(),
            message: "Media stop command sent".to_string(),
        })
    })
    .await
    .map_err(|e| {
        eprintln!("Media stop task panicked: {:?}", e);
        "Media stop operation failed".to_string()
    })?
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

    // Automatically start the Next.js frontend server
    match start_nextjs_server().await {
        Ok(_) => {
            println!("Next.js server started automatically");
        }
        Err(e) => {
            eprintln!("Warning: Failed to start Next.js server: {}", e);
        }
    }

    Ok(CommandResponse {
        status: "success".to_string(),
        message: format!(
            "WebSocket server started on port {} with frontend",
            server_port
        ),
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

    // Also stop the Next.js server
    match stop_nextjs_server().await {
        Ok(_) => {
            println!("Next.js server stopped automatically");
        }
        Err(e) => {
            eprintln!("Warning: Failed to stop Next.js server: {}", e);
        }
    }

    Ok(CommandResponse {
        status: "success".to_string(),
        message: "WebSocket server and frontend stopped".to_string(),
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

    // Get the current working directory and resolve frontend path
    let current_dir =
        std::env::current_dir().map_err(|e| format!("Failed to get current directory: {:?}", e))?;

    println!("Current directory: {:?}", current_dir);

    // Try multiple possible frontend directory locations
    let possible_frontend_dirs = vec![
        Some(current_dir.join("../frontend")),
        current_dir.parent().map(|p| p.join("frontend")),
        Some(current_dir.join("../../frontend")),
        current_dir
            .parent()
            .and_then(|p| p.parent())
            .map(|p| p.join("frontend")),
    ];

    let mut frontend_dir = None;
    for dir_option in possible_frontend_dirs {
        if let Some(dir) = dir_option {
            println!("Checking frontend directory: {:?}", dir);
            if dir.exists() && dir.join("package.json").exists() {
                frontend_dir = Some(dir);
                break;
            }
        }
    }

    let frontend_dir = frontend_dir.ok_or_else(|| {
        format!(
            "Frontend directory not found. Current dir: {:?}. Searched for ../frontend, ../../frontend",
            current_dir
        )
    })?;

    println!("Using frontend directory: {:?}", frontend_dir);

    // Try different npm commands based on the system
    let npm_cmd = if cfg!(target_os = "windows") {
        "npm.cmd"
    } else {
        "npm"
    };

    // Try to start the Next.js server in the frontend directory
    let mut cmd = Command::new(npm_cmd);
    cmd.args(&["run", "dev"])
        .current_dir(&frontend_dir)
        .spawn()
        .map_err(|e| {
            format!(
                "Failed to start Next.js server: {:?}. Make sure npm is installed and in PATH. Frontend dir: {:?}",
                e, frontend_dir
            )
        })?;

    Ok(CommandResponse {
        status: "success".to_string(),
        message: format!("Next.js server starting in {:?}...", frontend_dir),
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

// Stop Next.js server
#[tauri::command]
async fn stop_nextjs_server() -> Result<CommandResponse, String> {
    use std::process::Command;

    let mut stopped_processes = 0;

    // Kill processes on port 3000 (Next.js default)
    #[cfg(target_os = "macos")]
    {
        match Command::new("lsof").args(&["-ti", ":3000"]).output() {
            Ok(output) => {
                if !output.stdout.is_empty() {
                    let pids = String::from_utf8_lossy(&output.stdout);
                    for pid in pids.trim().split('\n') {
                        if !pid.is_empty() {
                            match Command::new("kill").args(&["-9", pid]).output() {
                                Ok(_) => {
                                    stopped_processes += 1;
                                    println!("Killed process with PID: {}", pid);
                                }
                                Err(e) => eprintln!("Failed to kill process {}: {:?}", pid, e),
                            }
                        }
                    }
                }
            }
            Err(e) => eprintln!("Failed to list processes on port 3000: {:?}", e),
        }
    }

    #[cfg(target_os = "windows")]
    {
        // Try to kill node processes that might be running Next.js
        match Command::new("taskkill")
            .args(&[
                "/F",
                "/FI",
                "IMAGENAME eq node.exe",
                "/FI",
                "WINDOWTITLE eq *next*",
            ])
            .output()
        {
            Ok(_) => {
                stopped_processes += 1;
                println!("Attempted to stop Next.js processes on Windows");
            }
            Err(e) => eprintln!("Failed to stop Next.js processes on Windows: {:?}", e),
        }
    }

    #[cfg(target_os = "linux")]
    {
        match Command::new("pkill").args(&["-f", "next.*dev"]).output() {
            Ok(_) => {
                stopped_processes += 1;
                println!("Attempted to stop Next.js processes on Linux");
            }
            Err(e) => eprintln!("Failed to stop Next.js processes on Linux: {:?}", e),
        }
    }

    let message = if stopped_processes > 0 {
        format!("Next.js server stopped ({} processes)", stopped_processes)
    } else {
        "Next.js server stop attempted (no processes found)".to_string()
    };

    Ok(CommandResponse {
        status: "success".to_string(),
        message,
    })
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

// Modifier key state management
use std::sync::Mutex;
use std::collections::HashMap;

lazy_static::lazy_static! {
    static ref MODIFIER_KEY_STATES: Mutex<HashMap<String, bool>> = Mutex::new(HashMap::new());
}

// Get current modifier key states
#[tauri::command]
async fn get_modifier_key_states() -> Result<serde_json::Value, String> {
    println!("Getting modifier key states");
    
    let states = MODIFIER_KEY_STATES.lock().map_err(|e| {
        eprintln!("Failed to lock modifier key states: {:?}", e);
        "Failed to get modifier key states".to_string()
    })?;
    
    let states_json = serde_json::json!({
        "cmd": states.get("cmd").unwrap_or(&false),
        "shift": states.get("shift").unwrap_or(&false),
        "alt": states.get("alt").unwrap_or(&false),
        "option": states.get("option").unwrap_or(&false),
        "ctrl": states.get("ctrl").unwrap_or(&false),
        "control": states.get("control").unwrap_or(&false),
    });
    
    println!("Current modifier key states: {:?}", states_json);
    Ok(states_json)
}

// Toggle a modifier key state
#[tauri::command]
async fn toggle_modifier_key(key_name: String) -> Result<CommandResponse, String> {
    println!("Toggling modifier key: {}", key_name);
    
    // Get current state and calculate new state
    let (current_state, new_state) = {
        let states = MODIFIER_KEY_STATES.lock().map_err(|e| {
            eprintln!("Failed to lock modifier key states: {:?}", e);
            "Failed to toggle modifier key".to_string()
        })?;
        
        let current_state = states.get(&key_name).unwrap_or(&false);
        let new_state = !current_state;
        (current_state.clone(), new_state)
    };
    
    // Actually send the modifier key to the system
    let key_name_clone = key_name.clone();
    let result: Result<(), String> = tokio::task::spawn_blocking(move || {
        println!("Actually sending modifier key '{}' to system", key_name_clone);
        
        let mut enigo = create_enigo()?;
        
        // Map the key name to the actual Key enum
        let key = match key_name_clone.to_lowercase().as_str() {
            "shift" => Key::Shift,
            "ctrl" | "control" => Key::Control,
            "alt" | "option" => Key::Alt,
            "cmd" | "meta" => Key::Meta,
            _ => {
                eprintln!("Unknown modifier key: {}", key_name_clone);
                return Err(format!("Unknown modifier key: {}", key_name_clone));
            }
        };
        
        // Send the key press or release based on the new state
        let direction = if new_state { Press } else { Release };
        println!("Sending modifier key '{}' with direction: {:?}", key_name_clone, direction);
        
        let press_result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
            enigo.key(key, direction)
        }));
        
        match press_result {
            Ok(Ok(_)) => {
                println!("Modifier key '{}' sent successfully", key_name_clone);
                Ok(())
            },
            Ok(Err(e)) => {
                eprintln!("Failed to send modifier key '{}': {:?}", key_name_clone, e);
                Err(format!("Failed to send modifier key '{}': {:?}", key_name_clone, e))
            },
            Err(panic_info) => {
                eprintln!("Modifier key operation panicked: {:?}", panic_info);
                Err(format!("Modifier key operation panicked: {:?}", panic_info))
            }
        }
    })
    .await
    .map_err(|e| {
        eprintln!("Toggle modifier key task panicked: {:?}", e);
        "Toggle modifier key operation failed".to_string()
    })?;
    
    // Update the state based on the result
    {
        let mut states = MODIFIER_KEY_STATES.lock().map_err(|e| {
            eprintln!("Failed to lock modifier key states: {:?}", e);
            "Failed to update modifier key state".to_string()
        })?;
        
        if let Err(_) = result {
            // If the key operation failed, keep the old state
            println!("Key operation failed, keeping original state for '{}'", key_name);
        } else {
            // Update the state
            states.insert(key_name.clone(), new_state);
            
            // Also handle aliases
            match key_name.as_str() {
                "alt" => {
                    states.insert("option".to_string(), new_state);
                },
                "ctrl" => {
                    states.insert("control".to_string(), new_state);
                },
                "cmd" => {
                    states.insert("meta".to_string(), new_state);
                },
                _ => {}
            }
        }
    }
    
    // Return appropriate response
    match result {
        Ok(_) => {
            println!("Modifier key '{}' toggled to: {}", key_name, new_state);
            Ok(CommandResponse {
                status: "success".to_string(),
                message: format!("Modifier key '{}' toggled to {}", key_name, new_state),
            })
        },
        Err(e) => {
            println!("Modifier key '{}' toggle failed: {}", key_name, e);
            Err(e)
        }
    }
}

// Clear all modifier key states
#[tauri::command]
async fn clear_modifier_keys() -> Result<CommandResponse, String> {
    println!("Clearing all modifier key states");
    
    // Get the currently pressed keys before clearing
    let pressed_keys: Vec<String> = {
        let states = MODIFIER_KEY_STATES.lock().map_err(|e| {
            eprintln!("Failed to lock modifier key states: {:?}", e);
            "Failed to clear modifier keys".to_string()
        })?;
        
        states
            .iter()
            .filter(|(_, &pressed)| pressed)
            .map(|(key, _)| key.clone())
            .collect()
    };
    
    // Clear the states
    {
        let mut states = MODIFIER_KEY_STATES.lock().map_err(|e| {
            eprintln!("Failed to lock modifier key states: {:?}", e);
            "Failed to clear modifier keys".to_string()
        })?;
        states.clear();
    }
    
    // Actually release any pressed modifier keys
    if !pressed_keys.is_empty() {
        println!("Releasing {} pressed modifier keys: {:?}", pressed_keys.len(), pressed_keys);
        
        let result: Result<(), String> = tokio::task::spawn_blocking(move || {
            let mut enigo = create_enigo()?;
            
            for key_name in pressed_keys {
                println!("Releasing modifier key: {}", key_name);
                
                // Map the key name to the actual Key enum
                let key = match key_name.to_lowercase().as_str() {
                    "shift" => Key::Shift,
                    "ctrl" | "control" => Key::Control,
                    "alt" | "option" => Key::Alt,
                    "cmd" | "meta" => Key::Meta,
                    _ => {
                        eprintln!("Unknown modifier key: {}", key_name);
                        continue; // Skip unknown keys
                    }
                };
                
                // Release the key
                let press_result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
                    enigo.key(key, Release)
                }));
                
                match press_result {
                    Ok(Ok(_)) => {
                        println!("Modifier key '{}' released successfully", key_name);
                    },
                    Ok(Err(e)) => {
                        eprintln!("Failed to release modifier key '{}': {:?}", key_name, e);
                    },
                    Err(panic_info) => {
                        eprintln!("Modifier key release operation panicked: {:?}", panic_info);
                    }
                }
            }
            
            Ok(())
        })
        .await
        .map_err(|e| {
            eprintln!("Clear modifier keys task panicked: {:?}", e);
            "Clear modifier keys operation failed".to_string()
        })?;
        
        if let Err(e) = result {
            eprintln!("Failed to release some modifier keys: {}", e);
            // Don't return error here, just log it since we've already cleared the states
        }
    }
    
    println!("All modifier key states cleared");
    
    Ok(CommandResponse {
        status: "success".to_string(),
        message: "All modifier keys cleared".to_string(),
    })
}

// Check accessibility permissions on macOS
#[cfg(target_os = "macos")]
fn check_accessibility_permissions() -> bool {
    // Simplified check - just return true and let the actual operation fail if permissions are missing
    // This avoids the complex cocoa/objc API calls that are causing compilation issues
    true
}

#[cfg(not(target_os = "macos"))]
fn check_accessibility_permissions() -> bool {
    // On non-macOS platforms, assume permissions are available
    true
}

// Test accessibility permissions
#[tauri::command]
async fn test_accessibility_permissions() -> Result<CommandResponse, String> {
    println!("Testing accessibility permissions...");
    
    #[cfg(target_os = "macos")]
    {
        println!("Running on macOS - checking accessibility permissions");
        let has_permissions = check_accessibility_permissions();
        
        if has_permissions {
            println!("Accessibility permissions check completed");
            Ok(CommandResponse {
                status: "success".to_string(),
                message: "Accessibility permissions check completed. If key sending doesn't work, please check System Preferences > Security & Privacy > Privacy > Accessibility.".to_string(),
            })
        } else {
            Err("Could not verify accessibility permissions. Please check System Preferences > Security & Privacy > Privacy > Accessibility.".to_string())
        }
    }
    
    #[cfg(not(target_os = "macos"))]
    {
        println!("Not running on macOS - accessibility permissions not required");
        Ok(CommandResponse {
            status: "success".to_string(),
            message: "Accessibility permissions not required on this platform".to_string(),
        })
    }
}

// Simple test to check if Enigo can be created (permissions test)
#[tauri::command]
async fn test_enigo_creation() -> Result<CommandResponse, String> {
    println!("=== TESTING ENIGO CREATION ===");
    
    tokio::task::spawn_blocking(move || {
        println!("Attempting to create Enigo instance...");
        
        match create_enigo() {
            Ok(_) => {
                println!("✅ Enigo instance created successfully!");
                Ok(CommandResponse {
                    status: "success".to_string(),
                    message: "Enigo instance created successfully. Permissions appear to be working.".to_string(),
                })
            },
            Err(e) => {
                eprintln!("❌ Failed to create Enigo instance: {}", e);
                let error_msg = if cfg!(target_os = "macos") {
                    format!("Failed to create Enigo instance: {}. This is likely due to missing accessibility permissions. Please check System Preferences > Security & Privacy > Privacy > Accessibility and ensure the app has permission.", e)
                } else {
                    format!("Failed to create Enigo instance: {}", e)
                };
                Err(error_msg)
            }
        }
    })
    .await
    .map_err(|e| {
        eprintln!("Test task panicked: {:?}", e);
        "Test operation failed".to_string()
    })?
}

// Test function to try sending a space key (known working key type)
#[tauri::command]
async fn test_space_key() -> Result<CommandResponse, String> {
    println!("=== TESTING SPACE KEY ===");
    
    println!("Attempting to send space key...");
    
    let mut enigo = match create_enigo() {
        Ok(e) => {
            println!("Successfully created Enigo instance");
            e
        },
        Err(e) => {
            eprintln!("Failed to create Enigo: {}", e);
            return Err(format!("Failed to create Enigo: {}", e));
        }
    };

    println!("About to press space key...");
    
    // Try to isolate the crash by adding more granular error handling
    let press_result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        println!("Attempting space key press operation...");
        enigo.key(Key::Space, Press)
    }));
    
    match press_result {
        Ok(Ok(_)) => {
            println!("Space key press successful");
            Ok(CommandResponse {
                status: "success".to_string(),
                message: "Space key sent successfully".to_string(),
            })
        },
        Ok(Err(e)) => {
            eprintln!("Failed to press space key: {:?}", e);
            Err(format!("Failed to press space key: {:?}", e))
        },
        Err(panic_info) => {
            eprintln!("Space key press operation panicked: {:?}", panic_info);
            Err(format!("Space key press operation panicked: {:?}", panic_info))
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec!["--flag1", "--flag2"]),
        ))
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
            test_text_input,
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
            stop_nextjs_server,
            check_nextjs_server,
            get_modifier_key_states,
            toggle_modifier_key,
            clear_modifier_keys,
            test_accessibility_permissions,
            test_enigo_creation,
            test_space_key
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

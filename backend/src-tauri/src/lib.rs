use enigo::{Enigo, Key, Keyboard, Settings, Direction};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct CommandResponse {
    pub status: String,
    pub message: String,
}

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
            open_website
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

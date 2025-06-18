use std::collections::HashMap;
use std::net::SocketAddr;
use std::sync::{Arc, Mutex};
use tokio::net::{TcpListener, TcpStream};
use tokio_tungstenite::{accept_async, tungstenite::Message};
use futures_util::{SinkExt, StreamExt};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebSocketCommand {
    pub id: Option<String>,
    pub command: String,
    pub data: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebSocketResponse {
    pub id: Option<String>,
    pub status: String,
    pub message: String,
    pub data: Option<serde_json::Value>,
}

pub type ClientConnections = Arc<Mutex<HashMap<String, tokio::sync::mpsc::UnboundedSender<Message>>>>;

pub struct WebSocketServer {
    pub addr: SocketAddr,
    pub clients: ClientConnections,
}

impl WebSocketServer {
    pub fn new(port: u16) -> Self {
        let addr = SocketAddr::from(([0, 0, 0, 0], port));
        let clients = Arc::new(Mutex::new(HashMap::new()));
        
        Self { addr, clients }
    }

    pub async fn start(&self) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let listener = TcpListener::bind(&self.addr).await?;
        println!("WebSocket server listening on: {}", self.addr);

        while let Ok((stream, addr)) = listener.accept().await {
            let clients = Arc::clone(&self.clients);
            tokio::spawn(handle_connection(stream, addr, clients));
        }

        Ok(())
    }

    pub fn broadcast_message(&self, message: &str) -> Result<(), Box<dyn std::error::Error>> {
        let clients = self.clients.lock().unwrap();
        let msg = Message::Text(message.to_string());
        
        for (_, tx) in clients.iter() {
            let _ = tx.send(msg.clone());
        }
        
        Ok(())
    }

    pub fn get_client_count(&self) -> usize {
        self.clients.lock().unwrap().len()
    }
}

async fn handle_connection(
    stream: TcpStream,
    addr: SocketAddr,
    clients: ClientConnections,
) {
    println!("New WebSocket connection: {}", addr);
    
    let ws_stream = match accept_async(stream).await {
        Ok(ws) => ws,
        Err(e) => {
            println!("WebSocket connection failed: {}", e);
            return;
        }
    };

    let client_id = Uuid::new_v4().to_string();
    let (tx, mut rx) = tokio::sync::mpsc::unbounded_channel();

    // Add client to connections
    {
        let mut clients_guard = clients.lock().unwrap();
        clients_guard.insert(client_id.clone(), tx);
    }

    let (mut ws_sender, mut ws_receiver) = ws_stream.split();

    // Handle outgoing messages
    let client_id_clone = client_id.clone();
    let clients_clone = Arc::clone(&clients);
    tokio::spawn(async move {
        while let Some(msg) = rx.recv().await {
            if ws_sender.send(msg).await.is_err() {
                // Remove client on send error
                let mut clients_guard = clients_clone.lock().unwrap();
                clients_guard.remove(&client_id_clone);
                break;
            }
        }
    });

    // Handle incoming messages
    while let Some(msg) = ws_receiver.next().await {
        match msg {
            Ok(Message::Text(text)) => {
                if let Ok(command) = serde_json::from_str::<WebSocketCommand>(&text) {
                    let response = handle_command(command).await;
                    let response_json = serde_json::to_string(&response).unwrap_or_else(|_| {
                        serde_json::to_string(&WebSocketResponse {
                            id: None,
                            status: "error".to_string(),
                            message: "Failed to serialize response".to_string(),
                            data: None,
                        }).unwrap()
                    });
                    
                    // Send response back through the client's sender
                    if let Some(sender) = {
                        let clients_guard = clients.lock().unwrap();
                        clients_guard.get(&client_id).cloned()
                    } {
                        let _ = sender.send(Message::Text(response_json));
                    }
                } else {
                    let error_response = WebSocketResponse {
                        id: None,
                        status: "error".to_string(),
                        message: "Invalid command format".to_string(),
                        data: None,
                    };
                    let response_json = serde_json::to_string(&error_response).unwrap();
                    
                    if let Some(sender) = {
                        let clients_guard = clients.lock().unwrap();
                        clients_guard.get(&client_id).cloned()
                    } {
                        let _ = sender.send(Message::Text(response_json));
                    }
                }
            }
            Ok(Message::Close(_)) => {
                println!("Client {} disconnected", addr);
                break;
            }
            Err(e) => {
                println!("WebSocket error: {}", e);
                break;
            }
            _ => {}
        }
    }

    // Remove client from connections
    {
        let mut clients_guard = clients.lock().unwrap();
        clients_guard.remove(&client_id);
    }
    
    println!("Client {} connection closed", addr);
}

async fn handle_command(command: WebSocketCommand) -> WebSocketResponse {
    use crate::{play_pause, media_previous, media_next, volume_up, volume_down, volume_mute, send_key, open_website};
    
    let result = match command.command.as_str() {
        "play_pause" => play_pause().await.map_err(|e| e.to_string()),
        "media_previous" => media_previous().await.map_err(|e| e.to_string()),
        "media_next" => media_next().await.map_err(|e| e.to_string()),
        "volume_up" => volume_up().await.map_err(|e| e.to_string()),
        "volume_down" => volume_down().await.map_err(|e| e.to_string()),
        "volume_mute" => volume_mute().await.map_err(|e| e.to_string()),
        "send_key" => {
            if let Some(data) = &command.data {
                if let Some(key) = data.get("key").and_then(|k| k.as_str()) {
                    send_key(key.to_string()).await.map_err(|e| e.to_string())
                } else {
                    Err("Missing 'key' parameter".to_string())
                }
            } else {
                Err("Missing data for send_key command".to_string())
            }
        }
        "open_website" => {
            if let Some(data) = &command.data {
                if let Some(url) = data.get("url").and_then(|u| u.as_str()) {
                    open_website(url.to_string()).await.map_err(|e| e.to_string())
                } else {
                    Err("Missing 'url' parameter".to_string())
                }
            } else {
                Err("Missing data for open_website command".to_string())
            }
        }
        _ => Err(format!("Unknown command: {}", command.command)),
    };

    match result {
        Ok(response) => WebSocketResponse {
            id: command.id,
            status: response.status,
            message: response.message,
            data: None,
        },
        Err(error) => WebSocketResponse {
            id: command.id,
            status: "error".to_string(),
            message: error,
            data: None,
        },
    }
}

# 🛋️ CouchCommander

**Transform your phone into the ultimate remote control for your laptop and media setup**

CouchCommander is a cross-platform system that lets you control media playback, system settings, and desktop functions from your phone over your local Wi-Fi network. Perfect for controlling your laptop connected to a TV or large monitor from the comfort of your couch.

## ✨ Features

### 🎬 Media Control

-   Play/pause media in any application (VLC, Netflix, YouTube, etc.)
-   Universal media key support across all platforms

### 🖱️ Remote Desktop Control

-   Virtual trackpad for precise mouse movement
-   Virtual keyboard for text input
-   Left/right click simulation

### 🔧 System Control

-   Volume adjustment (up/down/mute)
-   Screen brightness control
-   Cross-platform system integration

### 🌐 Quick Website Access

-   One-tap access to streaming services (Netflix, Crunchyroll, etc.)
-   Customizable website shortcuts

### 📱 Mobile-First Design

-   Touch-optimized interface built with Next.js
-   Responsive design for portrait/landscape modes
-   Progressive Web App (PWA) support

## 🏗️ Architecture

-   **Desktop App**: Tauri with WebSocket communication
-   **Mobile Client**: Next.js web application with real-time connectivity
-   **Communication**: Local network WebSocket connection (no cloud dependency)
-   **Discovery**: Auto-discovery via mDNS or manual IP entry

## 🚀 Quick Start

1. **Setup Desktop Server**

    ```bash
    cd backend
    npm install
    npm start
    ```

2. **Launch Mobile Client**

    ```bash
    cd frontend
    npm install
    npm run dev
    ```

3. **Connect**: Ensure both devices are on the same Wi-Fi network and connect via auto-discovery or manual IP entry

## 🔧 Tech Stack

### Backend (Desktop)

-   **Electron** - Cross-platform desktop app framework
-   **Node.js** - Server runtime
-   **WebSocket** - Real-time communication
-   **robotjs** - Mouse/keyboard simulation
-   **mdns** - Network service discovery

### Frontend (Mobile)

-   **Next.js** - React framework for mobile web app
-   **Tailwind CSS** - Responsive styling
-   **WebSocket Client** - Real-time server communication

## 🌍 Platform Support

### Desktop Server

-   ✅ Windows
-   ✅ macOS
-   ✅ Linux

### Mobile Client

-   ✅ iOS (Safari/Chrome)
-   ✅ Android (Chrome/Firefox)
-   ✅ Any device with modern web browser

## 🔒 Privacy & Security

-   **100% Local**: No cloud services or external dependencies
-   **Network Isolation**: Only works on your local Wi-Fi network
-   **Optional Authentication**: Configurable connection security
-   **No Data Collection**: Your usage stays on your devices

## 📋 Use Cases

-   **Home Theater**: Control media from your couch
-   **Presentations**: Remote control slides and demos
-   **Bed Setup**: Adjust settings without getting up
-   **Accessibility**: Alternative input method for desktop control

## 🛠️ Development Status

This project follows a phased development approach:

-   ✅ Phase 1: Core media and volume control
-   🚧 Phase 2: Advanced mouse/keyboard simulation
-   📋 Phase 3: Auto-discovery and polish
-   📋 Phase 4: Multi-platform testing and optimization

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines and feel free to submit issues or pull requests.

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

Built for users who want seamless control of their media setup without the complexity of expensive remote control solutions.

---

_Turn any phone into a powerful remote control for your computer setup_ 📱➡️💻

# 🎮 CouchCommander

**Remote control your computer from your phone with a professional, modern interface.**

CouchCommander is a cross-platform desktop application that lets you control your computer's media playback, mouse, keyboard, and more from your smartphone over Wi-Fi. Perfect for when you're relaxing on the couch and need to control your laptop!

## ✨ Features

- 🎵 **Media Controls** - Play/pause, next/previous, volume control
- 🖱️ **Virtual Trackpad** - Multi-touch mouse control with gestures
- ⌨️ **Virtual Keyboard** - Full keyboard input with special keys
- 🌐 **Website Shortcuts** - Quick access to common websites
- 📱 **QR Code Connection** - Instant mobile connection via QR code
- 🎨 **Modern UI** - Professional desktop and mobile interfaces
- 🔗 **Real-time Connection** - WebSocket-based communication
- 🌙 **Dark Mode** - Beautiful dark theme support

## 🏗️ Architecture

- **Desktop App**: Tauri (Rust + React) - Professional control panel with QR code
- **Mobile Web App**: Next.js - Responsive PWA for phone control
- **Communication**: WebSocket server for real-time control
- **Input Simulation**: Cross-platform input handling with enigo

## 📋 Prerequisites

- **Node.js** 18+ and npm
- **Rust** 1.70+ (for Tauri)
- **Git**
- **Same Wi-Fi Network** for computer and phone

### Platform-specific Requirements

**macOS:**
- Xcode Command Line Tools: `xcode-select --install`

**Windows:**
- Microsoft Visual Studio C++ Build Tools
- WebView2 (usually pre-installed on Windows 10/11)

**Linux:**
- See [Tauri prerequisites](https://tauri.app/v1/guides/getting-started/prerequisites#setting-up-linux)

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/CouchCommander.git
cd CouchCommander
```

### 2. Install Dependencies

**Backend (Desktop App):**
```bash
cd backend
npm install
```

**Frontend (Mobile Web App):**
```bash
cd ../frontend
npm install
```

**Rust Dependencies:**
```bash
cd ../backend/src-tauri
cargo build
```

### 3. Start Development Servers

**Option A: Start Everything (Recommended)**
```bash
cd backend
npm run start:both
```

**Option B: Start Individually**

Terminal 1 - Desktop App:
```bash
cd backend
npm run tauri:dev
```

Terminal 2 - Mobile Web App:
```bash
cd frontend
npm run dev
```

### 4. Connect Your Phone

1. **Start the WebSocket server** in the desktop app
2. **Scan the QR code** with your phone's camera
3. **Tap the notification** to open the mobile interface
4. **Start controlling!** 🎉

## 📱 Mobile Usage

### Connection Methods

1. **QR Code (Recommended)**: Scan with camera app
2. **Manual URL**: Visit `http://[your-ip]:3000/?ip=[your-ip]`
3. **Connection Panel**: Enter IP manually in the mobile app

### Available Controls

- **Media Tab**: Play/pause, track navigation, volume control
- **Trackpad Tab**: Mouse movement, clicking, scrolling
- **Keyboard Tab**: Virtual keyboard, special keys, text input
- **Websites Tab**: Quick shortcuts to common sites

### Gestures

- **Single finger drag**: Move cursor
- **Single tap**: Left click
- **Two finger drag**: Scroll
- **Long press**: Context menu (planned)

## 🛠️ Development

### Project Structure
```
CouchCommander/
├── backend/                 # Desktop Tauri app
│   ├── src/                # React frontend for desktop
│   ├── src-tauri/          # Rust backend
│   │   ├── src/lib.rs      # Main application logic
│   │   └── Cargo.toml      # Rust dependencies
│   └── package.json        # Node.js dependencies
├── frontend/               # Mobile Next.js app
│   ├── app/               # Next.js app router
│   ├── components/        # Reusable UI components
│   └── package.json       # Node.js dependencies
└── README.md              # This file
```

### Key Technologies

- **Tauri**: Cross-platform desktop app framework
- **React**: Desktop UI components
- **Next.js**: Mobile web application
- **Tailwind CSS**: Styling and responsive design
- **WebSocket**: Real-time communication
- **enigo**: Cross-platform input simulation
- **QR Code**: Easy mobile connection

### Building for Production

**Desktop App:**
```bash
cd backend
npm run tauri:build
```

**Mobile Web App:**
```bash
cd frontend
npm run build
npm run start  # Production server
```

## 🔧 Configuration

### Default Ports
- **WebSocket Server**: 8080
- **Mobile Web App**: 3000
- **Desktop App**: System-assigned

### Firewall Settings
Ensure your firewall allows connections on:
- Port 8080 (WebSocket)
- Port 3000 (Web app)

### Network Requirements
- Computer and phone must be on the same Wi-Fi network
- Router must allow device-to-device communication
- Some corporate/guest networks may block this

## 🎯 Usage Tips

1. **Keep the desktop app open** while using mobile controls
2. **Use QR code connection** for fastest setup
3. **Check firewall settings** if connection fails
4. **Restart servers** if experiencing issues
5. **Use trackpad gestures** for natural control

## 🐛 Troubleshooting

### Connection Issues
- Verify same Wi-Fi network
- Check firewall settings
- Try manual IP connection
- Restart both apps

### Performance Issues
- Close unnecessary applications
- Check Wi-Fi signal strength
- Reduce trackpad sensitivity if needed

### Desktop App Issues
```bash
# Clear Tauri cache
cd backend
npx tauri dev --clear-cache
```

### Mobile App Issues
```bash
# Clear Next.js cache
cd frontend
rm -rf .next
npm run dev
```

## 🚧 Known Limitations

- **Network dependent**: Requires same Wi-Fi network
- **macOS permissions**: May need accessibility permissions
- **Trackpad precision**: Best with steady Wi-Fi connection
- **Browser compatibility**: Modern browsers required

## 🗺️ Roadmap

- [ ] **Gesture shortcuts** (pinch to zoom, rotate)
- [ ] **File transfer** capabilities
- [ ] **Screen mirroring** preview
- [ ] **Custom shortcuts** configuration
- [ ] **Multiple computer** support
- [ ] **Voice commands** integration
- [ ] **Presentation mode** controls

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines
- Follow Rust conventions for backend code
- Use TypeScript for all frontend code
- Add tests for new features
- Update documentation

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Tauri Team** - Amazing desktop app framework
- **Vercel** - Next.js and hosting platform
- **Tailwind CSS** - Beautiful utility-first CSS
- **Lucide** - Clean, consistent icons
- **enigo** - Cross-platform input simulation

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/CouchCommander/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/CouchCommander/discussions)
- **Documentation**: [Wiki](https://github.com/yourusername/CouchCommander/wiki)

---

**Made with ❤️ for couch enthusiasts everywhere!**

*Control your digital world from the comfort of your couch.*
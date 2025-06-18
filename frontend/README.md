# CouchCommander Frontend

A mobile-friendly web interface for controlling your laptop remotely from your phone. Built with Next.js, TypeScript, and Tailwind CSS.

## Features

### 🎵 Media Controls
- Play/Pause, Previous, Next, Stop buttons
- Volume control with slider and quick buttons
- Brightness adjustment with slider and buttons
- Visual feedback for all controls

### 👆 Virtual Trackpad
- Touch-based cursor movement
- Two-finger scrolling
- Tap to click (left/right)
- Desktop mouse support for testing
- Real-time gesture feedback

### ⌨️ Virtual Keyboard
- Full QWERTY layout with letters, numbers, and symbols
- Function keys (F1-F12)
- Special keys (Shift, Caps Lock, Enter, Backspace, etc.)
- Arrow keys for navigation
- Quick text input field for typing longer messages
- Shift and Caps Lock state indicators

### 🌐 Website Shortcuts
- Pre-configured streaming services (Netflix, YouTube, Crunchyroll, etc.)
- Custom URL input
- Quick actions (Google Search, File Explorer)
- One-click access to favorite websites

### 🔌 Connection Management
- Real-time connection status
- Manual IP address entry
- Auto-reconnection handling
- Visual connection indicators

## UI Components

### ConnectionStatus
- Displays current connection state
- IP address input and connection controls
- Status indicators with animations
- Error handling and user feedback

### NavigationTabs
- Tab-based navigation between different control modes
- Touch-friendly design
- Visual active state indicators
- Icon-based navigation

### MediaControls
- Media playback buttons with emoji icons
- Volume and brightness sliders
- Quick action buttons
- Disabled state handling

### VirtualTrackpad
- Large touch area for cursor control
- Multi-touch gesture support
- Visual feedback for different gestures
- Instructions and usage tips

### VirtualKeyboard
- Multiple keyboard layouts (letters, numbers, symbols)
- Modifier key support (Shift, Caps Lock)
- Function keys and special characters
- Quick text input mode

### WebsiteShortcuts
- Grid layout of popular streaming services
- Custom URL input with validation
- Color-coded service buttons
- Usage tips and instructions

## Design Features

### Mobile-First Design
- Optimized for touch interactions
- Responsive layout that works on all screen sizes
- Large tap targets (minimum 44px)
- Intuitive gesture controls

### Visual Feedback
- Button press animations
- Loading states and progress indicators
- Connection status with color coding
- Hover and active states

### Accessibility
- Proper ARIA labels and roles
- Keyboard navigation support
- High contrast colors
- Screen reader friendly

### Progressive Web App (PWA)
- Installable on mobile devices
- Offline capability
- App-like experience
- Custom splash screen and icons

## Technology Stack

- **Framework**: Next.js 15.3.4 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **State Management**: React hooks (useState, useCallback, useRef)
- **WebSocket**: Native WebSocket API
- **PWA**: Web App Manifest

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

4. Enter your laptop's IP address to connect

## Usage

1. **Connect to Server**: Enter your laptop's IP address in the connection field
2. **Choose Control Mode**: Use the tab navigation to switch between different controls
3. **Media Controls**: Control playback, volume, and brightness
4. **Trackpad Mode**: Use your phone as a wireless trackpad
5. **Keyboard Mode**: Type and send keyboard input
6. **Website Shortcuts**: Quick access to streaming services and websites

## Touch Gestures

### Trackpad Mode
- **Single finger drag**: Move cursor
- **Quick tap**: Left click
- **Two finger scroll**: Scroll content
- **Button controls**: Left/right click buttons

### General
- **Tap**: Activate buttons and controls
- **Drag**: Adjust sliders (volume, brightness)
- **Long press**: Context-sensitive actions

## Browser Compatibility

- Chrome/Chromium (recommended)
- Safari (iOS/macOS)
- Firefox
- Edge

## Network Requirements

- Both devices must be on the same Wi-Fi network
- No internet connection required (local network only)
- WebSocket support required

## Troubleshooting

### Connection Issues
- Verify both devices are on the same Wi-Fi network
- Check if the laptop server is running
- Try manually entering the IP address
- Check firewall settings on the laptop

### Touch Issues
- Ensure browser supports touch events
- Try refreshing the page
- Check if device orientation is supported

### Performance Issues
- Close other browser tabs
- Ensure stable Wi-Fi connection
- Try using Chrome for best performance

## Development

### Project Structure
```
frontend/
├── app/
│   ├── layout.tsx          # Root layout with PWA setup
│   ├── page.tsx            # Main application page
│   └── globals.css         # Global styles
├── components/
│   ├── ConnectionStatus.tsx # Connection management
│   ├── NavigationTabs.tsx   # Tab navigation
│   ├── MediaControls.tsx    # Media control buttons
│   ├── VirtualTrackpad.tsx  # Touch trackpad interface
│   ├── VirtualKeyboard.tsx  # Virtual keyboard
│   └── WebsiteShortcuts.tsx # Website launcher
├── public/
│   └── manifest.json       # PWA manifest
└── package.json
```

### Key Features
- **TypeScript**: Full type safety
- **Component-based**: Modular, reusable components
- **Responsive**: Works on all screen sizes
- **Touch-optimized**: Designed for mobile interaction
- **Real-time**: WebSocket communication
- **PWA**: Installable web app

## Future Enhancements

- Voice control integration
- Gesture customization
- Dark mode support
- Multi-device support
- Cloud synchronization
- Advanced keyboard layouts
- Custom button configuration
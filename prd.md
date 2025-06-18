Media Control System Design Document

1. Overview

This document outlines the design for a system that allows a user to control media playback and laptop functions (e.g., volume, brightness, mouse, keyboard) from their phone. The system consists of a desktop application (server/backend) running on a laptop and a mobile client application (frontend) running on a phone, communicating over a local network. The user is proficient in Next.js, so the mobile client will leverage this framework, while the desktop app will use Node.js with Electron for system-level control.

1.1 Purpose

The system enables seamless control of media (TV shows, movies, anime) displayed on a large monitor connected to a laptop, using a phone as a remote interface. Key features include:





Media control (play, pause).



System adjustments (volume, brightness).



Mouse and keyboard control (cursor movement, clicks, typing).



Quick access to specific websites (e.g., Netflix, Crunchyroll).

1.2 Scope





Desktop App: A server running on the laptop, handling system commands and media playback, accessible over the local network.



Mobile Client: A web-based interface on the phone, sending commands to the desktop app.



Communication: Real-time, bidirectional communication over WebSocket.



Constraints:





Both devices must be on the same Wi-Fi network.



No cloud dependency; all communication is local.



Cross-platform support (Windows, macOS, Linux for desktop; iOS/Android for mobile).

2. System Architecture

2.1 Components





Desktop App (Server/Backend):





Platform: Electron with Node.js.



Functionality:





Hosts a WebSocket server for real-time communication.



Executes system commands (e.g., mouse movement, volume adjustment).



Controls media playback (e.g., play/pause in media players or browsers).



Provides an HTTP endpoint for service discovery.



Dependencies:





robotjs: For mouse/keyboard simulation.



systemcontrol or equivalent: For volume/brightness control.



node-media-controller or similar: For media playback control.



ws: For WebSocket server.



mdns: For auto-discovery on the local network.



open: To launch websites in the default browser.



Mobile Client (Frontend):





Platform: Next.js web app, accessible via phone browser (or packaged as a Progressive Web App).



Functionality:





Provides a touch-friendly UI for sending commands (e.g., buttons for play/pause, sliders for volume).



Supports virtual trackpad for mouse control and virtual keyboard for text input.



Connects to the desktop’s WebSocket server.



Dependencies:





next: For building the web app.



tailwindcss: For responsive styling.



websocket: For client-side WebSocket communication.



Communication Layer:





Protocol: WebSocket for real-time, bidirectional command transmission.



Discovery: HTTP endpoint or mDNS for the phone to locate the desktop server.



Data Format: JSON messages (e.g., { type: "play" }, { type: "mouse_move", x: 10, y: 20 }).

2.2 Architecture Diagram

[Phone (Mobile Client)] <--> [WebSocket/HTTP] <--> [Laptop (Desktop Server)]
   |                           |                     |
   | Next.js Web App          |                     | Electron App
   | - UI (Buttons, Trackpad) |                     | - WebSocket Server
   | - WebSocket Client       |                     | - System Control
   |                           |                     | - Media Control
   |                           |                     | - HTTP Discovery
   +---------------------------+                     +---------------------+

2.3 Network Setup





Both devices connect to the same local Wi-Fi network.



The desktop app binds to a local IP (e.g., 192.168.1.100) and listens on:





Port 3000 for HTTP discovery.



Port 8080 for WebSocket communication.



The mobile client discovers the server via:





Manual IP entry (user inputs the laptop’s IP).



Auto-discovery using mDNS or an HTTP /discover endpoint returning the WebSocket URL (e.g., ws://192.168.1.100:8080).

3. Functional Requirements

3.1 Desktop App





Media Control:





Play/pause media in active applications (e.g., VLC, browser-based players).



Send media key events (e.g., spacebar for pause).



System Control:





Adjust system volume (up/down/mute).



Adjust screen brightness (up/down).



Move mouse cursor (relative coordinates).



Simulate mouse clicks (left/right).



Simulate keyboard key presses (e.g., single keys, text input).



Website Navigation:





Open predefined websites (e.g., Netflix, Crunchyroll) in the default browser.



Server Features:





Host WebSocket server for command reception.



Provide HTTP endpoint for discovery.



Support mDNS for auto-discovery.



Minimize to system tray for unobtrusive operation.



Error Handling:





Log errors (e.g., invalid commands, system access issues).



Send error responses to the client (e.g., { status: "error", message: "Invalid key" }).

3.2 Mobile Client





User Interface:





Buttons for media control (play, pause).



Sliders or buttons for volume and brightness.



Virtual trackpad area for mouse movement.



Virtual keyboard for text input.



Buttons for launching websites (e.g., Netflix, Crunchyroll).



Input field for manual server IP entry.



Status indicator for connection state (connected/disconnected).



Connectivity:





Connect to WebSocket server using discovered or manually entered IP.



Handle connection errors (e.g., server offline, wrong IP).



Responsiveness:





Touch-friendly design optimized for mobile screens.



Support for both portrait and landscape modes.

4. Non-Functional Requirements





Performance:





Low latency for commands (<100ms for mouse movement, media control).



Minimal CPU/memory usage on both devices.



Security:





Restrict access to local network (no external exposure).



Optional: Implement basic authentication (e.g., shared secret in WebSocket handshake).



Reliability:





Graceful handling of network disconnections.



Reconnection logic in the mobile client.



Usability:





Intuitive UI with clear feedback (e.g., button press confirmation).



Easy setup (minimal configuration required).



Cross-Platform:





Desktop: Support Windows, macOS, Linux.



Mobile: Support iOS/Android via browser.

5. Technical Design

5.1 Desktop App





Framework: Electron for cross-platform desktop app development.



Modules:





robotjs: Simulates mouse movements, clicks, and keyboard input.



systemcontrol: Adjusts volume and brightness (platform-specific).



node-media-controller: Sends media control commands.



ws: Implements WebSocket server.



mdns: Advertises service for auto-discovery.



open: Launches URLs in the default browser.



Structure:





main.js: Main process handling server, system commands, and tray integration.



index.html: Simple UI showing server status (IP, port).



WebSocket Commands:





Format: { type: string, [payload]: any }.



Examples:





{ type: "play" }



{ type: "mouse_move", x: number, y: number }



{ type: "key_tap", key: string }



{ type: "open_website", url: string }



Discovery:





HTTP endpoint: GET /discover returns { wsUrl: "ws://<ip>:8080" }.



mDNS: Advertises service as _media-control._tcp.local.

5.2 Mobile Client





Framework: Next.js with Tailwind CSS.



Structure:





pages/index.js: Main page with UI components.



components/Trackpad.js: Virtual trackpad for mouse control.



components/Keyboard.js: Virtual keyboard for text input.



styles/globals.css: Tailwind CSS setup.



Features:





WebSocket client connects to server and sends commands.



UI includes buttons, sliders, and touch areas.



Connection status updates in real-time.



Discovery:





Manual: User enters IP in a text field.



Auto: Fetch from HTTP /discover or resolve mDNS service.

5.3 Communication Protocol





WebSocket:





URL: ws://<laptop-ip>:8080.



Messages: JSON objects with type and optional payload.



Responses: { status: "success" | "error", type: string, [error]: string }.



HTTP Discovery:





Endpoint: http://<laptop-ip>:3000/discover.



Response: { wsUrl: string }.



mDNS:





Service type: _media-control._tcp.local.



Advertises WebSocket port (8080).

6. Development Plan

6.1 Setup





Desktop App:





Initialize Electron project (npm init, install electron, ws, etc.).



Configure robotjs (requires build tools like Python, Visual Studio).



Set up system tray and basic UI.



Mobile Client:





Create Next.js project (npx create-next-app).



Install Tailwind CSS (npm install -D tailwindcss).



Set up WebSocket client and UI components.

6.2 Implementation Phases





Phase 1: Core Functionality (1-2 weeks)





Desktop: WebSocket server, media control (play/pause), volume control.



Mobile: Basic UI with play/pause/volume buttons, WebSocket connection.



Phase 2: Advanced Controls (1-2 weeks)





Desktop: Mouse/keyboard simulation, brightness control, website launching.



Mobile: Virtual trackpad, keyboard, website buttons.



Phase 3: Discovery and Polish (1 week)





Desktop: HTTP discovery endpoint, mDNS setup.



Mobile: Auto-discovery, connection status, error handling.



Phase 4: Testing and Deployment (1 week)





Test on multiple platforms (Windows/macOS, iOS/Android).



Optimize performance (latency, resource usage).



Document setup instructions.

6.3 Dependencies





Desktop: electron, ws, robotjs, systemcontrol, node-media-controller, mdns, open.



Mobile: next, tailwindcss, websocket.

7. Testing Strategy





Unit Tests:





Desktop: Test command handlers (e.g., simulate mouse move, verify media play).



Mobile: Test UI components (e.g., button clicks send correct commands).



Integration Tests:





Verify WebSocket communication (phone sends command, desktop executes).



Test discovery (phone finds server via HTTP/mDNS).



Manual Tests:





Media control on different players (VLC, Netflix in browser).



System control on multiple OS (Windows, macOS).



Mobile UI responsiveness on iOS/Android.



Edge Cases:





Network disconnection/reconnection.



Invalid commands or IPs.



System permission issues (e.g., brightness control on Linux).

8. Deployment





Desktop App:





Package with Electron (electron-packager or electron-builder).



Provide installers for Windows (.exe), macOS (.dmg), Linux (.deb).



Run on laptop startup (optional).



Mobile Client:





Host locally on laptop (next dev) or deploy as static site.



Access via phone browser (http://<laptop-ip>:3000).



Optional: Package as PWA for offline installation on phone.



Setup Instructions:





Ensure laptop/phone on same Wi-Fi.



Start desktop app; note IP or use discovery.



Open mobile app in phone browser, enter IP or auto-connect.

9. Security Considerations





Network Security:





Restrict WebSocket/HTTP to local network (bind to 192.168.x.x or 127.0.0.1).



Optional: Add authentication token in WebSocket connection.



Command Validation:





Sanitize inputs to prevent malicious commands (e.g., restrict URLs to predefined list).



Permissions:





Request system permissions (e.g., accessibility for mouse/keyboard on macOS).



Handle permission denials gracefully.

10. Future Enhancements





Customizable Buttons: Allow users to add website shortcuts.



Gesture Controls: Swipe gestures for media scrubbing or volume.



Cloud Sync: Optional cloud for cross-network control (requires secure authentication).



Voice Commands: Integrate speech recognition on mobile client.



Multi-Monitor Support: Select monitor for mouse control.

11. Assumptions





User has Next.js proficiency and can set up Node.js environments.



Laptop and phone are on the same local network.



System permissions (e.g., for brightness, mouse) are granted.



Media players/browsers respond to standard media key events.

12. Risks and Mitigations





Risk: robotjs build issues on some platforms.





Mitigation: Provide detailed setup instructions, fallback to alternative libraries.



Risk: Inconsistent media control across apps.





Mitigation: Test with popular players (VLC, Netflix, YouTube), use browser automation if needed.



Risk: Network discovery fails.





Mitigation: Support manual IP entry as fallback.



Risk: System permissions denied.





Mitigation: Display clear error messages, guide user to grant permissions.

13. Conclusion

This system provides a robust solution for controlling a laptop’s media and system functions from a phone, leveraging the user’s Next.js expertise. By using Electron for the desktop and Next.js for the mobile client, the system is cross-platform, responsive, and extensible. The design prioritizes low latency, ease of use, and local network security, with clear paths for testing and future enhancements.

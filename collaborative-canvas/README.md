# Collaborative Drawing App

A real-time multi-user drawing application built with React, Node.js, and Socket.io.

## Features
- **Real-time Drawing**: See other users draw instantly.
- **User Cursors**: Live cursor positions for all users.
- **Global Undo/Redo**: Undo the last action globally (synchronized across all users).
- **Tools**: Brush, Eraser, Color Picker, Size Slider.
- **Responsive**: Full-screen canvas.

## Setup Instructions

### Prerequisites
- Node.js installed.

### Installation

1.  **Install Server Dependencies**:
    ```bash
    cd collaborative-canvas/server
    npm install
    ```

2.  **Install Client Dependencies**:
    ```bash
    cd collaborative-canvas/client
    npm install
    ```

### Running the App

1.  **Start the Server** (Terminal 1):
    ```bash
    cd collaborative-canvas/server
    npm run dev
    ```
    Server runs on `http://localhost:3001`.

2.  **Start the Client** (Terminal 2):
    ```bash
    cd collaborative-canvas/client
    npm run dev
    ```
    Client runs on `http://localhost:5173`.

### Testing
1.  Open `http://localhost:5173` in a browser.
2.  Open the same URL in a **Incognito Window** or another browser.
3.  Draw in one window and watch it appear in the other.
4.  Test Undo/Redo to see global state synchronization.

## Known Limitations
-   **Canvas Resize**: Resizing the window clears the local canvas temporarily until an update (in a production app, we'd redraw on resize).
-   **Network**: Optimized for low latency, but high latency might cause jumpy cursors.

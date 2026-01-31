# Architecture Documentation

## Data Flow Diagram

1.  **User Interaction**: User draws on `<canvas>` (Mouse/Touch events).
2.  **Local Render**: Canvas updates immediately (Optimistic UI) and emits `draw` event to Server via Socket.io.
3.  **Server Processing**:
    -   Server receives `draw` event (stroke points, color, size).
    -   Server appends operation to `Global History` (Stack).
    -   Server clears `Redo Stack`.
    -   Server broadcasts `new-stroke` to all *other* clients.
4.  **Client Sync**: Other clients receive `new-stroke` and render it.

## WebSocket Protocol

### Client -> Server
| Event | Payload | Description |
|-------|---------|-------------|
| `draw` | `{ points: Point[], color, size }` | A completed stroke. |
| `cursor-move` | `{ x, y }` | Current mouse position. |
| `undo` | `{}` | Request global undo. |
| `redo` | `{}` | Request global redo. |

### Server -> Client
| Event | Payload | Description |
|-------|---------|-------------|
| `init-state` | `{ history: Op[], users: User[] }` | Sent on connection. |
| `new-stroke` | `Operation` | A new stroke from another user. |
| `cursor-update` | `{ id, x, y }` | Another user's cursor moved. |
| `history-update` | `Operation[]` | Full redraw trigger (after undo/redo). |
| `user-joined` | `User` | New user connected. |
| `user-left` | `userId` | User disconnected. |

## Undo/Redo Strategy (Global)

We implement a **Strict Global Undo**.
-   **Structure**: The server maintains a linear `history` array of all operations.
-   **Undo**: Removes the *last element* from `history`, regardless of who performed it. Pushes it to `redoStack`.
-   **Sync**: When an Undo/Redo occurs, the server emits `history-update` containing the *entire* valid history.
-   **Client**: Upon receiving `history-update`, the client *clears the canvas* and redraws every stroke in the received history.
-   **Reasoning**: This ensures perfect consistency. If User A draws and then User B draws, User A's "Undo" will undo User B's action. This is the intended behavior for "Global Undo".

## Conflict Resolution

-   **Concurrency**: handled by the single-threaded nature of Node.js event loop. Operations are processed one by one.
-   **Order**: The drawing order is determined by the arrival time at the server.
-   **Visuals**: Since canvas operations are additive, we don't have complex merge conflicts (like text editing). We simply layer strokes.

## Performance Decisions

-   **Stroke Batching**: We send completed strokes (on `mouseup`) rather than every pixel (on `mousemove` with high frequency) to reduce network overhead. *Correction: Implementation actually sends chunks or full strokes. Current implementation sends full path on `mouseup` for simplicity and atomicity of Undo.*
-   **Cursor Throttling**: Cursor updates are high-frequency; in a production app, we would throttle these. (Implemented as raw events for responsiveness in this demo).
-   **Optimized Rendering**: Using `requestAnimationFrame` is implicit in how browsers handle canvas, but we draw immediately on event receipt.

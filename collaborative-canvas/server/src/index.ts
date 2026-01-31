import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { DrawingState } from './DrawingState';

const app = express();
app.use(cors());

// Serve static files from the client dist folder
const clientDistPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const drawingState = new DrawingState();

// Handle SPA routing: serve index.html for any unknown route
app.get('*', (req, res, next) => {
    // If request is for API/socket, skip
    if (req.path.startsWith('/socket.io')) return next();

    res.sendFile(path.join(clientDistPath, 'index.html'));
});

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    const { color, username } = drawingState.addUser(socket.id, `User ${socket.id.substr(0, 4)}`);

    socket.emit('init-state', {
        history: drawingState.getHistory(),
        users: drawingState.getUsers(),
        myId: socket.id,
        myColor: color
    });

    socket.broadcast.emit('user-joined', { id: socket.id, username, color });

    socket.on('draw', (data) => {
        const op = drawingState.addOperation({
            userId: socket.id,
            type: 'stroke',
            points: data.points,
            color: data.color,
            size: data.size
        });
        socket.broadcast.emit('new-stroke', op);
    });

    socket.on('cursor-move', (data) => {
        drawingState.updateCursor(socket.id, data.x, data.y);
        socket.broadcast.emit('cursor-update', { id: socket.id, x: data.x, y: data.y });
    });

    socket.on('undo', () => {
        const undoOp = drawingState.undo();
        if (undoOp) {
            io.emit('history-update', drawingState.getHistory());
        }
    });

    socket.on('redo', () => {
        const redoOp = drawingState.redo();
        if (redoOp) {
            io.emit('history-update', drawingState.getHistory());
        }
    });

    socket.on('disconnect', () => {
        drawingState.removeUser(socket.id);
        io.emit('user-left', socket.id);
    });
});

const PORT = 3001;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

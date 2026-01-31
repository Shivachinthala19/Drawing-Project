import { io, Socket } from 'socket.io-client';

const getSocketURL = () => {
    // In production, we use the same domain (relative path).
    if (import.meta.env.PROD) {
        return undefined;
    }
    const hostname = window.location.hostname;
    return `http://${hostname}:3001`;
};

export const socket: Socket = io(getSocketURL() || window.location.origin, {
    transports: ['websocket'],
    autoConnect: true
});

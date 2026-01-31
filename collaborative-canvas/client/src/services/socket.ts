import { io, Socket } from 'socket.io-client';

const getSocketURL = () => {
    // If we are in production (or just need to adapt), usage of window.location.hostname 
    // allows access from other devices on the network (e.g. 192.168.x.x)
    const hostname = window.location.hostname;
    return `http://${hostname}:3001`;
};

export const socket: Socket = io(getSocketURL(), {
    transports: ['websocket'],
    autoConnect: true
});

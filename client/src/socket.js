import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

console.log(`Initializing Socket.io client connecting to: ${SOCKET_URL}`);

// Configure socket to use websocket transport first and avoid polling delays if possible
export const socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ['websocket', 'polling']
});

export default socket;

import { io } from 'socket.io-client';
import { API_URL } from './api.js';

let socket;

export const getSocket = () => {
  if (!socket) {
    socket = io(API_URL, {
      autoConnect: true,
      transports: ['websocket', 'polling']
    });
  }
  return socket;
};

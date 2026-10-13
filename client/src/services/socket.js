import { io } from "socket.io-client";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  window.location.origin;

let socket = null;

export const getSocket = () => {
  if (!socket) {
    const token =
      localStorage.getItem("token");

    socket = io(SOCKET_URL, {
      autoConnect: false,

      auth: {
        token,
      },
    });
  }

  return socket;
};

export const connectSocket = () => {
  const currentSocket =
    getSocket();

  const token =
    localStorage.getItem("token");

  currentSocket.auth = {
    token,
  };

  if (!currentSocket.connected) {
    currentSocket.connect();
  }

  return currentSocket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
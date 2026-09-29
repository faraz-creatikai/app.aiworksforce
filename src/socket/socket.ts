import { API_URL } from "@/constants/ApiRoute";
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const initSocket = (adminId: string): Socket => {
  if (socket) return socket;

  socket = io(API_URL, {
    withCredentials: true,
    auth: { adminId },
    transports: ["websocket"], 
  });
console.log(" socket initialized with adminId: ", adminId);
  return socket;
};



export const getSocket = (): Socket | null => socket;

export const disconnectSocket = () => {
  socket?.disconnect();
  socket = null;
};


// ---------- Customer socket ----------
// Separate variable so it never collides with the admin socket.
// No id is sent: the server reads it from the login cookie.
let customerSocket: Socket | null = null;

export const initCustomerSocket = (): Socket => {
  if (customerSocket) return customerSocket;
  customerSocket = io(API_URL, {
    withCredentials: true,
    auth: { role: "customer" },
    transports: ["websocket"],
  });
  return customerSocket;
};

export const disconnectCustomerSocket = () => {
  customerSocket?.disconnect();
  customerSocket = null;
};
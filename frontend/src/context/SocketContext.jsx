import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import useAuthUser from "../hooks/useAuthUser";

const SocketContext = createContext();

export const useSocketContext = () => {
    return useContext(SocketContext);
};

// Assuming backend is on same domain in production, or specific URL in dev
const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:5001" : "/";

export const SocketContextProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const { authUser } = useAuthUser();

    useEffect(() => {
        if (authUser) {
            const socketInstance = io(BASE_URL, {
                query: {
                    userId: authUser._id,
                },
            });

            setSocket(socketInstance);

            socketInstance.on("connect", () => {
                console.log("Socket connected:", socketInstance.id);
                socketInstance.emit("join-user-room", authUser._id);
            });

            return () => {
                socketInstance.close();
                setSocket(null);
            };
        } else {
            if (socket) {
                socket.close();
                setSocket(null);
            }
        }
    }, [authUser]);

    return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
};

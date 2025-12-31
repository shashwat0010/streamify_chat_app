import { useSocketContext } from '../context/SocketContext';
import { useEffect } from 'react';
import toast from 'react-hot-toast';
import useFriendStore from '../store/friendStore';

const useSocket = () => {
    const socket = useSocketContext();
    const { addFriendRequest } = useFriendStore();

    useEffect(() => {
        if (socket) {
            const handleFriendRequest = (requestData) => {
                toast("New friend request received!", { icon: '👋' });
                addFriendRequest(requestData);
            };

            socket.on("new-friend-request", handleFriendRequest);

            return () => {
                socket.off("new-friend-request", handleFriendRequest);
            };
        }
    }, [socket, addFriendRequest]);

    return socket;
};

export default useSocket;

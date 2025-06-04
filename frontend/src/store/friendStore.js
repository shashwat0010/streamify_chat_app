import { create } from 'zustand';
import axios from 'axios';

const useFriendStore = create((set) => ({
  friends: [],
  friendRequests: [],
  loading: false,
  error: null,

  // Get friends list
  getFriends: async () => {
    try {
      set({ loading: true, error: null });
      const response = await axios.get('/api/friends', { withCredentials: true });
      set({ friends: response.data, loading: false });
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to fetch friends', loading: false });
    }
  },

  // Get friend requests
  getFriendRequests: async () => {
    try {
      set({ loading: true, error: null });
      const response = await axios.get('/api/friends/requests', { withCredentials: true });
      set({ friendRequests: response.data, loading: false });
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to fetch friend requests', loading: false });
    }
  },

  // Send friend request
  sendFriendRequest: async (recipientId) => {
    try {
      set({ loading: true, error: null });
      await axios.post('/api/friends/request', { recipientId }, { withCredentials: true });
      set({ loading: false });
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to send friend request', loading: false });
    }
  },

  // Accept friend request
  acceptFriendRequest: async (requestId) => {
    try {
      set({ loading: true, error: null });
      await axios.put(`/api/friends/request/${requestId}/accept`, {}, { withCredentials: true });
      set((state) => ({
        friendRequests: state.friendRequests.filter(request => request._id !== requestId),
        loading: false
      }));
      // Refresh friends list
      const response = await axios.get('/api/friends', { withCredentials: true });
      set({ friends: response.data });
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to accept friend request', loading: false });
    }
  },

  // Remove friend
  removeFriend: async (friendId) => {
    try {
      set({ loading: true, error: null });
      await axios.delete(`/api/friends/${friendId}`, { withCredentials: true });
      set((state) => ({
        friends: state.friends.filter(friend => friend._id !== friendId),
        loading: false
      }));
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to remove friend', loading: false });
    }
  },

  // Clear error
  clearError: () => set({ error: null }),
}));

export default useFriendStore; 
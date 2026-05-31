import { create } from 'zustand';
import { axiosInstance } from '../lib/axios';

const useFriendStore = create((set) => ({
  friends: [],
  friendRequests: [],

  // Loading states
  isFetchingFriends: false,
  isFetchingRequests: false,
  processingIds: [], // Array of IDs being processed

  error: null,

  // Get friends list
  getFriends: async () => {
    try {
      set({ isFetchingFriends: true, error: null });
      const response = await axiosInstance.get('/users/friends');
      set({ friends: response.data, isFetchingFriends: false });
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to fetch friends', isFetchingFriends: false });
    }
  },

  // Get friend requests
  getFriendRequests: async () => {
    try {
      set({ isFetchingRequests: true, error: null });
      const response = await axiosInstance.get('/users/friend-requests');
      // friend-requests returns { incomingReqs, acceptedReqs }. The store expects an array.
      // Wait, let's map the incomingReqs which are pending to be friendRequests.
      set({ friendRequests: response.data?.incomingReqs || [], isFetchingRequests: false });
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to fetch friend requests', isFetchingRequests: false });
    }
  },

  addFriendRequest: (request) => {
    set((state) => ({ friendRequests: [...state.friendRequests, request] }));
  },

  // Send friend request
  sendFriendRequest: async (recipientId) => {
    try {
      set((state) => ({ processingIds: [...state.processingIds, "send_request"], error: null }));
      await axiosInstance.post(`/users/friend-request/${recipientId}`);
      set((state) => ({ processingIds: state.processingIds.filter(id => id !== "send_request") }));
    } catch (error) {
      set((state) => ({
        error: error.response?.data?.message || 'Failed to send friend request',
        processingIds: state.processingIds.filter(id => id !== "send_request")
      }));
      throw error; // Re-throw so component can handle UI feedback
    }
  },

  // Accept friend request
  acceptFriendRequest: async (requestId) => {
    try {
      set((state) => ({ processingIds: [...state.processingIds, requestId], error: null }));
      await axiosInstance.put(`/users/friend-request/${requestId}/accept`);
      set((state) => ({
        friendRequests: state.friendRequests.filter(request => request._id !== requestId),
        processingIds: state.processingIds.filter(id => id !== requestId)
      }));
      // Refresh friends list
      const response = await axiosInstance.get('/users/friends');
      set({ friends: response.data });
    } catch (error) {
      set((state) => ({
        error: error.response?.data?.message || 'Failed to accept friend request',
        processingIds: state.processingIds.filter(id => id !== requestId)
      }));
    }
  },

  // Remove friend
  removeFriend: async (friendId) => {
    try {
      set((state) => ({ processingIds: [...state.processingIds, friendId], error: null }));
      await axiosInstance.delete(`/users/friends/${friendId}`);
      set((state) => ({
        friends: state.friends.filter(friend => friend._id !== friendId),
        processingIds: state.processingIds.filter(id => id !== friendId)
      }));
    } catch (error) {
      set((state) => ({
        error: error.response?.data?.message || 'Failed to remove friend',
        processingIds: state.processingIds.filter(id => id !== friendId)
      }));
    }
  },

  // Clear error
  clearError: () => set({ error: null }),
}));

export default useFriendStore;
import { useState } from 'react';
import useFriendStore from '../store/friendStore';
import axios from 'axios';
import toast from 'react-hot-toast';

const SendFriendRequest = () => {
  const [email, setEmail] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const { sendFriendRequest, loading, error } = useFriendStore();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!email) return;

    try {
      const response = await axios.get(`/api/users/search?email=${email}`, { withCredentials: true });
      if (response.data) {
        setSearchResult(response.data);
      } else {
        toast.error('User not found');
        setSearchResult(null);
      }
    } catch (error) {
      console.error('Failed to search user:', error);
      toast.error(error.response?.data?.message || 'User not found');
      setSearchResult(null);
    }
  };

  const handleSendRequest = async () => {
    if (!searchResult) return;

    try {
      await sendFriendRequest(searchResult._id);
      setEmail('');
      setSearchResult(null);
      toast.success('Friend request sent successfully!');
    } catch (error) {
      console.error('Failed to send friend request:', error);
      toast.error(error.response?.data?.message || 'Failed to send friend request');
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow ml-4 max-w-md">
      <h2 className="text-xl font-semibold mb-4">Add Friend</h2>
      <form onSubmit={handleSearch} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Friend's Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Enter friend's email"
            required
          />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Searching...' : 'Search User'}
        </button>
      </form>

      {searchResult && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-4">
            <img
              src={searchResult.profilePic || '/default-avatar.png'}
              alt={searchResult.fullName}
              className="w-12 h-12 rounded-full"
            />
            <div>
              <h3 className="font-medium">{searchResult.fullName}</h3>
              <p className="text-sm text-gray-500">{searchResult.email}</p>
            </div>
          </div>
          <button
            onClick={handleSendRequest}
            disabled={loading}
            className="mt-4 w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
          >
            Send Friend Request
          </button>
        </div>
      )}
    </div>
  );
};

export default SendFriendRequest; 
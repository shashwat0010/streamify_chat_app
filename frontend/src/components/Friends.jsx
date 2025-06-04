import { useEffect } from 'react';
import useFriendStore from '../store/friendStore';

const Friends = () => {
  const { 
    friends, 
    friendRequests, 
    loading, 
    error, 
    getFriends, 
    getFriendRequests, 
    acceptFriendRequest, 
    removeFriend 
  } = useFriendStore();

  useEffect(() => {
    getFriends();
    getFriendRequests();
  }, [getFriends, getFriendRequests]);

  if (loading) {
    return <div className="flex justify-center items-center h-full">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center">{error}</div>;
  }

  return (
    <div className="p-4">
      {/* Friend Requests */}
      {friendRequests.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Friend Requests</h2>
          <div className="space-y-4">
            {friendRequests.map((request) => (
              <div key={request._id} className="flex items-center justify-between bg-gray-100 p-4 rounded-lg">
                <div className="flex items-center space-x-4">
                  <img
                    src={request.sender.profilePic || '/default-avatar.png'}
                    alt={request.sender.fullName}
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <h3 className="font-medium">{request.sender.fullName}</h3>
                  </div>
                </div>
                <button
                  onClick={() => acceptFriendRequest(request._id)}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Accept
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Friends List */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Friends</h2>
        {friends.length === 0 ? (
          <p className="text-gray-500">No friends yet</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {friends.map((friend) => (
              <div key={friend._id} className="bg-white p-4 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <img
                      src={friend.profilePic || '/default-avatar.png'}
                      alt={friend.fullName}
                      className="w-16 h-16 rounded-full"
                    />
                    <div>
                      <h3 className="font-medium">{friend.fullName}</h3>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFriend(friend._id)}
                    className="text-red-500 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition-colors"
                    title="Remove Friend"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Friends; 
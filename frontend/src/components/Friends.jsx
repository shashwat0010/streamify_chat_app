import { useEffect, useState } from "react";
import useFriendStore from "../store/friendStore";
import Avatar from "./Avatar";
import { rejectFriendRequest as rejectApi } from "../lib/api";
import toast from "react-hot-toast";
import { UserCheckIcon, Trash2Icon, UserXIcon, CheckIcon, GlobeIcon, MailIcon, ClockIcon, MessageSquareIcon } from "lucide-react";
import { Link } from "react-router";
import UserProfileModal from "./UserProfileModal";

const Friends = () => {
  const {
    friends,
    friendRequests,
    isFetchingFriends,
    processingIds,
    error,
    getFriends,
    getFriendRequests,
    acceptFriendRequest,
    removeFriend,
  } = useFriendStore();

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [viewingUser, setViewingUser] = useState(null);
  const [isRejecting, setIsRejecting] = useState(false);

  useEffect(() => {
    getFriends();
    getFriendRequests();
  }, [getFriends, getFriendRequests]);

  const isProcessing = (id) => processingIds.includes(id);

  const handleReject = async (requestId) => {
    setIsRejecting(true);
    try {
      await rejectApi(requestId);
      toast.success("Friend request declined");
      getFriendRequests();
      setSelectedRequest(null);
    } catch (err) {
      toast.error("Failed to decline request");
    } finally {
      setIsRejecting(false);
    }
  };

  if (isFetchingFriends && friends.length === 0) {
    return (
      <div className="flex justify-center items-center py-16">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error max-w-md mx-auto my-6 rounded-2xl">
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-8">
      {/* Friend Requests Section */}
      {friendRequests.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-extrabold flex items-center gap-2 border-b border-base-300 pb-2">
            <UserCheckIcon className="size-5 text-primary" />
            Friend Requests
            <span className="badge badge-sm badge-secondary">{friendRequests.length}</span>
          </h2>
          
          <div className="space-y-3">
            {friendRequests.map((request) => (
              <div
                key={request._id}
                className="card bg-base-200 border border-base-300 shadow-sm rounded-2xl"
              >
                <div className="card-body p-4 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                  {/* Clickable Left Side Info */}
                  <div
                    className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer group select-none w-full sm:w-auto"
                    onClick={() => setSelectedRequest(request)}
                  >
                    <div className="avatar size-11 rounded-full overflow-hidden hover:ring hover:ring-primary/55 transition-all flex-shrink-0">
                      <Avatar
                        src={request.sender.profilePic || "/default-avatar.png"}
                        alt={request.sender.fullName}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-sm group-hover:underline group-hover:text-primary transition-all truncate">
                        {request.sender.fullName}
                      </h3>
                      {request.sender.nativeLanguage && (
                        <p className="text-xxs opacity-65 truncate mt-0.5">
                          Native: {request.sender.nativeLanguage} • Learning: {request.sender.learningLanguage}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right Side Action Buttons */}
                  <div className="flex gap-2 w-full sm:w-auto justify-end sm:justify-start">
                    <button
                      onClick={() => acceptFriendRequest(request._id)}
                      disabled={isProcessing(request._id) || isRejecting}
                      className="btn btn-primary btn-sm rounded-xl text-white px-5 flex-1 sm:flex-initial"
                    >
                      {isProcessing(request._id) ? (
                        <span className="loading loading-spinner loading-xs" />
                      ) : (
                        "Accept"
                      )}
                    </button>
                    <button
                      onClick={() => handleReject(request._id)}
                      disabled={isProcessing(request._id) || isRejecting}
                      className="btn btn-ghost btn-sm rounded-xl px-5 hover:bg-error/10 hover:text-error transition-all flex-1 sm:flex-initial"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Friends List Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-extrabold flex items-center gap-2 border-b border-base-300 pb-2">
          <GlobeIcon className="size-5 text-secondary" />
          Friends
        </h2>

        {friends.length === 0 ? (
          <div className="card bg-base-200 border border-base-300 p-8 text-center rounded-2xl max-w-sm mx-auto space-y-2 opacity-70">
            <UserXIcon className="size-10 text-base-content/50 mx-auto" />
            <h3 className="font-bold text-sm">No friends added yet</h3>
            <p className="text-xs opacity-75">Search for email addresses to send invitations!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {friends.map((friend) => (
              <div
                key={friend._id}
                className="card bg-base-200 border border-base-300 shadow-sm hover:shadow duration-155 rounded-2xl"
              >
                <div className="card-body p-4 flex flex-row items-center justify-between gap-3">
                  <div
                    onClick={() => setViewingUser(friend)}
                    className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer group"
                    title="View Profile"
                  >
                    <div className="avatar size-12 rounded-full overflow-hidden flex-shrink-0 group-hover:scale-105 transition-all">
                      <Avatar
                        src={friend.profilePic || "/default-avatar.png"}
                        alt={friend.fullName}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-sm truncate group-hover:underline group-hover:text-primary transition-all">
                        {friend.fullName}
                      </h3>
                      {friend.nativeLanguage && (
                        <p className="text-xxs opacity-60 truncate mt-0.5">
                          {friend.nativeLanguage} • {friend.learningLanguage}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Link
                      to={`/chat/${friend._id}`}
                      className="btn btn-ghost btn-circle btn-sm text-primary hover:bg-primary/15"
                      title="Chat"
                    >
                      <MessageSquareIcon className="size-4" />
                    </Link>
                    <button
                      onClick={() => removeFriend(friend._id)}
                      disabled={isProcessing(friend._id)}
                      className="btn btn-ghost btn-circle btn-sm text-error hover:bg-error/15"
                      title="Remove Friend"
                    >
                      {isProcessing(friend._id) ? (
                        <span className="loading loading-spinner loading-xs" />
                      ) : (
                        <Trash2Icon className="size-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Profile Detail Modal Overlay */}
      {selectedRequest && (
        <div className="modal modal-open modal-bottom sm:modal-middle" onClick={() => setSelectedRequest(null)}>
          <div className="modal-box bg-base-100 border border-base-300 rounded-3xl p-5 relative" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setSelectedRequest(null)}
              className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4"
            >
              ✕
            </button>
            
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="avatar">
                <div className="w-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                  <Avatar
                    src={selectedRequest.sender.profilePic || "/default-avatar.png"}
                    alt={selectedRequest.sender.fullName}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-bold">{selectedRequest.sender.fullName}</h3>
                <p className="text-xs opacity-70">{selectedRequest.sender.email || "No email provided"}</p>
              </div>

              <div className="divider my-1 w-full"></div>

              <div className="grid grid-cols-2 gap-3 w-full text-left">
                <div className="bg-base-200 p-3 rounded-2xl border border-base-300">
                  <span className="text-xxs opacity-60 block font-semibold uppercase tracking-wider">Native</span>
                  <span className="text-xs sm:text-sm font-bold text-primary mt-0.5 block truncate">{selectedRequest.sender.nativeLanguage || "Not Specified"}</span>
                </div>
                <div className="bg-base-200 p-3 rounded-2xl border border-base-300">
                  <span className="text-xxs opacity-60 block font-semibold uppercase tracking-wider">Learning</span>
                  <span className="text-xs sm:text-sm font-bold text-secondary mt-0.5 block truncate">{selectedRequest.sender.learningLanguage || "Not Specified"}</span>
                </div>
              </div>

              <div className="modal-action w-full flex flex-col-reverse sm:flex-row gap-2 mt-6">
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="btn btn-ghost flex-1 rounded-xl normal-case btn-sm h-10 w-full sm:w-auto"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    acceptFriendRequest(selectedRequest._id);
                    setSelectedRequest(null);
                  }}
                  className="btn btn-primary flex-1 rounded-xl text-white normal-case btn-sm h-10 w-full sm:w-auto"
                  disabled={isProcessing(selectedRequest._id) || isRejecting}
                >
                  Accept Request
                </button>
                <button
                  onClick={() => handleReject(selectedRequest._id)}
                  className="btn btn-outline btn-error flex-1 rounded-xl normal-case btn-sm h-10 w-full sm:w-auto"
                  disabled={isProcessing(selectedRequest._id) || isRejecting}
                >
                  Decline Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reusable Profile Detail modal overlay */}
      {viewingUser && (
        <UserProfileModal user={viewingUser} onClose={() => setViewingUser(null)} />
      )}
    </div>
  );
};

export default Friends;

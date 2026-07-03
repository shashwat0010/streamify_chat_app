import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  acceptFriendRequest,
  rejectFriendRequest,
  getFriendRequests,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../lib/api";
import { Link } from "react-router";
import { BellIcon, ClockIcon, MessageSquareIcon, UserCheckIcon, ArrowUpCircleIcon, CheckSquareIcon, HeartIcon } from "lucide-react";
import Avatar from "../components/Avatar";
import toast from "react-hot-toast";

const NotificationsPage = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("activities");
  const [selectedRequest, setSelectedRequest] = useState(null);

  // Fetch Friend Requests
  const { data: friendRequests, isLoading: loadingRequests } = useQuery({
    queryKey: ["friendRequests"],
    queryFn: getFriendRequests,
  });

  // Fetch general notifications
  const { data: activityData, isLoading: loadingActivities } = useQuery({
    queryKey: ["activities"],
    queryFn: getNotifications,
  });

  // Mutations
  const acceptRequestMutation = useMutation({
    mutationFn: acceptFriendRequest,
    onSuccess: () => {
      toast.success("Friend request accepted!");
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
      queryClient.invalidateQueries({ queryKey: ["friends"] });
    },
  });

  const rejectRequestMutation = useMutation({
    mutationFn: rejectFriendRequest,
    onSuccess: () => {
      toast.success("Friend request declined");
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
    },
  });

  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      toast.success("All notifications marked as read");
      queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
  });

  const incomingRequests = friendRequests?.incomingReqs || [];
  const acceptedRequests = friendRequests?.acceptedReqs || [];
  const activities = activityData?.notifications || [];

  const unreadActivitiesCount = activities.filter((n) => !n.isRead).length;

  const renderNotificationMessage = (notif) => {
    const senderName = <span className="font-bold">{notif.sender?.fullName}</span>;
    switch (notif.type) {
      case "upvote":
        return (
          <span className="text-sm">
            {senderName} upvoted your post{" "}
            {notif.post ? <span className="font-semibold font-mono">"{notif.post.title}"</span> : "content"}.
          </span>
        );
      case "comment":
        return (
          <span className="text-sm">
            {senderName} commented on your post{" "}
            {notif.post ? <span className="font-semibold font-mono">"{notif.post.title}"</span> : ""}.
          </span>
        );
      case "reply":
        return (
          <span className="text-sm">
            {senderName} replied to your comment on post{" "}
            {notif.post ? <span className="font-semibold font-mono">"{notif.post.title}"</span> : ""}.
          </span>
        );
      default:
        return <span className="text-sm">{senderName} sent a notification.</span>;
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "upvote":
        return <ArrowUpCircleIcon className="size-5 text-primary" />;
      case "comment":
        return <MessageSquareIcon className="size-5 text-secondary" />;
      case "reply":
        return <MessageSquareIcon className="size-5 text-accent" />;
      default:
        return <BellIcon className="size-5 text-base-content/60" />;
    }
  };

  return (
    <div className="p-3 sm:p-6 lg:p-8">
      <div className="container mx-auto max-w-3xl space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-base-300 pb-3">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Notifications</h1>
          
          {activeTab === "activities" && unreadActivitiesCount > 0 && (
            <button
              onClick={() => markAllReadMutation.mutate()}
              className="btn btn-ghost btn-sm text-primary gap-1 normal-case"
              disabled={markAllReadMutation.isPending}
            >
              <CheckSquareIcon className="size-4" />
              Mark all as read
            </button>
          )}
        </div>

        {/* Tab selection */}
        <div className="tabs tabs-boxed bg-base-200 p-1 rounded-xl flex gap-1">
          <button
            onClick={() => setActiveTab("activities")}
            className={`tab flex-1 gap-2 font-bold rounded-lg ${
              activeTab === "activities" ? "tab-active bg-primary text-white" : ""
            }`}
          >
            <BellIcon className="size-4" />
            Activity Feed
            {unreadActivitiesCount > 0 && (
              <span className="badge badge-sm badge-secondary ml-1">{unreadActivitiesCount}</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("requests")}
            className={`tab flex-1 gap-2 font-bold rounded-lg ${
              activeTab === "requests" ? "tab-active bg-primary text-white" : ""
            }`}
          >
            <UserCheckIcon className="size-4" />
            Friend Requests
            {incomingRequests.length > 0 && (
              <span className="badge badge-sm badge-secondary ml-1">{incomingRequests.length}</span>
            )}
          </button>
        </div>

        {/* Loading indicators */}
        {((activeTab === "requests" && loadingRequests) || (activeTab === "activities" && loadingActivities)) ? (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-lg text-primary"></span>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Tab: Activity Feed */}
            {activeTab === "activities" && (
              activities.length === 0 ? (
                <div className="card bg-base-200 p-12 text-center text-sm opacity-60 rounded-2xl max-w-md mx-auto space-y-2">
                  <BellIcon className="size-12 text-primary opacity-50 mx-auto" />
                  <h3 className="font-bold text-lg">No activities yet</h3>
                  <p className="text-xs opacity-70">When users upvote, reply, or comment on your posts, it will show up here!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activities.map((notif) => (
                    <div
                      key={notif._id}
                      onClick={() => !notif.isRead && markReadMutation.mutate(notif._id)}
                      className={`card bg-base-200 border border-base-300 shadow-sm hover:shadow duration-200 rounded-2xl transition-all cursor-pointer ${
                        !notif.isRead ? "border-l-4 border-l-primary" : ""
                      }`}
                    >
                      <div className="card-body p-4 sm:p-5 flex flex-row items-center gap-3 sm:gap-4 justify-between">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="flex-shrink-0">
                            {getNotificationIcon(notif.type)}
                          </div>
                          
                          <div className="avatar size-10 rounded-full overflow-hidden flex-shrink-0">
                            <Avatar src={notif.sender?.profilePic} alt={notif.sender?.fullName} />
                          </div>

                          <div className="min-w-0 flex-1">
                            {notif.post ? (
                              <Link to={`/posts/${notif.post._id}`} className="hover:underline hover:text-primary transition-all text-left block">
                                {renderNotificationMessage(notif)}
                              </Link>
                            ) : (
                              <div className="text-left block">{renderNotificationMessage(notif)}</div>
                            )}
                            <span className="text-xxs opacity-60 block mt-1">
                              {new Date(notif.createdAt).toLocaleDateString(undefined, {
                                hour: "numeric",
                                minute: "numeric",
                              })}
                            </span>
                          </div>
                        </div>

                        {!notif.isRead && (
                          <div className="size-2 rounded-full bg-primary flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* Tab: Friend Requests */}
            {activeTab === "requests" && (
              incomingRequests.length === 0 && acceptedRequests.length === 0 ? (
                <div className="card bg-base-200 p-12 text-center text-sm opacity-60 rounded-2xl max-w-md mx-auto space-y-2">
                  <UserCheckIcon className="size-12 text-primary opacity-50 mx-auto" />
                  <h3 className="font-bold text-lg">No friend requests</h3>
                  <p className="text-xs opacity-70">Check back later or search for partners to send requests!</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Incoming */}
                  {incomingRequests.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="font-bold text-md text-base-content/85">Incoming Requests</h3>
                      {incomingRequests.map((request) => (
                        <div
                          key={request._id}
                          className="card bg-base-200 border border-base-300 shadow-sm rounded-2xl"
                        >
                          <div className="card-body p-4 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                            <div
                              className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer group select-none w-full sm:w-auto"
                              onClick={() => setSelectedRequest(request)}
                            >
                              <div className="avatar size-10 rounded-full overflow-hidden hover:ring hover:ring-primary/50 group-hover:ring group-hover:ring-primary/50 transition-all flex-shrink-0">
                                <Avatar src={request.sender?.profilePic} alt={request.sender?.fullName} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <h4 className="font-bold text-sm group-hover:underline group-hover:text-primary transition-all truncate">
                                  {request.sender?.fullName}
                                </h4>
                                <span className="text-xxs opacity-65 block truncate">
                                  Native: {request.sender?.nativeLanguage} • Learning: {request.sender?.learningLanguage}
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex gap-2 flex-row w-full sm:w-auto justify-end sm:justify-start">
                              <button
                                onClick={() => acceptRequestMutation.mutate(request._id)}
                                className="btn btn-primary btn-sm rounded-xl text-white px-5 flex-1 sm:flex-initial"
                                disabled={acceptRequestMutation.isPending || rejectRequestMutation.isPending}
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => rejectRequestMutation.mutate(request._id)}
                                className="btn btn-ghost btn-sm rounded-xl px-5 hover:bg-error/10 hover:text-error transition-all flex-1 sm:flex-initial"
                                disabled={acceptRequestMutation.isPending || rejectRequestMutation.isPending}
                              >
                                Decline
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Accepted */}
                  {acceptedRequests.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="font-bold text-md text-base-content/85">Recent Approvals</h3>
                      {acceptedRequests.map((request) => (
                        <div
                          key={request._id}
                          className="card bg-base-200 border border-base-300 shadow-sm opacity-80 rounded-2xl"
                        >
                          <div className="card-body p-4 flex flex-row items-center gap-3">
                            <div className="avatar size-10 rounded-full overflow-hidden">
                              <Avatar src={request.recipient?.profilePic} alt={request.recipient?.fullName} />
                            </div>
                            <div>
                              <p className="text-sm">
                                You are now friends with <span className="font-bold">{request.recipient?.fullName}</span>
                              </p>
                              <span className="text-xxs opacity-55">
                                Connection accepted recently
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        )}
      </div>

      {/* Selected Request Profile Detail Modal */}
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
                  <Avatar src={selectedRequest.sender?.profilePic} alt={selectedRequest.sender?.fullName} />
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-bold">{selectedRequest.sender?.fullName}</h3>
                <p className="text-xs opacity-70">{selectedRequest.sender?.email}</p>
              </div>

              <div className="divider my-1 w-full"></div>

              <div className="grid grid-cols-2 gap-3 w-full text-left">
                <div className="bg-base-200 p-3 rounded-2xl border border-base-300">
                  <span className="text-xxs opacity-60 block font-semibold uppercase tracking-wider">Native</span>
                  <span className="text-xs sm:text-sm font-bold text-primary mt-0.5 block truncate">{selectedRequest.sender?.nativeLanguage || "Not Specified"}</span>
                </div>
                <div className="bg-base-200 p-3 rounded-2xl border border-base-300">
                  <span className="text-xxs opacity-60 block font-semibold uppercase tracking-wider">Learning</span>
                  <span className="text-xs sm:text-sm font-bold text-secondary mt-0.5 block truncate">{selectedRequest.sender?.learningLanguage || "Not Specified"}</span>
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
                    acceptRequestMutation.mutate(selectedRequest._id);
                    setSelectedRequest(null);
                  }}
                  className="btn btn-primary flex-1 rounded-xl text-white normal-case btn-sm h-10 w-full sm:w-auto"
                  disabled={acceptRequestMutation.isPending || rejectRequestMutation.isPending}
                >
                  Accept Request
                </button>
                <button
                  onClick={() => {
                    rejectRequestMutation.mutate(selectedRequest._id);
                    setSelectedRequest(null);
                  }}
                  className="btn btn-outline btn-error flex-1 rounded-xl normal-case btn-sm h-10 w-full sm:w-auto"
                  disabled={acceptRequestMutation.isPending || rejectRequestMutation.isPending}
                >
                  Decline Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;

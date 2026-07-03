import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getFeedPosts,
  getRecommendedUsers,
  getOutgoingFriendReqs,
  sendFriendRequest,
  castVote,
  toggleBookmark,
  getUserVotes,
  getUserBookmarksMap,
  deletePost
} from "../lib/api";
import { Link } from "react-router";
import { ClockIcon, FlameIcon, StarIcon, MapPinIcon, UserPlusIcon, CheckCircleIcon, SparklesIcon } from "lucide-react";

import Avatar from "../components/Avatar";
import PostCard from "../components/PostCard";
import toast from "react-hot-toast";

const HomePage = () => {
  const queryClient = useQueryClient();
  const [sort, setSort] = useState("new");
  const [page, setPage] = useState(1);

  // Fetch feed posts
  const { data: feedData, isLoading: loadingFeed } = useQuery({
    queryKey: ["feedPosts", sort, page],
    queryFn: () => getFeedPosts(sort, page),
  });

  // Fetch user votes map
  const { data: votesData } = useQuery({
    queryKey: ["userVotes"],
    queryFn: getUserVotes,
  });

  // Fetch user bookmarks map
  const { data: bookmarksData } = useQuery({
    queryKey: ["userBookmarks"],
    queryFn: getUserBookmarksMap,
  });

  // Fetch recommended users for language learning
  const { data: recommendedUsers = [], isLoading: loadingUsers } = useQuery({
    queryKey: ["users"],
    queryFn: getRecommendedUsers,
  });

  // Fetch outgoing requests
  const { data: outgoingFriendReqs } = useQuery({
    queryKey: ["outgoingFriendReqs"],
    queryFn: getOutgoingFriendReqs,
  });

  // Mutations
  const sendRequestMutation = useMutation({
    mutationFn: sendFriendRequest,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["outgoingFriendReqs"] }),
  });

  const voteMutation = useMutation({
    mutationFn: castVote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedPosts", sort, page] });
      queryClient.invalidateQueries({ queryKey: ["userVotes"] });
    },
  });

  const bookmarkMutation = useMutation({
    mutationFn: toggleBookmark,
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["userBookmarks"] });
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: deletePost,
    onSuccess: () => {
      toast.success("Post deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["feedPosts", sort, page] });
    },
  });

  const posts = feedData?.posts || [];
  const pagination = feedData?.pagination || {};
  const userVotes = votesData?.votes || {};
  const userBookmarks = bookmarksData?.bookmarks || {};

  const outgoingRequestsIds = new Set();
  if (outgoingFriendReqs) {
    outgoingFriendReqs.forEach((req) => outgoingRequestsIds.add(req.recipient._id));
  }

  const handleVote = (postId, voteType) => {
    voteMutation.mutate({
      targetId: postId,
      targetType: "Post",
      voteType,
    });
  };

  const handleBookmark = (postId) => {
    bookmarkMutation.mutate(postId);
  };

  const handleDelete = (postId) => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      deletePostMutation.mutate(postId);
    }
  };

  const getLanguageFlag = (lang) => {
    const flags = {
      english: "🇺🇸", spanish: "🇪🇸", french: "🇫🇷", german: "🇩🇪",
      chinese: "🇨🇳", japanese: "🇯🇵", korean: "🇰🇷", italian: "🇮🇹"
    };
    return flags[lang?.toLowerCase()] || "🌐";
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Feed */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                Home Feed
              </h1>
              <p className="opacity-75 text-sm mt-1">
                Explore the latest discussions and updates from your joined communities.
              </p>
            </div>
          </div>

          {/* Sort bar */}
          <div className="flex items-center gap-2 bg-base-200 p-1.5 rounded-xl border border-base-300">
            <button
              onClick={() => { setSort("new"); setPage(1); }}
              className={`btn btn-sm rounded-lg gap-1 flex-1 sm:flex-initial ${
                sort === "new" ? "btn-primary text-white" : "btn-ghost"
              }`}
            >
              <ClockIcon className="size-4" />
              New
            </button>
            <button
              onClick={() => { setSort("hot"); setPage(1); }}
              className={`btn btn-sm rounded-lg gap-1 flex-1 sm:flex-initial ${
                sort === "hot" ? "btn-primary text-white" : "btn-ghost"
              }`}
            >
              <FlameIcon className="size-4" />
              Hot
            </button>
            <button
              onClick={() => { setSort("top"); setPage(1); }}
              className={`btn btn-sm rounded-lg gap-1 flex-1 sm:flex-initial ${
                sort === "top" ? "btn-primary text-white" : "btn-ghost"
              }`}
            >
              <StarIcon className="size-4" />
              Top
            </button>
          </div>

          {/* Posts list */}
          {loadingFeed ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-lg text-primary" />
            </div>
          ) : posts.length === 0 ? (
            <div className="card bg-base-200 border border-base-300 p-12 text-center rounded-2xl max-w-lg mx-auto space-y-4">
              <SparklesIcon className="size-12 text-primary opacity-50 mx-auto" />
              <h3 className="font-bold text-lg">Your Feed is empty</h3>
              <p className="text-sm opacity-70">
                Join some communities or search for topics to populate your feed!
              </p>
              <Link to="/communities" className="btn btn-primary btn-sm mx-auto">
                Explore Communities
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard
                  key={post._id}
                  post={post}
                  onVote={(type) => handleVote(post._id, type)}
                  onBookmark={handleBookmark}
                  onDelete={handleDelete}
                  isBookmarked={!!userBookmarks[post._id]}
                  userVote={userVotes[post._id] || 0}
                />
              ))}

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-between items-center pt-4">
                  <button
                    className="btn btn-outline btn-sm"
                    disabled={page === 1}
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  >
                    Previous
                  </button>
                  <span className="text-xs opacity-70">
                    Page {page} of {pagination.totalPages}
                  </span>
                  <button
                    className="btn btn-outline btn-sm"
                    disabled={!pagination.hasMore}
                    onClick={() => setPage((prev) => prev + 1)}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right 1 Column: Widgets */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card bg-base-200 border border-base-300 rounded-2xl">
            <div className="card-body p-5 space-y-4">
              <div>
                <h2 className="font-extrabold text-lg flex items-center gap-2">
                  <SparklesIcon className="size-5 text-primary" />
                  Meet New Learners
                </h2>
                <p className="text-xs opacity-70 mt-0.5">
                  Connect with partners matching your learning goals.
                </p>
              </div>

              {loadingUsers ? (
                <div className="flex justify-center py-6">
                  <span className="loading loading-spinner loading-md text-primary" />
                </div>
              ) : recommendedUsers.length === 0 ? (
                <p className="text-sm opacity-60 text-center py-4">No suggestions available right now.</p>
              ) : (
                <div className="space-y-4 pt-2">
                  {recommendedUsers.slice(0, 4).map((user) => {
                    const hasRequestBeenSent = outgoingRequestsIds.has(user._id);

                    return (
                      <div key={user._id} className="flex items-center gap-3 justify-between bg-base-300/30 p-2.5 rounded-xl border border-base-content/5">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="avatar size-9 rounded-full overflow-hidden flex-shrink-0">
                            <Avatar src={user.profilePic} alt={user.fullName} />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-sm truncate">{user.fullName}</h4>
                            <div className="flex items-center gap-1.5 text-xxs opacity-75 mt-0.5">
                              <span>{getLanguageFlag(user.nativeLanguage)} → {getLanguageFlag(user.learningLanguage)}</span>
                            </div>
                          </div>
                        </div>

                        <button
                          className={`btn btn-circle btn-sm ${
                            hasRequestBeenSent ? "btn-disabled text-success" : "btn-primary text-white"
                          }`}
                          onClick={() => sendRequestMutation.mutate(user._id)}
                          disabled={hasRequestBeenSent || sendRequestMutation.isPending}
                          title={hasRequestBeenSent ? "Request Sent" : "Send Friend Request"}
                        >
                          {hasRequestBeenSent ? (
                            <CheckCircleIcon className="size-4" />
                          ) : (
                            <UserPlusIcon className="size-4" />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getBookmarks, castVote, toggleBookmark, getUserVotes, getUserBookmarksMap, deletePost } from "../lib/api";
import { BookmarkIcon, ShieldAlertIcon } from "lucide-react";
import PostCard from "../components/PostCard";
import toast from "react-hot-toast";

const BookmarksPage = () => {
  const queryClient = useQueryClient();

  // Fetch bookmarks
  const { data: bookmarksData, isLoading } = useQuery({
    queryKey: ["bookmarks"],
    queryFn: getBookmarks,
  });

  // Fetch user votes map
  const { data: votesData } = useQuery({
    queryKey: ["userVotes"],
    queryFn: getUserVotes,
  });

  // Fetch user bookmarks map
  const { data: bookmarksMapData } = useQuery({
    queryKey: ["userBookmarks"],
    queryFn: getUserBookmarksMap,
  });

  const voteMutation = useMutation({
    mutationFn: castVote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
      queryClient.invalidateQueries({ queryKey: ["userVotes"] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to submit vote");
    },
  });

  const bookmarkMutation = useMutation({
    mutationFn: toggleBookmark,
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
      queryClient.invalidateQueries({ queryKey: ["userBookmarks"] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to update bookmark");
    },
  });

  const deletePostMutation = useMutation({
    pointer: deletePost,
    mutationFn: deletePost,
    onSuccess: () => {
      toast.success("Post deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to delete post");
    },
  });

  const posts = bookmarksData?.posts || [];
  const userVotes = votesData?.votes || {};
  const userBookmarks = bookmarksMapData?.bookmarks || {};

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

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-3xl space-y-6">
      <div className="flex items-center gap-3 border-b border-base-300 pb-3">
        <BookmarkIcon className="size-7 text-secondary" />
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Saved Posts</h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <span className="loading loading-spinner loading-lg text-primary" />
        </div>
      ) : posts.length === 0 ? (
        <div className="card bg-base-200 border border-base-300 p-12 text-center max-w-md mx-auto space-y-3 mt-6">
          <BookmarkIcon className="size-12 text-secondary opacity-50 mx-auto" />
          <h3 className="font-bold text-lg">No bookmarked posts</h3>
          <p className="text-sm opacity-70">
            Posts you save will appear here for quick reference in the future!
          </p>
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
              isBookmarked={true} // Since it is in saved posts
              userVote={userVotes[post._id] || 0}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default BookmarksPage;

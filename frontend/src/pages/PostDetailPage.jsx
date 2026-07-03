import { useParams, useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPostDetails, castVote, toggleBookmark, getUserVotes, getUserBookmarksMap, deletePost } from "../lib/api";
import { ArrowLeftIcon, ShieldAlertIcon } from "lucide-react";
import PostCard from "../components/PostCard";
import CommentSection from "../components/CommentSection";
import toast from "react-hot-toast";

const PostDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch post details
  const { data: postData, isLoading: loadingPost, error } = useQuery({
    queryKey: ["postDetails", id],
    queryFn: () => getPostDetails(id),
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

  const voteMutation = useMutation({
    mutationFn: castVote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["postDetails", id] });
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
      queryClient.invalidateQueries({ queryKey: ["userBookmarks"] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to update bookmark");
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: deletePost,
    onSuccess: () => {
      toast.success("Post deleted successfully");
      navigate(-1);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to delete post");
    },
  });

  if (loadingPost) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-4rem)]">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  if (error || !postData?.success) {
    return (
      <div className="container mx-auto p-8 max-w-lg text-center mt-12 space-y-4">
        <ShieldAlertIcon className="size-16 text-error mx-auto" />
        <h2 className="text-2xl font-bold">Post Not Found</h2>
        <p className="opacity-70">The post you are trying to view does not exist or has been deleted.</p>
        <button onClick={() => navigate(-1)} className="btn btn-outline btn-sm">
          Go Back
        </button>
      </div>
    );
  }

  const { post } = postData;
  const userVotes = votesData?.votes || {};
  const userBookmarks = bookmarksData?.bookmarks || {};

  const handleVote = (voteType) => {
    voteMutation.mutate({
      targetId: post._id,
      targetType: "Post",
      voteType,
    });
  };

  const handleBookmark = () => {
    bookmarkMutation.mutate(post._id);
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      deletePostMutation.mutate(post._id);
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-3xl space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="btn btn-ghost btn-sm gap-2 normal-case text-opacity-80"
      >
        <ArrowLeftIcon className="size-4" />
        Back
      </button>

      <PostCard
        post={post}
        onVote={handleVote}
        onBookmark={handleBookmark}
        onDelete={handleDelete}
        isBookmarked={!!userBookmarks[post._id]}
        userVote={userVotes[post._id] || 0}
      />

      <div className="card bg-base-200 border border-base-300 rounded-2xl shadow p-4 sm:p-6">
        <CommentSection postId={post._id} />
      </div>
    </div>
  );
};

export default PostDetailPage;

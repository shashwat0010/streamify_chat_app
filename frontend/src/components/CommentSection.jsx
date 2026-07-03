import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPostComments, createComment, castVote, getUserVotes } from "../lib/api";
import CommentNode from "./CommentNode";
import toast from "react-hot-toast";

const CommentSection = ({ postId }) => {
  const queryClient = useQueryClient();
  const [commentContent, setCommentContent] = useState("");

  // Fetch comments flat list
  const { data: commentsData, isLoading: loadingComments } = useQuery({
    queryKey: ["postComments", postId],
    queryFn: () => getPostComments(postId),
  });

  // Fetch user votes map (helps color arrows correctly)
  const { data: votesData } = useQuery({
    queryKey: ["userVotes"],
    queryFn: getUserVotes,
  });

  const userVotes = votesData?.votes || {};

  // Comment submission mutation
  const commentMutation = useMutation({
    mutationFn: createComment,
    onSuccess: () => {
      toast.success("Comment added!");
      setCommentContent("");
      queryClient.invalidateQueries({ queryKey: ["postComments", postId] });
      queryClient.invalidateQueries({ queryKey: ["postDetails", postId] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to add comment");
    },
  });

  // Comment vote mutation
  const voteMutation = useMutation({
    mutationFn: castVote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["postComments", postId] });
      queryClient.invalidateQueries({ queryKey: ["userVotes"] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to submit vote");
    },
  });

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!commentContent.trim()) return;

    commentMutation.mutate({
      content: commentContent,
      postId,
    });
  };

  const handleCommentVote = (commentId, type) => {
    voteMutation.mutate({
      targetId: commentId,
      targetType: "Comment",
      voteType: type,
    });
  };

  const buildCommentTree = (flatComments) => {
    const commentMap = {};
    const rootComments = [];

    flatComments.forEach((c) => {
      commentMap[c._id] = { ...c, replies: [] };
    });

    flatComments.forEach((c) => {
      const mappedComment = commentMap[c._id];
      if (c.parentComment) {
        const parent = commentMap[c.parentComment];
        if (parent) {
          parent.replies.push(mappedComment);
        } else {
          // Fallback if parent is missing
          rootComments.push(mappedComment);
        }
      } else {
        rootComments.push(mappedComment);
      }
    });

    return rootComments;
  };

  const flatCommentsList = commentsData?.comments || [];
  const commentTree = buildCommentTree(flatCommentsList);

  return (
    <div className="space-y-6">
      <h3 className="font-bold text-lg border-b border-base-300 pb-2">
        Comments ({flatCommentsList.length})
      </h3>

      {/* Write Root Comment Form */}
      <form onSubmit={handleCommentSubmit} className="space-y-3">
        <textarea
          placeholder="What are your thoughts on this?"
          value={commentContent}
          onChange={(e) => setCommentContent(e.target.value)}
          className="textarea textarea-bordered w-full h-24 rounded-xl text-sm"
          required
        />
        <div className="flex justify-end">
          <button
            type="submit"
            className="btn btn-primary btn-sm rounded-xl px-5"
            disabled={commentMutation.isPending || !commentContent.trim()}
          >
            {commentMutation.isPending ? "Posting..." : "Comment"}
          </button>
        </div>
      </form>

      {/* Render comment tree list */}
      {loadingComments ? (
        <div className="flex justify-center py-6">
          <span className="loading loading-spinner loading-md text-primary" />
        </div>
      ) : commentTree.length === 0 ? (
        <div className="text-center py-8 opacity-60 text-sm">
          No comments yet. Share your thoughts!
        </div>
      ) : (
        <div className="space-y-6">
          {commentTree.map((comment) => (
            <CommentNode
              key={comment._id}
              comment={comment}
              userVote={userVotes[comment._id] || 0}
              onVote={handleCommentVote}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentSection;

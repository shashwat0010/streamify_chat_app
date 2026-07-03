import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createComment, castVote } from "../lib/api";
import { ArrowBigUp, ArrowBigDown, Reply, CornerDownRight } from "lucide-react";
import Avatar from "./Avatar";
import UserProfileModal from "./UserProfileModal";
import toast from "react-hot-toast";

const CommentNode = ({ comment, userVote = 0, onVote }) => {
  const queryClient = useQueryClient();
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [viewingUser, setViewingUser] = useState(null);

  const replyMutation = useMutation({
    mutationFn: createComment,
    onSuccess: () => {
      toast.success("Reply added!");
      setReplyContent("");
      setIsReplying(false);
      queryClient.invalidateQueries({ queryKey: ["postComments", comment.post] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to add reply");
    },
  });

  const handleReplySubmit = (e) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    replyMutation.mutate({
      content: replyContent,
      postId: comment.post,
      parentCommentId: comment._id,
    });
  };

  return (
    <div className="space-y-3">
      {/* Comment Row */}
      <div className="flex gap-3 items-start bg-base-300/20 p-3 rounded-xl border border-base-content/5">
        <div 
          className="avatar size-8 rounded-full overflow-hidden mt-0.5 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => setViewingUser(comment.author)}
        >
          <Avatar src={comment.author?.profilePic} alt={comment.author?.fullName} />
        </div>

        <div className="flex-1 space-y-1.5 min-w-0">
          <div className="flex items-center gap-2 text-xs opacity-75">
            <button
              onClick={() => setViewingUser(comment.author)}
              className="font-bold text-base-content hover:underline hover:text-primary transition-all cursor-pointer focus:outline-none"
            >
              {comment.author?.fullName}
            </button>
            <span>•</span>
            <span>
              {new Date(comment.createdAt).toLocaleDateString(undefined, {
                hour: "numeric",
                minute: "numeric",
              })}
            </span>
          </div>

          <p className="text-sm leading-relaxed text-base-content opacity-95 whitespace-pre-wrap break-words">
            {comment.content}
          </p>

          {/* Comment Footer Controls */}
          <div className="flex items-center gap-4 text-xs pt-1.5 border-t border-base-content/5 mt-2">
            {/* Comment Upvotes */}
            <div className="flex items-center gap-1 bg-base-300/40 px-2 py-0.5 rounded-lg border border-base-content/5">
              <button
                className={`btn btn-ghost btn-xs btn-circle ${
                  userVote === 1 ? "text-primary hover:text-primary" : "hover:text-primary"
                }`}
                onClick={() => onVote?.(comment._id, 1)}
              >
                <ArrowBigUp className="size-4 fill-current" />
              </button>
              <span className="font-bold font-mono text-xxs">
                {comment.upvotesCount - comment.downvotesCount}
              </span>
              <button
                className={`btn btn-ghost btn-xs btn-circle ${
                  userVote === -1 ? "text-error hover:text-error" : "hover:text-error"
                }`}
                onClick={() => onVote?.(comment._id, -1)}
              >
                <ArrowBigDown className="size-4 fill-current" />
              </button>
            </div>

            {/* Reply trigger button */}
            <button
              className="flex items-center gap-1 hover:text-primary font-semibold transition-colors p-1 rounded"
              onClick={() => setIsReplying(!isReplying)}
            >
              <Reply className="size-3.5" />
              <span>Reply</span>
            </button>
          </div>
        </div>
      </div>

      {/* Reply Form */}
      {isReplying && (
        <form onSubmit={handleReplySubmit} className="flex gap-2 items-end ml-6 sm:ml-8">
          <CornerDownRight className="size-5 opacity-40 mb-3" />
          <div className="flex-1 space-y-2">
            <textarea
              placeholder={`Replying to ${comment.author?.fullName}...`}
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              className="textarea textarea-bordered w-full h-16 rounded-xl text-xs"
              required
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="btn btn-ghost btn-xs rounded-lg"
                onClick={() => setIsReplying(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-xs rounded-lg"
                disabled={replyMutation.isPending || !replyContent.trim()}
              >
                {replyMutation.isPending ? "Posting..." : "Reply"}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Children replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-6 sm:ml-8 pl-3 sm:pl-4 border-l-2 border-base-300 space-y-4">
          {comment.replies.map((child) => (
            <CommentNode
              key={child._id}
              comment={child}
              userVote={userVote}
              onVote={onVote}
            />
          ))}
        </div>
      )}

      {viewingUser && (
        <UserProfileModal user={viewingUser} onClose={() => setViewingUser(null)} />
      )}
    </div>
  );
};

export default CommentNode;

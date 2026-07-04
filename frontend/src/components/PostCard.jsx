import { useState, useEffect } from "react";
import { Link } from "react-router";
import { formatDistanceToNow } from "date-fns";
import { ArrowBigUp, ArrowBigDown, MessageSquare, Trash2, Bookmark } from "lucide-react";
import useAuthUser from "../hooks/useAuthUser";
import Avatar from "./Avatar";
import UserProfileModal from "./UserProfileModal";

const PostCard = ({ post, onVote, onBookmark, onDelete, isBookmarked = false, userVote = 0 }) => {
  const { authUser } = useAuthUser();
  const [localVote, setLocalVote] = useState(userVote);
  const [localScore, setLocalScore] = useState(post.upvotesCount - post.downvotesCount);
  const [showHeartPop, setShowHeartPop] = useState(false);

  const [isExpanded, setIsExpanded] = useState(false);
  const [viewingUser, setViewingUser] = useState(null);
  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });

  const isAuthor = post.author?._id === authUser?._id;

  const shouldTruncate = post.content && post.content.length > 220;
  const displayContent = shouldTruncate && !isExpanded 
    ? `${post.content.slice(0, 200)}...` 
    : post.content;

  // Keep local state in sync with server changes
  useEffect(() => {
    setLocalVote(userVote);
    setLocalScore(post.upvotesCount - post.downvotesCount);
  }, [userVote, post.upvotesCount, post.downvotesCount]);

  const handleVoteClick = (type) => {
    let newVote = 0;
    if (localVote === type) {
      newVote = 0; // Toggle off
    } else {
      newVote = type;
    }

    const diff = newVote - localVote;
    setLocalScore((prev) => prev + diff);
    setLocalVote(newVote);

    // Run backend request in background
    onVote?.(newVote);
  };

  const handleDoubleTap = (e) => {
    // Avoid triggering if user double-clicks interactive elements like links, buttons, or video player controls
    if (e.target.closest("a") || e.target.closest("button") || e.target.closest("video")) {
      return;
    }

    if (localVote !== 1) {
      const diff = 1 - localVote;
      setLocalScore((prev) => prev + diff);
      setLocalVote(1);
      onVote?.(1);
    }

    // Trigger instant Instagram-style feedback animation
    setShowHeartPop(true);
    setTimeout(() => {
      setShowHeartPop(false);
    }, 700);
  };

  const renderContentWithLinks = (text) => {
    if (!text) return null;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    return parts.map((part, index) => {
      if (urlRegex.test(part)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="link link-primary font-bold inline-block break-all"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  return (
    <div className="card bg-base-200 border border-base-300 hover:shadow-lg transition-all duration-200 rounded-2xl overflow-hidden relative">
      {/* Instagram-style Upvote Pop-up Feedback */}
      {showHeartPop && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-40 bg-black/5 animate-fade-in backdrop-blur-[0.5px]">
          <div className="animate-ping absolute size-32 rounded-full bg-primary/10" />
          <div className="animate-bounce scale-125 flex flex-col items-center duration-300">
            <ArrowBigUp className="size-20 text-primary fill-primary drop-shadow-[0_10px_20px_rgba(var(--p),0.5)]" />
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary bg-base-100/90 border border-primary/20 shadow-xl px-2.5 py-1 rounded-full mt-1.5">
              Upvoted!
            </span>
          </div>
        </div>
      )}

      <div className="card-body p-4 sm:p-5 flex flex-row gap-3 sm:gap-4 items-start" onDoubleClick={handleDoubleTap}>
        {/* Left Side: Vote Column */}
        <div className="flex flex-col items-center gap-1 mt-1 bg-base-300/40 p-1.5 rounded-xl border border-base-content/5 z-10" onClick={(e) => e.stopPropagation()}>
          <button
            className={`btn btn-ghost btn-xs btn-circle ${
              localVote === 1 ? "text-primary hover:text-primary animate-pulse" : "hover:text-primary"
            }`}
            onClick={() => handleVoteClick(1)}
          >
            <ArrowBigUp className="size-5 fill-current" />
          </button>
          <span className="text-xs font-bold font-mono">
            {localScore}
          </span>
          <button
            className={`btn btn-ghost btn-xs btn-circle ${
              localVote === -1 ? "text-error hover:text-error animate-pulse" : "hover:text-error"
            }`}
            onClick={() => handleVoteClick(-1)}
          >
            <ArrowBigDown className="size-5 fill-current" />
          </button>
        </div>

        {/* Right Side: Main Content */}
        <div className="flex-1 space-y-3 min-w-0">
          {/* Header metadata */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5 text-xs opacity-75">
              <Link
                to={`/c/${post.community?.name}`}
                className="font-bold text-base-content hover:underline hover:text-primary truncate"
              >
                c/{post.community?.name}
              </Link>
              <span>•</span>
              <span className="flex items-center gap-1">
                Posted by{" "}
                <button
                  onClick={() => setViewingUser(post.author)}
                  className="font-semibold hover:underline hover:text-primary transition-all cursor-pointer focus:outline-none"
                >
                  {post.author?.fullName}
                </button>
              </span>
              <span>•</span>
              <span>{timeAgo}</span>
            </div>

            {isAuthor && onDelete && (
              <button
                className="btn btn-ghost btn-xs btn-circle text-error"
                onClick={() => onDelete(post._id)}
              >
                <Trash2 className="size-4" />
              </button>
            )}
          </div>

          {/* Title and Content */}
          <div className="space-y-1.5">
            <Link
              to={`/posts/${post._id}`}
              className="text-lg font-bold hover:underline block leading-tight truncate hover:text-primary/90 transition-all"
            >
              {post.title}
            </Link>
            {post.content && (
              <p className="text-sm text-base-content/95 font-medium leading-relaxed whitespace-pre-wrap break-words">
                {renderContentWithLinks(displayContent)}
                {shouldTruncate && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setIsExpanded(!isExpanded);
                    }}
                    className="text-xs text-primary font-bold ml-1 hover:underline cursor-pointer focus:outline-none"
                  >
                    {isExpanded ? "Show Less" : "Show More"}
                  </button>
                )}
              </p>
            )}
          </div>

          {/* Media attachment */}
          {post.media && post.media.length > 0 && (
            <div className="rounded-xl overflow-hidden border border-base-content/5 max-h-[450px] bg-base-300 flex items-center justify-center">
              {post.media[0].type === "video" ? (
                <video
                  src={post.media[0].url}
                  controls
                  className="max-h-[450px] w-full object-contain"
                />
              ) : (
                <img
                  src={post.media[0].url}
                  alt={post.title}
                  className="max-h-[450px] w-full object-contain hover:scale-[1.01] transition-transform duration-300"
                />
              )}
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center gap-4 text-xs font-semibold opacity-80 pt-2 border-t border-base-content/5">
            <Link to={`/posts/${post._id}`} className="flex items-center gap-1.5 hover:text-primary cursor-pointer transition-colors p-1 rounded">
              <MessageSquare className="size-4" />
              <span>{post.commentsCount} Comments</span>
            </Link>

            <button
              className={`flex items-center gap-1.5 hover:text-secondary transition-colors p-1 rounded ${
                isBookmarked ? "text-secondary" : ""
              }`}
              onClick={() => onBookmark?.(post._id)}
            >
              <Bookmark className={`size-4 ${isBookmarked ? "fill-current" : ""}`} />
              <span>{isBookmarked ? "Saved" : "Save"}</span>
            </button>
          </div>
        </div>
      </div>

      {viewingUser && (
        <UserProfileModal user={viewingUser} onClose={() => setViewingUser(null)} />
      )}
    </div>
  );
};

export default PostCard;

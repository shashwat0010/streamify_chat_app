import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../lib/axios";
import { getJoinedCommunities } from "../lib/api";
import { useCreatePostModalStore } from "../store/useCreatePostModalStore";
import { ImageIcon, VideoIcon, XIcon, PenSquareIcon } from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router";

const CreatePostModal = () => {
  const { isOpen, closeModal } = useCreatePostModalStore();
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const [communityId, setCommunityId] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaType, setMediaType] = useState(""); // 'image' or 'video'
  const [isUploading, setIsUploading] = useState(false);

  // Get user's joined communities
  const { data: joinedData, isLoading: loadingCommunities } = useQuery({
    queryKey: ["joinedCommunities"],
    queryFn: getJoinedCommunities,
    enabled: isOpen,
  });

  const joinedCommunities = joinedData?.communities || [];

  // Automatically select the first community if list changes
  useEffect(() => {
    if (joinedCommunities.length > 0 && !communityId) {
      setCommunityId(joinedCommunities[0]._id);
    }
  }, [joinedCommunities, communityId]);

  const createPostMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await axiosInstance.post("/posts", payload);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Post created successfully!");
      setTitle("");
      setContent("");
      setMediaFile(null);
      setMediaPreview(null);
      setMediaType("");
      setCommunityId("");
      closeModal();
      queryClient.invalidateQueries({ queryKey: ["feedPosts"] });
      // If we are currently on a community detail page, invalidate that specific community posts too
      queryClient.invalidateQueries({ queryKey: ["communityPosts"] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to create post");
    },
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      return toast.error("File size exceeds 50MB limit");
    }

    const type = file.type.startsWith("video/") ? "video" : "image";
    setMediaFile(file);
    setMediaType(type);

    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!communityId) return toast.error("Please select a community");
    if (!title.trim()) return toast.error("Post title is required");

    try {
      setIsUploading(true);

      let finalMediaUrl = "";
      let finalMediaType = "";

      if (mediaFile) {
        // 1. Get pre-signed upload URL from backend
        const urlRes = await axiosInstance.get(
          `/posts/upload-url?fileName=${encodeURIComponent(mediaFile.name)}&fileType=${encodeURIComponent(mediaFile.type)}`
        );
        const { uploadUrl, fileUrl } = urlRes.data;

        // 2. Upload file directly to S3
        const uploadRes = await fetch(uploadUrl, {
          method: "PUT",
          body: mediaFile,
          headers: {
            "Content-Type": mediaFile.type,
          },
        });

        if (!uploadRes.ok) throw new Error("Failed to upload file to S3");

        finalMediaUrl = fileUrl;
        finalMediaType = mediaType;
      }

      // 3. Create post payload
      const payload = {
        title,
        content,
        communityId,
      };

      if (finalMediaUrl) {
        payload.mediaUrl = finalMediaUrl;
        payload.mediaType = finalMediaType;
      }

      await createPostMutation.mutateAsync(payload);
    } catch (error) {
      console.error("Post Error:", error);
      toast.error(error.response?.data?.message || error.message || "An error occurred while creating post");
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open z-50">
      <div className="modal-box rounded-2xl max-w-lg bg-base-100 border border-base-300 shadow-2xl relative p-6">
        {/* Close Button */}
        <button
          type="button"
          onClick={closeModal}
          className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4"
          disabled={isUploading || createPostMutation.isPending}
        >
          <XIcon className="size-5" />
        </button>

        <h3 className="font-bold text-lg flex items-center gap-2 mb-5">
          <PenSquareIcon className="size-5 text-primary" />
          Create a New Post
        </h3>

        {loadingCommunities ? (
          <div className="flex justify-center py-6">
            <span className="loading loading-spinner loading-md text-primary" />
          </div>
        ) : joinedCommunities.length === 0 ? (
          <div className="text-center py-6 space-y-4">
            <p className="text-base-content opacity-75 text-sm">
              You haven't joined any communities yet. You need to join a community first to make a post!
            </p>
            <button
              onClick={() => {
                closeModal();
                navigate("/communities");
              }}
              className="btn btn-primary btn-sm rounded-xl px-5 normal-case"
            >
              Explore Communities
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Community Dropdown Select */}
            <div className="form-control w-full">
              <label className="label py-1">
                <span className="label-text font-semibold text-xs opacity-75">Choose Community</span>
              </label>
              <select
                className="select select-bordered w-full rounded-xl text-sm"
                value={communityId}
                onChange={(e) => setCommunityId(e.target.value)}
                required
                disabled={isUploading || createPostMutation.isPending}
              >
                {joinedCommunities.map((community) => (
                  <option key={community._id} value={community._id}>
                    c/{community.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Title Input */}
            <div className="form-control w-full">
              <input
                type="text"
                placeholder="An interesting title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input input-bordered w-full rounded-xl text-sm font-semibold"
                required
                disabled={isUploading || createPostMutation.isPending}
              />
            </div>

            {/* Content Textarea */}
            <div className="form-control w-full">
              <textarea
                placeholder="Text (optional)"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="textarea textarea-bordered w-full h-28 rounded-xl text-sm"
                disabled={isUploading || createPostMutation.isPending}
              />
            </div>

            {/* Media Preview */}
            {mediaPreview && (
              <div className="relative border border-base-content/10 rounded-xl overflow-hidden max-h-60 bg-black/5 flex items-center justify-center">
                {mediaType === "image" ? (
                  <img src={mediaPreview} alt="Preview" className="max-h-60 object-contain w-full" />
                ) : (
                  <video src={mediaPreview} controls className="max-h-60 w-full" />
                )}
                <button
                  type="button"
                  onClick={removeMedia}
                  className="btn btn-circle btn-xs btn-error absolute top-2 right-2 border-0 bg-opacity-80"
                >
                  <XIcon className="size-3 text-white" />
                </button>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-base-content/5">
              <div className="flex gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*,video/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn btn-ghost btn-sm btn-circle"
                  disabled={isUploading || createPostMutation.isPending}
                  title="Add Image or Video"
                >
                  {mediaType === "video" ? (
                    <VideoIcon className="size-5 text-secondary" />
                  ) : (
                    <ImageIcon className="size-5 text-primary" />
                  )}
                </button>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn btn-ghost btn-sm rounded-xl px-4"
                  disabled={isUploading || createPostMutation.isPending}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm rounded-xl px-5"
                  disabled={isUploading || createPostMutation.isPending || !title.trim()}
                >
                  {isUploading || createPostMutation.isPending ? (
                    <>
                      <span className="loading loading-spinner loading-xs" />
                      Posting...
                    </>
                  ) : (
                    "Post"
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CreatePostModal;

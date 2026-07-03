import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../lib/axios";
import { ImageIcon, VideoIcon, XIcon } from "lucide-react";
import toast from "react-hot-toast";

const CreatePostForm = ({ communityId, communityName }) => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaType, setMediaType] = useState(""); // 'image' or 'video'
  const [isUploading, setIsUploading] = useState(false);

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
      queryClient.invalidateQueries({ queryKey: ["communityPosts", communityName] });
      queryClient.invalidateQueries({ queryKey: ["feedPosts"] });
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
    if (!title.trim()) return toast.error("Post title is required");

    try {
      setIsUploading(true);

      let finalMediaUrl = "";
      let finalMediaType = "";

      if (mediaFile) {
        // 1. Get pre-signed upload URL from backend
        const urlRes = await axiosInstance.get(`/posts/upload-url?fileName=${encodeURIComponent(mediaFile.name)}&fileType=${encodeURIComponent(mediaFile.type)}`);
        const { uploadUrl, fileUrl } = urlRes.data;

        // 2. Upload file directly to S3
        const uploadRes = await fetch(uploadUrl, {
          method: "PUT",
          body: mediaFile,
          headers: {
            "Content-Type": mediaFile.type,
          },
        });

        if (!uploadRes.ok) throw new Error("Failed to upload image to S3");

        finalMediaUrl = fileUrl;
        finalMediaType = mediaType;
      }

      // 3. Create post with JSON payload
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

  return (
    <div className="card bg-base-200 border border-base-300 rounded-2xl shadow">
      <div className="card-body p-4 sm:p-5">
        <h3 className="font-bold text-md mb-3">Create Post</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="An interesting title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input input-bordered w-full rounded-xl text-sm"
            required
            disabled={isUploading || createPostMutation.isPending}
          />

          <textarea
            placeholder="Text (optional)"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="textarea textarea-bordered w-full h-24 rounded-xl text-sm"
            disabled={isUploading || createPostMutation.isPending}
          />

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
          <div className="flex items-center justify-between pt-2 border-t border-base-content/5">
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
        </form>
      </div>
    </div>
  );
};

export default CreatePostForm;

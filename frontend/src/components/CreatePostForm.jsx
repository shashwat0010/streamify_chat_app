import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getUploadUrl, uploadFileToUrl, createPost } from "../lib/api";
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
    mutationFn: createPost,
    onSuccess: () => {
      toast.success("Post created successfully!");
      setTitle("");
      setContent("");
      setMediaFile(null);
      setMediaPreview(null);
      setMediaType("");
      queryClient.invalidateQueries({ queryKey: ["communityPosts", communityName] });
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

    let mediaData = [];

    try {
      setIsUploading(true);

      if (mediaFile) {
        // Step 1: Get pre-signed URL (or local mock url)
        const { uploadUrl, fileUrl } = await getUploadUrl(mediaFile.name, mediaFile.type);

        // Step 2: Upload directly to S3 / local server
        await uploadFileToUrl(uploadUrl, mediaFile, mediaFile.type);

        mediaData = [
          {
            url: fileUrl,
            type: mediaType,
          },
        ];
      }

      // Step 3: Create the post document in DB
      await createPostMutation.mutateAsync({
        title,
        content,
        media: mediaData,
        communityId,
      });
    } catch (error) {
      console.error("Upload/Post Error:", error);
      toast.error(error.message || "An error occurred while creating post");
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
              {isUploading ? (
                <>
                  <span className="loading loading-spinner loading-xs" />
                  Uploading...
                </>
              ) : createPostMutation.isPending ? (
                "Posting..."
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

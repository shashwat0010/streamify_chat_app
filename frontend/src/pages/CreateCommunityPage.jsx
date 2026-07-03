import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { createCommunity, getUploadUrl, uploadFileToUrl } from "../lib/api";
import { ArrowLeftIcon, GlobeIcon, LockIcon, ImageIcon } from "lucide-react";
import toast from "react-hot-toast";

const CreateCommunityPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("public");

  // Visual Assets State
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const createMutation = useMutation({
    mutationFn: createCommunity,
    onSuccess: (data) => {
      toast.success("Community created successfully!");
      queryClient.invalidateQueries({ queryKey: ["joinedCommunities"] });
      queryClient.invalidateQueries({ queryKey: ["exploreCommunities"] });
      navigate(`/c/${data.community.name}`);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to create community");
      setIsUploading(false);
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Community name is required");
    if (!description.trim()) return toast.error("Community description is required");

    setIsUploading(true);
    let avatarUrl = "";
    let bannerUrl = "";

    try {
      // 1. Upload Avatar if selected
      if (avatarFile) {
        const { uploadUrl, fileUrl } = await getUploadUrl(avatarFile.name, avatarFile.type);
        await uploadFileToUrl(uploadUrl, avatarFile, avatarFile.type);
        avatarUrl = fileUrl;
      }
      
      // 2. Upload Banner if selected
      if (bannerFile) {
        const { uploadUrl, fileUrl } = await getUploadUrl(bannerFile.name, bannerFile.type);
        await uploadFileToUrl(uploadUrl, bannerFile, bannerFile.type);
        bannerUrl = fileUrl;
      }

      createMutation.mutate({
        name,
        description,
        type,
        avatar: avatarUrl || undefined,
        banner: bannerUrl || undefined,
      });
    } catch (err) {
      toast.error("Failed to upload visuals: " + err.message);
      setIsUploading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-xl">
      <button
        onClick={() => navigate(-1)}
        className="btn btn-ghost btn-sm gap-2 mb-6 normal-case text-opacity-80"
      >
        <ArrowLeftIcon className="size-4" />
        Back
      </button>

      <div className="card bg-base-200 border border-base-300 shadow-xl">
        <div className="card-body p-6 sm:p-8">
          <h2 className="card-title text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
            Create a Community
          </h2>
          <p className="text-xs opacity-75 mt-1 mb-6">
            Establish a space for discussions, updates, and learning topics.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Community Name */}
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-semibold">Community Name</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-opacity-50 text-sm font-mono select-none">
                  c/
                </span>
                <input
                  type="text"
                  placeholder="language-learners"
                  value={name}
                  onChange={(e) => setName(e.target.value.replace(/\s+/g, "-").toLowerCase())}
                  className="input input-bordered w-full pl-8 rounded-xl font-mono text-sm"
                  maxLength={50}
                  required
                />
              </div>
              <label className="label">
                <span className="label-text-alt opacity-70">
                  Must be unique, lowercase, no spaces. E.g. "spanish-exchange"
                </span>
              </label>
            </div>

            {/* Description */}
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-semibold">Description</span>
              </label>
              <textarea
                placeholder="A place for language learners to discuss, share tips, resources, and practice vocabulary."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="textarea textarea-bordered w-full h-28 rounded-xl text-sm"
                maxLength={500}
                required
              />
              <label className="label">
                <span className="label-text-alt opacity-70">
                  Explain the purpose of your community ({description.length}/500)
                </span>
              </label>
            </div>

            {/* Visuals Upload */}
            <div className="space-y-4">
              <label className="label">
                <span className="label-text font-semibold">Community Visuals</span>
              </label>
              
              <div className="flex flex-col gap-4">
                {/* Banner Input */}
                <div className="relative h-32 w-full rounded-2xl overflow-hidden bg-base-300 border border-base-content/10 group cursor-pointer shadow-inner">
                  {bannerPreview ? (
                    <img src={bannerPreview} alt="Cover Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-xs opacity-60 space-y-1">
                      <ImageIcon className="size-6 text-primary opacity-80" />
                      <span className="font-bold text-sm">Upload Cover Image</span>
                      <span>Recommended: 1200x400 px</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setBannerFile(file);
                        const reader = new FileReader();
                        reader.onloadend = () => setBannerPreview(reader.result);
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  {bannerPreview && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">
                      Change Cover
                    </div>
                  )}
                </div>

                {/* Avatar Input */}
                <div className="flex items-center gap-4">
                  <div className="relative size-16 rounded-full overflow-hidden bg-base-300 border border-base-content/10 group cursor-pointer flex-shrink-0 shadow-inner flex items-center justify-center">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Logo Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] font-extrabold opacity-60 text-center p-1 leading-none uppercase">
                        Upload Logo
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setAvatarFile(file);
                          const reader = new FileReader();
                          reader.onloadend = () => setAvatarPreview(reader.result);
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    {avatarPreview && (
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
                        Change
                      </div>
                    )}
                  </div>
                  <div className="text-xs opacity-70">
                    <span className="font-bold block text-sm mb-0.5">Community Logo</span>
                    Customize the small logo displayed on feed items and search list results.
                  </div>
                </div>
              </div>
            </div>

            {/* Privacy Type */}
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-semibold">Community Type</span>
              </label>

              <div className="flex flex-col gap-3">
                <label className="flex items-center gap-3 p-3 rounded-xl bg-base-300 border border-base-content/10 cursor-pointer hover:bg-base-content/5 transition-all">
                  <input
                    type="radio"
                    name="type"
                    value="public"
                    checked={type === "public"}
                    onChange={() => setType("public")}
                    className="radio radio-primary"
                  />
                  <GlobeIcon className="size-5 text-primary" />
                  <div className="flex-1 text-sm">
                    <span className="font-bold block">Public</span>
                    <span className="text-xs opacity-70">Anyone can view, join, and post to this community.</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl bg-base-300 border border-base-content/10 cursor-pointer hover:bg-base-content/5 transition-all">
                  <input
                    type="radio"
                    name="type"
                    value="private"
                    checked={type === "private"}
                    onChange={() => setType("private")}
                    className="radio radio-primary"
                  />
                  <LockIcon className="size-5 text-secondary" />
                  <div className="flex-1 text-sm">
                    <span className="font-bold block">Private</span>
                    <span className="text-xs opacity-70">Only members can view discussions and make new posts.</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="card-actions justify-end mt-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="btn btn-outline rounded-xl"
                disabled={createMutation.isPending || isUploading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary rounded-xl"
                disabled={createMutation.isPending || isUploading}
              >
                {(createMutation.isPending || isUploading) && (
                  <span className="loading loading-spinner loading-xs" />
                )}
                {isUploading ? "Uploading..." : createMutation.isPending ? "Creating..." : "Create Space"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateCommunityPage;

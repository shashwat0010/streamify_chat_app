import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCommunity,
  joinCommunity,
  leaveCommunity,
  getCommunityPosts,
  deletePost,
  updateCommunity,
  getUploadUrl,
  uploadFileToUrl,
  deleteCommunity,
  getCommunityMembers,
  kickCommunityMember,
  updateMemberRole,
} from "../lib/api";
import {
  GlobeIcon,
  LockIcon,
  ShieldAlertIcon,
  UserMinusIcon,
  UserPlusIcon,
  UsersIcon,
  FlameIcon,
  StarIcon,
  ClockIcon,
  SettingsIcon,
  ImageIcon,
  Trash2,
} from "lucide-react";
import CreatePostForm from "../components/CreatePostForm";
import PostCard from "../components/PostCard";
import toast from "react-hot-toast";

const CommunityDetailPage = () => {
  const { communityName } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [sort, setSort] = useState("new");
  const [page, setPage] = useState(1);

  // Visual Assets Edit States
  const [isEditingVisuals, setIsEditingVisuals] = useState(false);
  const [newAvatarFile, setNewAvatarFile] = useState(null);
  const [newAvatarPreview, setNewAvatarPreview] = useState(null);
  const [newBannerFile, setNewBannerFile] = useState(null);
  const [newBannerPreview, setNewBannerPreview] = useState(null);
  const [isUpdatingVisuals, setIsUpdatingVisuals] = useState(false);

  // Members Management Modal States
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);

  // Fetch community metadata
  const { data: communityData, isLoading: loadingCommunity, error: communityError } = useQuery({
    queryKey: ["community", communityName],
    queryFn: () => getCommunity(communityName),
  });

  const community = communityData?.community;
  const userRole = communityData?.userRole;

  // Fetch community members
  const { data: membersData, isLoading: loadingMembers, refetch: refetchMembers } = useQuery({
    queryKey: ["communityMembers", community?._id],
    queryFn: () => getCommunityMembers(community._id),
    enabled: isMembersModalOpen && !!community?._id,
  });

  // Fetch community posts
  const { data: postsData, isLoading: loadingPosts } = useQuery({
    queryKey: ["communityPosts", communityName, sort, page],
    queryFn: () => getCommunityPosts(communityName, sort, page),
    enabled: !!communityData?.success,
  });

  const joinMutation = useMutation({
    mutationFn: joinCommunity,
    onSuccess: () => {
      toast.success("Joined community!");
      queryClient.invalidateQueries({ queryKey: ["community", communityName] });
      queryClient.invalidateQueries({ queryKey: ["joinedCommunities"] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to join");
    },
  });

  const leaveMutation = useMutation({
    mutationFn: leaveCommunity,
    onSuccess: () => {
      toast.success("Left community!");
      queryClient.invalidateQueries({ queryKey: ["community", communityName] });
      queryClient.invalidateQueries({ queryKey: ["joinedCommunities"] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to leave");
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: deletePost,
    onSuccess: () => {
      toast.success("Post deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["communityPosts", communityName] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to delete post");
    },
  });

  const deleteCommunityMutation = useMutation({
    mutationFn: () => deleteCommunity(community._id),
    onSuccess: () => {
      toast.success("Community deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["joinedCommunities"] });
      queryClient.invalidateQueries({ queryKey: ["exploreCommunities"] });
      navigate("/");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to delete community");
    },
  });

  const kickMemberMutation = useMutation({
    mutationFn: (targetUserId) => kickCommunityMember(community._id, targetUserId),
    onSuccess: () => {
      toast.success("Member removed from community");
      queryClient.invalidateQueries({ queryKey: ["community", communityName] });
      refetchMembers();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to remove member");
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ targetUserId, role }) => updateMemberRole(community._id, targetUserId, role),
    onSuccess: () => {
      toast.success("Member role updated");
      refetchMembers();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to update role");
    },
  });

  const updateVisualsMutation = useMutation({
    mutationFn: (data) => updateCommunity(community._id, data),
    onSuccess: () => {
      toast.success("Community visuals updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["community", communityName] });
      setIsEditingVisuals(false);
      setNewAvatarFile(null);
      setNewAvatarPreview(null);
      setNewBannerFile(null);
      setNewBannerPreview(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to update community visuals");
    },
    onSettled: () => {
      setIsUpdatingVisuals(false);
    },
  });

  const handleUpdateVisualsSubmit = async (e) => {
    e.preventDefault();
    if (!newAvatarFile && !newBannerFile) {
      return toast.error("Please select a new logo or cover image first");
    }

    setIsUpdatingVisuals(true);
    let avatarUrl = undefined;
    let bannerUrl = undefined;

    try {
      if (newAvatarFile) {
        const { uploadUrl, fileUrl } = await getUploadUrl(newAvatarFile.name, newAvatarFile.type);
        await uploadFileToUrl(uploadUrl, newAvatarFile, newAvatarFile.type);
        avatarUrl = fileUrl;
      }
      if (newBannerFile) {
        const { uploadUrl, fileUrl } = await getUploadUrl(newBannerFile.name, newBannerFile.type);
        await uploadFileToUrl(uploadUrl, newBannerFile, newBannerFile.type);
        bannerUrl = fileUrl;
      }

      const payload = {};
      if (avatarUrl) payload.avatar = avatarUrl;
      if (bannerUrl) payload.banner = bannerUrl;

      updateVisualsMutation.mutate(payload);
    } catch (err) {
      toast.error("Failed to upload visuals: " + err.message);
      setIsUpdatingVisuals(false);
    }
  };

  if (loadingCommunity) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-4rem)]">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  if (communityError || !communityData?.success) {
    return (
      <div className="container mx-auto p-8 max-w-lg text-center mt-12 space-y-4">
        <ShieldAlertIcon className="size-16 text-error mx-auto" />
        <h2 className="text-2xl font-bold">Community Not Found</h2>
        <p className="opacity-70">The community "c/{communityName}" does not exist or has been deleted.</p>
      </div>
    );
  }

  const isJoined = userRole !== null;
  const posts = postsData?.posts || [];
  const pagination = postsData?.pagination || {};

  const isModeratorOrOwner = userRole === "owner" || userRole === "moderator";

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-base-100 flex flex-col">
      {/* Banner / Cover */}
      <div className="h-40 sm:h-48 w-full bg-gradient-to-r from-primary/30 to-secondary/30 relative">
        {community.banner && (
          <img src={community.banner} alt="banner" className="w-full h-full object-cover" />
        )}
      </div>

      {/* Community Head Section */}
      <div className="container mx-auto max-w-4xl px-4 sm:px-6 relative -mt-10 sm:-mt-12 flex-1 pb-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3 sm:gap-4">
            {/* Avatar */}
            <div className="avatar size-20 sm:size-24 rounded-2xl overflow-hidden bg-base-200 border-4 border-base-100 shadow-xl flex items-center justify-center font-bold text-3xl text-secondary">
              {community.avatar ? (
                <img src={community.avatar} alt={community.name} className="object-cover w-full h-full" />
              ) : (
                community.name[0].toUpperCase()
              )}
            </div>

            <div className="pb-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold flex items-center gap-2">
                c/{community.name}
                {community.type === "private" ? (
                  <LockIcon className="size-4 opacity-60 text-secondary" />
                ) : (
                  <GlobeIcon className="size-4 opacity-60 text-primary" />
                )}
              </h1>
              <p className="text-xs sm:text-sm opacity-70 mt-1 flex items-center gap-1.5 font-medium">
                <UsersIcon className="size-4" />
                {community.membersCount} members
                {isJoined && (
                  <span className="badge badge-sm badge-secondary capitalize ml-2">{userRole}</span>
                )}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            {isJoined ? (
              <button
                className="btn btn-outline btn-error btn-sm sm:btn-md gap-2 rounded-xl"
                onClick={() => leaveMutation.mutate(community._id)}
                disabled={userRole === "owner" || leaveMutation.isPending}
              >
                <UserMinusIcon className="size-4" />
                Leave Group
              </button>
            ) : (
              <button
                className="btn btn-primary btn-sm sm:btn-md gap-2 rounded-xl text-white"
                onClick={() => joinMutation.mutate(community._id)}
                disabled={joinMutation.isPending}
              >
                <UserPlusIcon className="size-4" />
                Join Community
              </button>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="divider my-6" />

        {/* Content grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Feed panel */}
          <div className="md:col-span-2 space-y-6">
            {/* Create Post Widget (only for members) */}
            {isJoined ? (
              <CreatePostForm communityId={community._id} communityName={community.name} />
            ) : (
              <div className="card bg-base-200 border border-base-300 p-5 text-center text-sm opacity-75">
                Join this community to share links, text posts, and media!
              </div>
            )}

            {/* Sorting Tab Header */}
            <div className="flex items-center gap-2 bg-base-200 p-1.5 rounded-xl border border-base-300">
              <button
                onClick={() => { setSort("new"); setPage(1); }}
                className={`btn btn-sm rounded-lg flex-1 sm:flex-initial gap-1 ${
                  sort === "new" ? "btn-primary text-white" : "btn-ghost"
                }`}
              >
                <ClockIcon className="size-4" />
                New
              </button>
              <button
                onClick={() => { setSort("hot"); setPage(1); }}
                className={`btn btn-sm rounded-lg flex-1 sm:flex-initial gap-1 ${
                  sort === "hot" ? "btn-primary text-white" : "btn-ghost"
                }`}
              >
                <FlameIcon className="size-4" />
                Hot
              </button>
              <button
                onClick={() => { setSort("top"); setPage(1); }}
                className={`btn btn-sm rounded-lg flex-1 sm:flex-initial gap-1 ${
                  sort === "top" ? "btn-primary text-white" : "btn-ghost"
                }`}
              >
                <StarIcon className="size-4" />
                Top
              </button>
            </div>

            {/* Posts listing */}
            {loadingPosts ? (
              <div className="flex justify-center py-8">
                <span className="loading loading-spinner loading-md text-primary" />
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-12 opacity-60 text-sm">
                No posts here yet. Be the first to start the conversation!
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <PostCard
                    key={post._id}
                    post={post}
                    onDelete={(id) => deletePostMutation.mutate(id)}
                  />
                ))}

                {/* Pagination Controls */}
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

          {/* Sidebar Info Panel */}
          <div className="md:col-span-1 space-y-4">
            <div className="card bg-base-200 border border-base-300 rounded-2xl">
              <div className="card-body p-5 space-y-4">
                <h2 className="font-bold text-lg">About Community</h2>
                <p className="text-sm opacity-85 leading-relaxed">{community.description}</p>

                <div className="divider my-2" />

                <div className="space-y-3 text-xs opacity-75">
                  <div
                    className="flex justify-between items-center cursor-pointer hover:bg-base-300 p-2 rounded-xl transition-all"
                    onClick={() => setIsMembersModalOpen(true)}
                    title="View Members"
                  >
                    <span className="font-semibold flex items-center gap-1.5">
                      <UsersIcon className="size-4" />
                      Members
                    </span>
                    <span className="badge badge-primary font-bold">{community.membersCount}</span>
                  </div>
                  <div>
                    <span className="font-semibold block">Created</span>
                    <span>{new Date(community.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="font-semibold block">Owner</span>
                    <span>{community.owner?.fullName || "System Admin"}</span>
                  </div>
                </div>

                {isModeratorOrOwner && (
                  <div className="pt-2 space-y-2">
                    <button
                      onClick={() => setIsEditingVisuals(true)}
                      className="btn btn-outline btn-sm rounded-xl w-full text-xs font-semibold gap-1.5 normal-case"
                    >
                      <SettingsIcon className="size-3.5" />
                      Edit Community Visuals
                    </button>
                    
                    <button
                      onClick={() => setIsMembersModalOpen(true)}
                      className="btn btn-outline btn-secondary btn-sm rounded-xl w-full text-xs font-semibold gap-1.5 normal-case"
                    >
                      <UsersIcon className="size-3.5" />
                      Manage Members
                    </button>

                    {userRole === "owner" && (
                      <button
                        onClick={() => {
                          if (window.confirm("Are you absolutely sure you want to delete this community? This action is irreversible.")) {
                            deleteCommunityMutation.mutate();
                          }
                        }}
                        className="btn btn-outline btn-error btn-sm rounded-xl w-full text-xs font-semibold gap-1.5 normal-case"
                        disabled={deleteCommunityMutation.isPending}
                      >
                        Delete Community
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Visuals Modal */}
      {isEditingVisuals && (
        <div className="modal modal-open modal-bottom sm:modal-middle" onClick={() => setIsEditingVisuals(false)}>
          <div className="modal-box bg-base-100 border border-base-300 rounded-3xl p-6 relative" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setIsEditingVisuals(false)}
              className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4"
            >
              ✕
            </button>
            
            <h3 className="font-bold text-lg mb-4 text-center">Edit Community Visuals</h3>
            
            <form onSubmit={handleUpdateVisualsSubmit} className="space-y-6">
              {/* Cover Image Banner Selector */}
              <div className="space-y-2">
                <span className="text-xs font-semibold opacity-75">Cover Image (Banner)</span>
                <div className="relative h-28 w-full rounded-2xl overflow-hidden bg-base-300 border border-base-content/10 group cursor-pointer shadow-inner">
                  {newBannerPreview ? (
                    <img src={newBannerPreview} alt="Cover Preview" className="w-full h-full object-cover" />
                  ) : community.banner ? (
                    <img src={community.banner} alt="Existing Cover" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-xs opacity-60">
                      <ImageIcon className="size-5 mb-1 opacity-70" />
                      <span className="font-bold">Upload Cover Image</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setNewBannerFile(file);
                        const reader = new FileReader();
                        reader.onloadend = () => setNewBannerPreview(reader.result);
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">
                    Change Banner
                  </div>
                </div>
              </div>

              {/* Logo Avatar Selector */}
              <div className="space-y-2">
                <span className="text-xs font-semibold opacity-75">Community Logo (Avatar)</span>
                <div className="flex items-center gap-4">
                  <div className="relative size-16 rounded-full overflow-hidden bg-base-300 border border-base-content/10 group cursor-pointer flex-shrink-0 shadow-inner flex items-center justify-center">
                    {newAvatarPreview ? (
                      <img src={newAvatarPreview} alt="Logo Preview" className="w-full h-full object-cover" />
                    ) : community.avatar ? (
                      <img src={community.avatar} alt="Existing Logo" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xxs font-bold opacity-60">
                        Upload
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setNewAvatarFile(file);
                          const reader = new FileReader();
                          reader.onloadend = () => setNewAvatarPreview(reader.result);
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
                      Change
                    </div>
                  </div>
                  <div className="text-xs opacity-70">
                    Customize the small logo displayed on the feed pages and group directories.
                  </div>
                </div>
              </div>

              <div className="modal-action w-full flex flex-col-reverse sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingVisuals(false)}
                  className="btn btn-ghost flex-1 rounded-xl normal-case btn-sm h-10 w-full sm:w-auto"
                  disabled={isUpdatingVisuals}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary flex-1 rounded-xl text-white normal-case btn-sm h-10 w-full sm:w-auto"
                  disabled={isUpdatingVisuals || (!newAvatarFile && !newBannerFile)}
                >
                  {isUpdatingVisuals ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Members Modal */}
      {isMembersModalOpen && (
        <div className="modal modal-open modal-bottom sm:modal-middle" onClick={() => setIsMembersModalOpen(false)}>
          <div className="modal-box bg-base-100 border border-base-300 rounded-3xl p-5 relative max-w-md" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setIsMembersModalOpen(false)}
              className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4"
            >
              ✕
            </button>
            
            <h3 className="font-extrabold text-lg mb-4 text-center">Community Members</h3>
            
            {loadingMembers ? (
              <div className="flex justify-center py-8">
                <span className="loading loading-spinner loading-md text-primary"></span>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {membersData?.members?.map((member) => {
                  const isTargetOwner = member.role === "owner";
                  const isTargetMod = member.role === "moderator";
                  
                  // Can the logged in user manage this target member?
                  // Owners can manage everyone except themselves.
                  // Moderators can only view, they can't change roles/kick unless we let them kick members.
                  const canManage = isModeratorOrOwner && !isTargetOwner && (userRole === "owner" || !isTargetMod);

                  return (
                    <div key={member._id} className="flex items-center justify-between gap-3 p-2 bg-base-200 border border-base-300 rounded-2xl">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="avatar size-10 rounded-full overflow-hidden flex-shrink-0">
                          <img src={member.user?.profilePic || "/default-avatar.png"} alt={member.user?.fullName} className="object-cover w-full h-full" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-xs truncate">{member.user?.fullName}</h4>
                          <p className="text-[10px] opacity-70 truncate">{member.user?.email}</p>
                          <span className={`badge badge-xs capitalize mt-1 ${isTargetOwner ? "badge-primary" : isTargetMod ? "badge-secondary" : "badge-ghost"}`}>
                            {member.role}
                          </span>
                        </div>
                      </div>

                      {canManage && (
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {/* Role promote/demote (only Owner can change roles) */}
                          {userRole === "owner" && (
                            <select
                              value={member.role}
                              onChange={(e) => updateRoleMutation.mutate({ targetUserId: member.user?._id, role: e.target.value })}
                              className="select select-bordered select-xs rounded-lg font-bold text-[10px] h-7 min-h-0 py-0"
                              disabled={updateRoleMutation.isPending}
                            >
                              <option value="member">Member</option>
                              <option value="moderator">Moderator</option>
                            </select>
                          )}

                          {/* Kick Button */}
                          <button
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to kick ${member.user?.fullName}?`)) {
                                kickMemberMutation.mutate(member.user?._id);
                              }
                            }}
                            className="btn btn-ghost btn-circle btn-xs text-error hover:bg-error/15"
                            disabled={kickMemberMutation.isPending}
                            title="Kick Member"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityDetailPage;

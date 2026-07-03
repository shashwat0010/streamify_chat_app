import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  searchAll,
  joinCommunity,
  sendFriendRequest,
  getJoinedCommunities,
  getOutgoingFriendReqs,
  castVote,
  toggleBookmark,
  getUserVotes,
  getUserBookmarksMap
} from "../lib/api";
import { SearchIcon, CompassIcon, UsersIcon, FileTextIcon, UserPlusIcon, CheckCircleIcon, MapPinIcon } from "lucide-react";
import Avatar from "../components/Avatar";
import PostCard from "../components/PostCard";
import toast from "react-hot-toast";

const SearchPage = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get("q") || "";

  const [inputVal, setInputVal] = useState(queryParam);
  const [activeTab, setActiveTab] = useState("posts");

  useEffect(() => {
    setInputVal(queryParam);
  }, [queryParam]);

  // Query search results
  const { data: searchResults, isLoading: loadingSearch } = useQuery({
    queryKey: ["search", queryParam],
    queryFn: () => searchAll(queryParam),
    enabled: !!queryParam.trim(),
  });

  // Query user states
  const { data: joinedData } = useQuery({
    queryKey: ["joinedCommunities"],
    queryFn: getJoinedCommunities,
  });

  const { data: outgoingFriendReqs } = useQuery({
    queryKey: ["outgoingFriendReqs"],
    queryFn: getOutgoingFriendReqs,
  });

  const { data: votesData } = useQuery({
    queryKey: ["userVotes"],
    queryFn: getUserVotes,
  });

  const { data: bookmarksData } = useQuery({
    queryKey: ["userBookmarks"],
    queryFn: getUserBookmarksMap,
  });

  // Mutations
  const joinMutation = useMutation({
    mutationFn: joinCommunity,
    onSuccess: (data) => {
      toast.success(data.message || "Joined community!");
      queryClient.invalidateQueries({ queryKey: ["joinedCommunities"] });
    },
  });

  const friendRequestMutation = useMutation({
    mutationFn: sendFriendRequest,
    onSuccess: () => {
      toast.success("Request sent!");
      queryClient.invalidateQueries({ queryKey: ["outgoingFriendReqs"] });
    },
  });

  const voteMutation = useMutation({
    mutationFn: castVote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["search", queryParam] });
      queryClient.invalidateQueries({ queryKey: ["userVotes"] });
    },
  });

  const bookmarkMutation = useMutation({
    mutationFn: toggleBookmark,
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["userBookmarks"] });
    },
  });

  const posts = searchResults?.posts || [];
  const communities = searchResults?.communities || [];
  const users = searchResults?.users || [];

  const joinedIds = new Set(joinedData?.communities?.map((c) => c._id) || []);
  const outgoingIds = new Set(outgoingFriendReqs?.map((r) => r.recipient._id) || []);
  const userVotes = votesData?.votes || {};
  const userBookmarks = bookmarksData?.bookmarks || {};

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (inputVal.trim()) {
      setSearchParams({ q: inputVal.trim() });
    }
  };

  const getLanguageFlag = (lang) => {
    const flags = {
      english: "🇺🇸", spanish: "🇪🇸", french: "🇫🇷", german: "🇩🇪",
      chinese: "🇨🇳", japanese: "🇯🇵", korean: "🇰🇷", italian: "🇮🇹"
    };
    return flags[lang?.toLowerCase()] || "🌐";
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-4xl space-y-8">
      {/* Search Input Box */}
      <form onSubmit={handleSearchSubmit} className="relative w-full max-w-2xl mx-auto">
        <input
          type="text"
          placeholder="Search for posts, communities, or users..."
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          className="input input-bordered input-md sm:input-lg w-full pl-12 pr-4 rounded-2xl shadow-sm text-sm sm:text-md"
        />
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 size-5 opacity-60 text-primary" />
        <button type="submit" className="btn btn-primary btn-sm sm:btn-md absolute right-2 top-1/2 -translate-y-1/2 rounded-xl text-white">
          Search
        </button>
      </form>

      {queryParam.trim() ? (
        <div className="space-y-6">
          {/* Category Tabs */}
          <div className="tabs tabs-boxed bg-base-200 p-1 rounded-xl flex">
            <button
              onClick={() => setActiveTab("posts")}
              className={`tab flex-1 gap-2 font-bold rounded-lg ${activeTab === "posts" ? "tab-active bg-primary text-white" : ""}`}
            >
              <FileTextIcon className="size-4" />
              Posts ({posts.length})
            </button>
            <button
              onClick={() => setActiveTab("communities")}
              className={`tab flex-1 gap-2 font-bold rounded-lg ${activeTab === "communities" ? "tab-active bg-primary text-white" : ""}`}
            >
              <CompassIcon className="size-4" />
              Communities ({communities.length})
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`tab flex-1 gap-2 font-bold rounded-lg ${activeTab === "users" ? "tab-active bg-primary text-white" : ""}`}
            >
              <UsersIcon className="size-4" />
              Users ({users.length})
            </button>
          </div>

          {/* Loader */}
          {loadingSearch ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-lg text-primary" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Tab 1: Posts */}
              {activeTab === "posts" && (
                posts.length === 0 ? (
                  <div className="text-center py-12 opacity-60 text-sm bg-base-200 rounded-xl p-8">No matching posts found.</div>
                ) : (
                  <div className="space-y-4">
                    {posts.map((post) => (
                      <PostCard
                        key={post._id}
                        post={post}
                        onVote={(type) => voteMutation.mutate({ targetId: post._id, targetType: "Post", voteType: type })}
                        onBookmark={() => bookmarkMutation.mutate(post._id)}
                        isBookmarked={!!userBookmarks[post._id]}
                        userVote={userVotes[post._id] || 0}
                      />
                    ))}
                  </div>
                )
              )}

              {/* Tab 2: Communities */}
              {activeTab === "communities" && (
                communities.length === 0 ? (
                  <div className="text-center py-12 opacity-60 text-sm bg-base-200 rounded-xl p-8">No matching communities found.</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {communities.map((community) => {
                      const isJoined = joinedIds.has(community._id);

                      return (
                        <div key={community._id} className="card bg-base-200 border border-base-300 p-5 flex flex-col justify-between rounded-2xl hover:shadow-md transition-all">
                          <div className="flex items-center gap-3">
                            <div className="avatar size-12 bg-primary/10 text-primary font-bold rounded-xl flex items-center justify-center text-lg">
                              {community.avatar ? <img src={community.avatar} alt={community.name} /> : community.name[0].toUpperCase()}
                            </div>
                            <div>
                              <Link to={`/c/${community.name}`} className="font-bold hover:underline block">
                                c/{community.name}
                              </Link>
                              <span className="text-xs opacity-60">{community.membersCount} members</span>
                            </div>
                          </div>
                          <p className="text-xs opacity-80 mt-3 line-clamp-2 min-h-[2rem]">{community.description}</p>
                          <div className="card-actions justify-end mt-4">
                            {isJoined ? (
                              <Link to={`/c/${community.name}`} className="btn btn-outline btn-xs">View</Link>
                            ) : (
                              <button
                                onClick={() => joinMutation.mutate(community._id)}
                                className="btn btn-primary btn-xs text-white"
                                disabled={joinMutation.isPending}
                              >
                                Join
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              )}

              {/* Tab 3: Users */}
              {activeTab === "users" && (
                users.length === 0 ? (
                  <div className="text-center py-12 opacity-60 text-sm bg-base-200 rounded-xl p-8">No users found.</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {users.map((user) => {
                      const hasSent = outgoingIds.has(user._id);

                      return (
                        <div key={user._id} className="card bg-base-200 border border-base-300 p-4 rounded-2xl flex flex-row items-center justify-between gap-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="avatar size-12 rounded-full overflow-hidden flex-shrink-0">
                              <Avatar src={user.profilePic} alt={user.fullName} />
                            </div>
                            <div className="min-w-0 space-y-1">
                              <h4 className="font-bold text-sm truncate">{user.fullName}</h4>
                              <div className="flex items-center gap-1.5 text-xxs opacity-75">
                                <span>{getLanguageFlag(user.nativeLanguage)} → {getLanguageFlag(user.learningLanguage)}</span>
                              </div>
                              {user.location && (
                                <div className="text-xxs opacity-60 flex items-center gap-0.5">
                                  <MapPinIcon className="size-3" />
                                  {user.location}
                                </div>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={() => friendRequestMutation.mutate(user._id)}
                            className={`btn btn-circle btn-sm ${hasSent ? "btn-disabled text-success" : "btn-primary text-white"}`}
                            disabled={hasSent || friendRequestMutation.isPending}
                          >
                            {hasSent ? <CheckCircleIcon className="size-4" /> : <UserPlusIcon className="size-4" />}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="card bg-base-200 p-12 text-center text-sm opacity-60 max-w-md mx-auto">
          Type a search term above to begin searching.
        </div>
      )}
    </div>
  );
};

export default SearchPage;

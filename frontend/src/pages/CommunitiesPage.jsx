import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router";
import { getJoinedCommunities, getCommunities, joinCommunity, leaveCommunity } from "../lib/api";
import { UsersIcon, PlusIcon, SearchIcon, CompassIcon, LogOutIcon } from "lucide-react";
import Avatar from "../components/Avatar";
import toast from "react-hot-toast";

const CommunitiesPage = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: joinedData, isLoading: loadingJoined } = useQuery({
    queryKey: ["joinedCommunities"],
    queryFn: getJoinedCommunities,
  });

  const { data: exploreData, isLoading: loadingExplore } = useQuery({
    queryKey: ["exploreCommunities", searchTerm],
    queryFn: () => getCommunities(searchTerm),
  });

  const joinMutation = useMutation({
    mutationFn: joinCommunity,
    onSuccess: (data) => {
      toast.success(data.message || "Joined community!");
      queryClient.invalidateQueries({ queryKey: ["joinedCommunities"] });
      queryClient.invalidateQueries({ queryKey: ["exploreCommunities"] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to join community");
    },
  });

  const leaveMutation = useMutation({
    mutationFn: leaveCommunity,
    onSuccess: (data) => {
      toast.success(data.message || "Left community!");
      queryClient.invalidateQueries({ queryKey: ["joinedCommunities"] });
      queryClient.invalidateQueries({ queryKey: ["exploreCommunities"] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to leave community");
    },
  });

  const joinedCommunities = joinedData?.communities || [];
  const exploreCommunities = exploreData?.communities || [];

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-6xl space-y-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
            Communities
          </h1>
          <p className="opacity-70 text-sm mt-1">
            Join interest-based groups, ask questions, share content, and discuss languages.
          </p>
        </div>
        <Link to="/communities/create" className="btn btn-primary btn-sm sm:btn-md gap-2">
          <PlusIcon className="size-5" />
          Create Community
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column: Joined communities */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center gap-2 font-bold text-lg mb-2">
            <UsersIcon className="size-5 text-primary" />
            <h2>Your Communities ({joinedCommunities.length})</h2>
          </div>

          {loadingJoined ? (
            <div className="flex justify-center p-8">
              <span className="loading loading-spinner loading-md text-primary" />
            </div>
          ) : joinedCommunities.length === 0 ? (
            <div className="card bg-base-200 p-6 text-center text-sm opacity-70">
              You haven't joined any communities yet. Explore and find groups that interest you!
            </div>
          ) : (
            <div className="space-y-3">
              {joinedCommunities.map((community) => (
                <div
                  key={community._id}
                  className="card bg-base-200 border border-base-300 hover:shadow-md transition-all duration-200"
                >
                  <div className="card-body p-4 flex flex-row items-center gap-3">
                    <div className="avatar size-10 rounded-xl overflow-hidden bg-primary/10 flex items-center justify-center font-bold text-primary">
                      {community.avatar ? (
                        <img src={community.avatar} alt={community.name} />
                      ) : (
                        community.name[0].toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/c/${community.name}`}
                        className="font-semibold block truncate hover:underline hover:text-primary transition-all"
                      >
                        c/{community.name}
                      </Link>
                      <span className="text-xs opacity-60 block">
                        {community.membersCount} members • {community.role}
                      </span>
                    </div>
                    {community.role !== "owner" && (
                      <button
                        className="btn btn-ghost btn-circle btn-sm text-error tooltip tooltip-left"
                        data-tip="Leave Community"
                        disabled={leaveMutation.isPending}
                        onClick={() => leaveMutation.mutate(community._id)}
                      >
                        <LogOutIcon className="size-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right column: Explore communities */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 font-bold text-lg">
              <CompassIcon className="size-5 text-secondary" />
              <h2>Explore Groups</h2>
            </div>
            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <SearchIcon className="size-4 text-base-content/50" />
              </span>
              <input
                type="text"
                placeholder="Search communities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input input-bordered input-sm sm:input-md w-full pr-4 rounded-xl"
                style={{ paddingLeft: "2.5rem" }}
              />
            </div>
          </div>

          {loadingExplore ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-lg text-secondary" />
            </div>
          ) : exploreCommunities.length === 0 ? (
            <div className="card bg-base-200 p-12 text-center">
              <h3 className="font-semibold text-lg">No communities found</h3>
              <p className="opacity-70 text-sm mt-1">
                Try searching for something else or create your own community!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {exploreCommunities.map((community) => {
                const isJoined = joinedCommunities.some((jc) => jc._id === community._id);

                return (
                  <div
                    key={community._id}
                    className="card bg-base-200 border border-base-300 hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
                  >
                    <div className="card-body p-5 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="avatar size-12 rounded-xl overflow-hidden bg-secondary/10 flex items-center justify-center font-bold text-secondary text-lg">
                          {community.avatar ? (
                            <img src={community.avatar} alt={community.name} />
                          ) : (
                            community.name[0].toUpperCase()
                          )}
                        </div>
                        <div>
                          <Link
                            to={`/c/${community.name}`}
                            className="font-bold text-lg hover:underline hover:text-primary transition-all block"
                          >
                            c/{community.name}
                          </Link>
                          <span className="text-xs opacity-60">
                            {community.membersCount} members
                          </span>
                        </div>
                      </div>

                      <p className="text-sm opacity-85 line-clamp-2 min-h-[2.5rem]">
                        {community.description}
                      </p>

                      <div className="card-actions justify-end mt-2">
                        {isJoined ? (
                          <Link to={`/c/${community.name}`} className="btn btn-outline btn-sm w-full sm:w-auto">
                            View Group
                          </Link>
                        ) : (
                          <button
                            className="btn btn-secondary btn-sm w-full sm:w-auto"
                            onClick={() => joinMutation.mutate(community._id)}
                            disabled={joinMutation.isPending}
                          >
                            Join Community
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommunitiesPage;

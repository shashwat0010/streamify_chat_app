import { Link, useLocation } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import { useQuery } from "@tanstack/react-query";
import { getJoinedCommunities } from "../lib/api";
import { BellIcon, HomeIcon, ShipWheelIcon, UsersIcon, HistoryIcon, CompassIcon, BookmarkIcon, PenSquareIcon } from "lucide-react";
import Avatar from "./Avatar";

const Sidebar = () => {
  const { authUser } = useAuthUser();
  const location = useLocation();
  const currentPath = location.pathname;

  // Query user's joined communities for Reddit sidebar view
  const { data: joinedData } = useQuery({
    queryKey: ["joinedCommunities"],
    queryFn: getJoinedCommunities,
    enabled: !!authUser,
  });

  const joinedCommunities = joinedData?.communities || [];

  return (
    <aside className="w-64 bg-base-200 border-r border-base-300 hidden lg:flex flex-col h-screen sticky top-0">
      <div className="p-5 border-b border-base-300">
        <Link to="/" className="flex items-center gap-2.5">
          <ShipWheelIcon className="size-9 text-primary" />
          <span className="text-3xl font-bold font-mono bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary  tracking-wider">
            Streamify
          </span>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-14rem)]">
        <Link
          to="/communities"
          className="btn btn-primary justify-start w-full gap-3 px-3 normal-case rounded-xl mb-2"
        >
          <PenSquareIcon className="size-5" />
          <span>Create Post</span>
        </Link>

        <Link
          to="/"
          className={`btn btn-ghost justify-start w-full gap-3 px-3 normal-case ${currentPath === "/" ? "btn-active" : ""
            }`}
        >
          <HomeIcon className="size-5 text-base-content opacity-70" />
          <span>Home</span>
        </Link>

        <Link
          to="/communities"
          className={`btn btn-ghost justify-start w-full gap-3 px-3 normal-case ${currentPath?.startsWith("/communities") || currentPath?.startsWith("/c/") ? "btn-active" : ""
            }`}
        >
          <CompassIcon className="size-5 text-base-content opacity-70" />
          <span>Communities</span>
        </Link>

        <Link
          to="/friends"
          className={`btn btn-ghost justify-start w-full gap-3 px-3 normal-case ${currentPath === "/friends" ? "btn-active" : ""
            }`}
        >
          <UsersIcon className="size-5 text-base-content opacity-70" />
          <span>Friends</span>
        </Link>

        <Link
          to="/bookmarks"
          className={`btn btn-ghost justify-start w-full gap-3 px-3 normal-case ${currentPath === "/bookmarks" ? "btn-active" : ""
            }`}
        >
          <BookmarkIcon className="size-5 text-base-content opacity-70" />
          <span>Saved Posts</span>
        </Link>

        <Link
          to="/notifications"
          className={`btn btn-ghost justify-start w-full gap-3 px-3 normal-case ${currentPath === "/notifications" ? "btn-active" : ""
            }`}
        >
          <BellIcon className="size-5 text-base-content opacity-70" />
          <span>Notifications</span>
        </Link>

        <Link
          to="/history"
          className={`btn btn-ghost justify-start w-full gap-3 px-3 normal-case ${currentPath === "/history" ? "btn-active" : ""
            }`}
        >
          <HistoryIcon className="size-5 text-base-content opacity-70" />
          <span>History</span>
        </Link>

        {/* Communities List (Reddit-style) */}
        {joinedCommunities.length > 0 && (
          <div className="pt-4 space-y-2 border-t border-base-300 mt-4">
            <p className="px-3 text-xxs font-extrabold uppercase tracking-wider text-base-content/40 select-none">
              My Communities
            </p>
            <div className="space-y-0.5">
              {joinedCommunities.map((community) => {
                const isActive = currentPath === `/c/${community.name}`;
                return (
                  <Link
                    key={community._id}
                    to={`/c/${community.name}`}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold hover:bg-base-300 transition-all truncate block ${
                      isActive ? "bg-base-300 text-primary" : "text-base-content/80"
                    }`}
                  >
                    <div className="avatar size-5 rounded-md overflow-hidden bg-primary/10 flex items-center justify-center font-bold text-[9px] text-primary flex-shrink-0">
                      {community.avatar ? (
                        <img src={community.avatar} alt={community.name} className="object-cover w-full h-full" />
                      ) : (
                        community.name[0].toUpperCase()
                      )}
                    </div>
                    <span className="truncate">c/{community.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* USER PROFILE SECTION */}
      <div className="p-4 border-t border-base-300 mt-auto">
        <Link to="/profile" className="flex items-center gap-3 hover:bg-base-300 p-2 rounded-lg transition-colors">
          <div className="avatar">
            <div className="w-10 rounded-full">
              <Avatar src={authUser?.profilePic} alt="User Avatar" />
            </div>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">{authUser?.fullName}</p>
            <p className="text-xs text-success flex items-center gap-1">
              <span className="size-2 rounded-full bg-success inline-block" />
              Online
            </p>
          </div>
        </Link>
      </div>
    </aside>
  );
};
export default Sidebar;

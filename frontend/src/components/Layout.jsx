import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import useSocket from "../hooks/useSocket";
import { Link, useLocation } from "react-router";
import { HomeIcon, CompassIcon, UsersIcon, BookmarkIcon } from "lucide-react";

const Layout = ({ children, showSidebar = false }) => {
  useSocket(); // Initialize socket connection and listeners
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <div className={`min-h-screen flex flex-col ${showSidebar ? "pb-16 lg:pb-0" : ""}`}>
      <div className="flex flex-1">
        {showSidebar && <Sidebar />}

        <div className="flex-1 flex flex-col">
          <Navbar />

          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>

      {/* Bottom Navigation for Mobile */}
      {showSidebar && (
        <div className="btm-nav lg:hidden bg-base-200 border-t border-base-300 z-50">
          <Link to="/" className={currentPath === "/" ? "active text-primary" : "text-base-content/70"}>
            <HomeIcon className="size-5" />
            <span className="btm-nav-label text-[10px]">Home</span>
          </Link>
          <Link to="/communities" className={currentPath.startsWith("/communities") || currentPath.startsWith("/c/") ? "active text-primary" : "text-base-content/70"}>
            <CompassIcon className="size-5" />
            <span className="btm-nav-label text-[10px]">Explore</span>
          </Link>
          <Link to="/friends" className={currentPath === "/friends" ? "active text-primary" : "text-base-content/70"}>
            <UsersIcon className="size-5" />
            <span className="btm-nav-label text-[10px]">Friends</span>
          </Link>
          <Link to="/bookmarks" className={currentPath === "/bookmarks" ? "active text-primary" : "text-base-content/70"}>
            <BookmarkIcon className="size-5" />
            <span className="btm-nav-label text-[10px]">Saved</span>
          </Link>
        </div>
      )}
    </div>
  );
};
export default Layout;

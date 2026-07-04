import { useEffect } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import CreatePostModal from "./CreatePostModal";
import useSocket from "../hooks/useSocket";
import { Link, useLocation } from "react-router";
import { HomeIcon, CompassIcon, UsersIcon, BookmarkIcon } from "lucide-react";

const Layout = ({ children, showSidebar = false }) => {
  useSocket(); // Initialize socket connection and listeners
  const location = useLocation();
  const currentPath = location.pathname;

  // Close mobile drawer on navigation
  useEffect(() => {
    const drawerToggle = document.getElementById("sidebar-drawer");
    if (drawerToggle) drawerToggle.checked = false;
  }, [currentPath]);

  return (
    <div className="drawer lg:drawer-open min-h-screen">
      <input id="sidebar-drawer" type="checkbox" className="drawer-toggle" />
      
      <div className="drawer-content flex flex-col min-h-screen">
        <div className={`flex flex-col flex-1 ${showSidebar ? "pb-16 lg:pb-0" : ""}`}>
          <Navbar showSidebar={showSidebar} />

          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>

        {/* Bottom Navigation for Mobile */}
        {showSidebar && (
          <div className="btm-nav lg:hidden bg-base-200 border-t border-base-300 z-35">
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

      {/* Mobile Drawer Side Overlay */}
      {showSidebar && (
        <div className="drawer-side z-50 lg:hidden">
          <label htmlFor="sidebar-drawer" aria-label="close sidebar" className="drawer-overlay"></label>
          <div className="w-72 min-h-full bg-base-200 p-0 flex flex-col">
            <Sidebar isMobile={true} />
          </div>
        </div>
      )}

      {/* Global Modals */}
      <CreatePostModal />
    </div>
  );
};
export default Layout;

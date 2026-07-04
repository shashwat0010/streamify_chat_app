import { Link, useLocation, useNavigate } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import { BellIcon, LogOutIcon, ShipWheelIcon, SearchIcon, MenuIcon } from "lucide-react";
import ThemeSelector from "./ThemeSelector";
import useLogout from "../hooks/useLogout";
import Avatar from "./Avatar";

const Navbar = ({ showSidebar = false }) => {
  const { authUser } = useAuthUser();
  const location = useLocation();
  const navigate = useNavigate();
  const isChatPage = location.pathname?.startsWith("/chat");
  const { logoutMutation } = useLogout();

  return (
    <nav className="bg-base-200 border-b border-base-300 sticky top-0 z-30 h-16 flex items-center">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between w-full gap-4">
          {/* Hamburger Menu toggle for mobile */}
          {showSidebar && (
            <label htmlFor="sidebar-drawer" className="btn btn-ghost btn-circle lg:hidden flex-shrink-0">
              <MenuIcon className="size-6 text-base-content opacity-75" />
            </label>
          )}

          {/* LOGO - ONLY IN THE CHAT PAGE */}
          {isChatPage ? (
            <div className="pl-5 flex-shrink-0">
              <Link to="/" className="flex items-center gap-2.5">
                <ShipWheelIcon className="size-9 text-primary" />
                <span className="text-3xl font-bold font-mono bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary  tracking-wider">
                  Streamify
                </span>
              </Link>
            </div>
          ) : (
            <div className="flex-shrink-0 lg:hidden">
              <Link to="/" className="flex items-center gap-2">
                <ShipWheelIcon className="size-7 text-primary" />
              </Link>
            </div>
          )}

          {/* SEARCH BAR */}
          {!isChatPage && (
            <div className="hidden md:flex flex-1 max-w-md mx-auto relative">
              <input
                type="text"
                placeholder="Search..."
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.target.value.trim()) {
                    navigate(`/search?q=${encodeURIComponent(e.target.value.trim())}`);
                  }
                }}
                className="input input-bordered input-sm w-full pl-9 rounded-xl"
              />
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 opacity-50" />
            </div>
          )}

          {/* User actions */}
          <div className="flex items-center gap-3 sm:gap-4 ml-auto">
            <Link to={"/notifications"}>
              <button className="btn btn-ghost btn-circle">
                <BellIcon className="h-6 w-6 text-base-content opacity-70" />
              </button>
            </Link>

            <ThemeSelector />

            <div className="avatar shadow-inner">
              <div className="w-9 rounded-full">
                <Avatar src={authUser?.profilePic} alt="User Avatar" />
              </div>
            </div>

            <button className="btn btn-ghost btn-circle" onClick={logoutMutation}>
              <LogOutIcon className="h-6 w-6 text-base-content opacity-70" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

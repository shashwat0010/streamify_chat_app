import { useState } from "react";
import useFriendStore from "../store/friendStore";
import useAuthUser from "../hooks/useAuthUser";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import Avatar from "./Avatar";
import { SearchIcon, UserPlusIcon, AlertCircleIcon, CheckIcon, UserIcon } from "lucide-react";

const SendFriendRequest = () => {
  const { authUser } = useAuthUser();
  const [email, setEmail] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const { sendFriendRequest, processingIds, error } = useFriendStore();

  const isSending = processingIds.includes("send_request");

  const handleSearch = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail) return;

    setIsSearching(true);
    try {
      const response = await axiosInstance.get(`/users/search?email=${encodeURIComponent(cleanEmail)}`);
      if (response.data) {
        setSearchResult(response.data);
      } else {
        toast.error("User not found");
        setSearchResult(null);
      }
    } catch (error) {
      console.error("Failed to search user:", error);
      toast.error(error.response?.data?.message || "User not found");
      setSearchResult(null);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendRequest = async () => {
    if (!searchResult) return;

    try {
      await sendFriendRequest(searchResult._id);
      setEmail("");
      setSearchResult(null);
      toast.success("Friend request sent successfully!");
    } catch (error) {
      console.error("Failed to send friend request:", error);
      toast.error(error.response?.data?.message || "Failed to send friend request");
    }
  };

  const isMe = searchResult?._id === authUser?._id;
  const isFriend = authUser?.friends?.includes(searchResult?._id);

  return (
    <div className="card bg-base-200 border border-base-300 rounded-2xl shadow w-full max-w-sm mx-auto">
      <div className="card-body p-5 space-y-4">
        <h2 className="card-title text-lg font-bold border-b border-base-300 pb-2">
          Add Friend
        </h2>
        
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="form-control w-full">
            <label htmlFor="email" className="label">
              <span className="label-text font-semibold text-xs opacity-75">
                Friend's Email
              </span>
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input input-bordered w-full rounded-xl text-sm"
              placeholder="friend@example.com"
              required
            />
          </div>

          {error && (
            <div className="text-error text-xs flex items-center gap-1.5 opacity-90 mt-1">
              <AlertCircleIcon className="size-3.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSearching || !email.trim()}
            className="btn btn-primary btn-sm rounded-xl w-full gap-1.5"
          >
            {isSearching ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              <SearchIcon className="size-4" />
            )}
            Search User
          </button>
        </form>

        {searchResult && (
          <div className="mt-2 p-3 bg-base-300/40 border border-base-content/5 rounded-xl space-y-3">
            <div className="flex items-center gap-3">
              <div className="avatar size-11 rounded-full overflow-hidden flex-shrink-0">
                <Avatar
                  src={searchResult.profilePic || "/default-avatar.png"}
                  alt={searchResult.fullName}
                />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-sm truncate">{searchResult.fullName}</h3>
                <p className="text-xs opacity-70 truncate">{searchResult.email}</p>
              </div>
            </div>
            
            {isMe ? (
              <div className="badge badge-info gap-1 text-white text-xs w-full py-2.5 rounded-xl justify-center font-bold">
                <UserIcon className="size-3.5" />
                This is you
              </div>
            ) : isFriend ? (
              <div className="badge badge-success gap-1 text-white text-xs w-full py-2.5 rounded-xl justify-center font-bold">
                <CheckIcon className="size-3.5" />
                Already Friends
              </div>
            ) : (
              <button
                onClick={handleSendRequest}
                disabled={isSending}
                className="btn btn-secondary btn-sm w-full rounded-xl gap-1.5 text-white"
              >
                {isSending ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : (
                  <UserPlusIcon className="size-4" />
                )}
                Send Friend Request
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SendFriendRequest;

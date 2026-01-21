import { Link } from "react-router";
import { LANGUAGE_TO_FLAG } from "../constants";
import { UserMinusIcon } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { removeFriend } from "../lib/api";
import toast from "react-hot-toast";
import Avatar from "./Avatar";

const FriendCard = ({ friend }) => {
  const queryClient = useQueryClient();

  const { mutate: removeFriendMutation, isPending } = useMutation({
    mutationFn: removeFriend,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      toast.success("Friend removed successfully");
    },
    onError: () => {
      toast.error("Failed to remove friend");
    },
  });

  return (
    <div className="card bg-base-200 hover:shadow-md transition-shadow">
      <div className="card-body p-4">
        {/* USER INFO */}
        <div className="flex items-center gap-3 mb-3">
          <div className="avatar size-12">
            <Avatar src={friend.profilePic} alt={friend.fullName} />
          </div>
          <h3 className="font-semibold truncate">{friend.fullName}</h3>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className="badge badge-secondary text-xs">
            {getLanguageFlag(friend.nativeLanguage)}
            Native: {friend.nativeLanguage}
          </span>
          <span className="badge badge-outline text-xs">
            {getLanguageFlag(friend.learningLanguage)}
            Learning: {friend.learningLanguage}
          </span>
        </div>

        <div className="flex gap-2">
          <Link to={`/chat/${friend._id}`} className="btn btn-outline flex-1">
            Message
          </Link>
          <button
            className="btn btn-ghost btn-square"
            onClick={() => removeFriendMutation(friend._id)}
            disabled={isPending}
          >
            <UserMinusIcon className="size-5 text-error" />
          </button>
        </div>
      </div>
    </div>
  );
};
export default FriendCard;

export function getLanguageFlag(language) {
  if (!language) return null;

  const langLower = language.toLowerCase();
  const countryCode = LANGUAGE_TO_FLAG[langLower];

  if (countryCode) {
    return (
      <img
        src={`https://flagcdn.com/24x18/${countryCode}.png`}
        alt={`${langLower} flag`}
        className="h-3 mr-1 inline-block"
      />
    );
  }
  return null;
}

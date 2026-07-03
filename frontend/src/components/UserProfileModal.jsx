import Avatar from "./Avatar";

const UserProfileModal = ({ user, onClose }) => {
  if (!user) return null;

  return (
    <div className="modal modal-open modal-bottom sm:modal-middle" onClick={onClose}>
      <div 
        className="modal-box bg-base-100 border border-base-300 rounded-3xl p-6 relative max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4"
        >
          ✕
        </button>

        <div className="flex flex-col items-center text-center space-y-4 mt-2">
          {/* Avatar frame */}
          <div className="avatar">
            <div className="w-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2 shadow-lg">
              <Avatar src={user.profilePic || "/default-avatar.png"} alt={user.fullName} />
            </div>
          </div>

          <div className="space-y-1">
            <h3 className="text-xl font-bold">{user.fullName}</h3>
            {user.email && <p className="text-xs opacity-60 font-semibold">{user.email}</p>}
            {user.location && <p className="text-xxs opacity-70 uppercase tracking-wider">{user.location}</p>}
          </div>

          {user.bio && (
            <p className="text-xs italic bg-base-200 p-3 rounded-xl border border-base-300/40 w-full leading-relaxed">
              "{user.bio}"
            </p>
          )}

          <div className="divider my-1 w-full"></div>

          {/* Languages */}
          <div className="grid grid-cols-2 gap-3 w-full text-left">
            <div className="bg-base-200 p-3 rounded-2xl border border-base-300">
              <span className="text-xxs opacity-60 block font-semibold uppercase tracking-wider">Native</span>
              <span className="text-xs sm:text-sm font-bold text-primary mt-0.5 block truncate">
                {user.nativeLanguage || "Not Specified"}
              </span>
            </div>
            <div className="bg-base-200 p-3 rounded-2xl border border-base-300">
              <span className="text-xxs opacity-60 block font-semibold uppercase tracking-wider">Learning</span>
              <span className="text-xs sm:text-sm font-bold text-secondary mt-0.5 block truncate">
                {user.learningLanguage || "Not Specified"}
              </span>
            </div>
          </div>

          <div className="modal-action w-full pt-2">
            <button 
              onClick={onClose}
              className="btn btn-primary w-full rounded-xl text-white normal-case btn-sm h-10"
            >
              Close Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;

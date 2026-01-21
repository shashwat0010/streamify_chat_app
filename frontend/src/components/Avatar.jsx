import { useState } from "react";
import { UserIcon } from "lucide-react";

const Avatar = ({ src, alt, className = "" }) => {
  const [error, setError] = useState(false);

  // Fallback if no src or load error
  if (!src || error) {
    return (
      <div className={`w-full h-full flex items-center justify-center bg-base-300 text-base-content font-bold text-xl rounded-full ${className}`}>
        {alt ? (
          <span className="uppercase">{alt.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}</span>
        ) : (
          <UserIcon className="size-1/2 opacity-50" />
        )}
      </div>
    );
  }

  // Rewrite legacy avatar URLs on the fly
  const displaySrc = (src.includes("avatar.iran.liara.run") || src.includes("ui-avatars.com"))
    ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(alt || "User")}`
    : src;

  return (
    <img
      src={displaySrc}
      alt={alt}
      className={`w-full h-full object-cover rounded-full ${className}`}
      onError={() => setError(true)}
    />
  );
};
export default Avatar;

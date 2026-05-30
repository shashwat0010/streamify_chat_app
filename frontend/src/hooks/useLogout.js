import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import { useState } from "react";

const useLogout = () => {
  const queryClient = useQueryClient();
  const { signOut } = useAuth();
  const [isPending, setIsPending] = useState(false);

  const logoutMutation = async () => {
    setIsPending(true);
    try {
      await signOut();
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
    } finally {
      setIsPending(false);
    }
  };

  return { logoutMutation, isPending, error: null };
};
export default useLogout;

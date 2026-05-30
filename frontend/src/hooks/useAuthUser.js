import { useQuery } from "@tanstack/react-query";
import { getAuthUser } from "../lib/api";
import { useAuth } from "@clerk/clerk-react";
import { axiosInstance } from "../lib/axios";

const useAuthUser = () => {
  const { isLoaded, isSignedIn, getToken } = useAuth();

  const authUser = useQuery({
    queryKey: ["authUser"],
    queryFn: async () => {
      const token = await getToken();
      if (token) {
        // Set default for all FUTURE requests in the app
        axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      }
      // Pass token explicitly to ensure the very first request doesn't miss it
      return getAuthUser(token);
    },
    enabled: isLoaded && isSignedIn,
    retry: false, 
  });

  return { isLoading: !isLoaded || (isSignedIn && authUser.isLoading), authUser: authUser.data?.user };
};
export default useAuthUser;

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
        axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      }
      return getAuthUser();
    },
    enabled: isLoaded && isSignedIn,
    retry: false, 
  });

  return { isLoading: !isLoaded || (isSignedIn && authUser.isLoading), authUser: authUser.data?.user };
};
export default useAuthUser;

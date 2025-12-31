import { useMutation, useQueryClient } from "@tanstack/react-query";
import { signup } from "../lib/api";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";

const useSignUp = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { mutate, isPending, error } = useMutation({
    mutationFn: signup,
    onSuccess: (data, variables) => {
      toast.success("Account created! Please verify your email.");
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
      navigate("/verify-email", { state: { email: variables.email } });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Signup failed");
    }
  });

  return { isPending, error, signupMutation: mutate };
};
export default useSignUp;

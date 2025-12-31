import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { verifyEmail } from "../lib/api";
import { ShieldCheckIcon } from "lucide-react";
import toast from "react-hot-toast";

const VerifyEmailPage = () => {
    const [code, setCode] = useState("");
    const location = useLocation();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // Get email from state if navigated from signup
    const email = location.state?.email || "your email";

    const { mutate: verify, isPending } = useMutation({
        mutationFn: verifyEmail,
        onSuccess: (data) => {
            toast.success("Email verified successfully!");
            // Invalidate auth queries to update user state if the backend sets the cookie
            queryClient.invalidateQueries({ queryKey: ["authUser"] });
            // Redirect to home or onboarding
            navigate(data.user.isOnboarded ? "/" : "/onboarding");
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "Verification failed");
        },
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        verify({ code });
    };

    return (
        <div className="h-screen flex items-center justify-center p-4 bg-base-200">
            <div className="card w-full max-w-md bg-base-100 shadow-xl">
                <div className="card-body items-center text-center">
                    <div className="bg-primary/10 p-4 rounded-full mb-4">
                        <ShieldCheckIcon className="size-12 text-primary" />
                    </div>

                    <h2 className="card-title text-2xl mb-2">Verify Your Email</h2>
                    <p className="text-gray-500 mb-6">
                        We've sent a 6-digit verification code to <span className="font-semibold">{email}</span>.
                        Please enter it below.
                    </p>

                    <form onSubmit={handleSubmit} className="w-full space-y-4">
                        <input
                            type="text"
                            placeholder="Enter 6-digit code"
                            className="input input-bordered w-full text-center text-2xl tracking-widest"
                            maxLength={6}
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            required
                        />

                        <button
                            type="submit"
                            className="btn btn-primary w-full"
                            disabled={isPending || code.length < 6}
                        >
                            {isPending ? (
                                <span className="loading loading-spinner"></span>
                            ) : (
                                "Verify Email"
                            )}
                        </button>
                    </form>

                    <div className="mt-4">
                        <p className="text-sm opacity-70">
                            Check your spam folder provided by Ethereal Email (check terminal logs) or real email.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VerifyEmailPage;

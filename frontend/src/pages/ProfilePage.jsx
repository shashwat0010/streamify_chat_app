import { MailIcon, UserIcon, GlobeIcon, CalendarIcon, EditIcon, SaveIcon, XIcon } from "lucide-react";
import useAuthUser from "../hooks/useAuthUser";
import { useState } from "react";
import toast from "react-hot-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateProfile } from "../lib/api";

const ProfilePage = () => {
    const { authUser } = useAuthUser();
    const queryClient = useQueryClient();

    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        fullName: authUser?.fullName || "",
        nativeLanguage: authUser?.nativeLanguage || "",
        learningLanguage: authUser?.learningLanguage || "",
    });

    const { mutate: updateProfileMutation } = useMutation({
        mutationFn: updateProfile,
        onSuccess: () => {
            toast.success("Profile updated successfully");
            setIsEditing(false);
            queryClient.invalidateQueries({ queryKey: ["authUser"] });
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "Failed to update profile");
        }
    });

    if (!authUser) return null;

    const handleSubmit = () => {
        updateProfileMutation(formData);
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 min-h-full">
            <div className="max-w-3xl mx-auto space-y-6">
                <div className="card bg-base-100 shadow-xl border border-base-200">
                    <div className="card-body">
                        <div className="flex justify-between items-start">
                            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-8 w-full">
                                {/* Avatar */}
                                <div className="avatar">
                                    <div className="w-24 sm:w-32 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                                        <img src={authUser.profilePic} alt="Profile" />
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="w-full space-y-2">
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            className="input input-bordered w-full max-w-xs text-2xl font-bold"
                                            value={formData.fullName}
                                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                        />
                                    ) : (
                                        <h1 className="text-3xl font-bold text-center sm:text-left">{authUser.fullName}</h1>
                                    )}

                                    <div className="flex flex-wrap justify-center sm:justify-start gap-4 text-gray-500 mt-2">
                                        <div className="flex items-center gap-1.5">
                                            <MailIcon size={16} />
                                            <span>{authUser.email || "No email"}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <CalendarIcon size={16} />
                                            <span>Joined {new Date().toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => setIsEditing(!isEditing)}
                                className="btn btn-ghost btn-circle"
                            >
                                {isEditing ? <XIcon /> : <EditIcon />}
                            </button>
                        </div>

                        <div className="divider my-6"></div>

                        {/* Languages Section */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <GlobeIcon className="text-primary" size={20} />
                                    Native Language
                                </h3>
                                <div className="p-4 bg-base-200 rounded-lg border border-base-300">
                                    {isEditing ? (
                                        <select
                                            className="select select-ghost w-full"
                                            value={formData.nativeLanguage}
                                            onChange={(e) => setFormData({ ...formData, nativeLanguage: e.target.value })}
                                        >
                                            <option value="">Select Language</option>
                                            <option value="English">English</option>
                                            <option value="Spanish">Spanish</option>
                                            <option value="French">French</option>
                                            <option value="German">German</option>
                                            <option value="Hindi">Hindi</option>
                                            <option value="Japanese">Japanese</option>
                                        </select>
                                    ) : (
                                        <span className="text-lg font-medium">{authUser.nativeLanguage || "Not specified"}</span>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <GlobeIcon className="text-secondary" size={20} />
                                    Learning Language
                                </h3>
                                <div className="p-4 bg-base-200 rounded-lg border border-base-300">
                                    {isEditing ? (
                                        <select
                                            className="select select-ghost w-full"
                                            value={formData.learningLanguage}
                                            onChange={(e) => setFormData({ ...formData, learningLanguage: e.target.value })}
                                        >
                                            <option value="">Select Language</option>
                                            <option value="English">English</option>
                                            <option value="Spanish">Spanish</option>
                                            <option value="French">French</option>
                                            <option value="German">German</option>
                                            <option value="Hindi">Hindi</option>
                                            <option value="Japanese">Japanese</option>
                                        </select>
                                    ) : (
                                        <span className="text-lg font-medium">{authUser.learningLanguage || "Not specified"}</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {isEditing && (
                            <div className="flex justify-end mt-6">
                                <button
                                    className="btn btn-primary gap-2"
                                    onClick={handleSubmit}
                                >
                                    <SaveIcon size={18} />
                                    Save Changes
                                </button>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;

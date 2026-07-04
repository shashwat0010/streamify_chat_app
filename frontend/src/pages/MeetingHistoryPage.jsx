import { useQuery, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../lib/axios";
import React from "react";
import { format } from "date-fns";
import { CalendarIcon, PlayCircleIcon, FileTextIcon } from "lucide-react";
import PageLoader from "../components/PageLoader";
import toast from "react-hot-toast";

const MeetingHistoryPage = () => {
    const { data: meetings, isLoading, error } = useQuery({
        queryKey: ["meetings"],
        queryFn: async () => {
            const res = await axiosInstance.get("/meetings");
            return res.data;
        },
    });

    if (isLoading) return <PageLoader />;

    if (error) return <div className="text-center text-red-500 mt-10">Failed to load meetings.</div>;

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="container mx-auto space-y-6">
                <h1 className="text-2xl font-bold">Meeting History</h1>

                {meetings.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">
                        No past meetings found.
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {meetings.map((meeting) => (
                            <div key={meeting._id} className="card bg-base-100 shadow-md border border-base-200">
                                <div className="card-body">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                        <div>
                                            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                                                <CalendarIcon size={16} />
                                                {format(new Date(meeting.createdAt), "PPP p")}
                                            </div>
                                            <h3 className="card-title text-lg">
                                                Meeting with {meeting.participants.map(p => p.fullName).join(", ")}
                                            </h3>
                                            {meeting.summary && (
                                                <p className="text-sm mt-2 line-clamp-2 opacity-80 border-l-2 border-primary pl-2">
                                                    <span className="font-semibold">Summary:</span> {meeting.summary}
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex gap-2">
                                            <RecordingButton meeting={meeting} />
                                            {!meeting.summary && (
                                                <button className="btn btn-ghost btn-sm gap-2" disabled>
                                                    <FileTextIcon size={16} />
                                                    No Summary
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// Component to handle dynamic signed URL retrieval and recording checks
const RecordingButton = ({ meeting }) => {
    const [isLoading, setIsLoading] = React.useState(false);
    const queryClient = useQueryClient();

    const handleClick = async () => {
        setIsLoading(true);
        try {
            const { checkMeetingRecording } = await import("../lib/api");
            const data = await checkMeetingRecording(meeting._id);
            if (data.recordingUrl) {
                // Dynamically open the fresh, signed, non-expired URL!
                window.open(data.recordingUrl, "_blank", "noopener,noreferrer");

                // Invalidate query if the URL was not saved in DB previously
                if (!meeting.recordingUrl) {
                    queryClient.invalidateQueries({ queryKey: ["meetings"] });
                }
            } else {
                toast.error("Recording not yet available.");
            }
        } catch (error) {
            if (error.response?.status === 404) {
                toast.error("Recording not yet available.");
            } else {
                toast.error("Failed to access recording.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (meeting.recordingUrl) {
        return (
            <button
                className="btn btn-primary btn-sm gap-2"
                onClick={handleClick}
                disabled={isLoading}
            >
                {isLoading ? <span className="loading loading-spinner loading-xs"></span> : <PlayCircleIcon size={16} />}
                Recording
            </button>
        );
    }

    return (
        <button
            className="btn btn-outline btn-sm gap-2"
            onClick={handleClick}
            disabled={isLoading}
        >
            {isLoading ? <span className="loading loading-spinner loading-xs"></span> : <PlayCircleIcon size={16} />}
            Check Rec
        </button>
    );
};

export default MeetingHistoryPage;

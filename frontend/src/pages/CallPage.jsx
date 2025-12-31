import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import { useQuery } from "@tanstack/react-query";
import { getStreamToken, saveMeeting } from "../lib/api";

import {
  StreamVideo,
  StreamVideoClient,
  StreamCall,
  CallControls,
  SpeakerLayout,
  StreamTheme,
  CallingState,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";

import "@stream-io/video-react-sdk/dist/css/styles.css";
import toast from "react-hot-toast";
import PageLoader from "../components/PageLoader";

import Whiteboard from "../components/Whiteboard";
import { MonitorIcon, PenToolIcon } from "lucide-react";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

const CallPage = () => {
  const { id: callId } = useParams();
  const [client, setClient] = useState(null);
  const [call, setCall] = useState(null);
  const [isConnecting, setIsConnecting] = useState(true);

  const { authUser, isLoading } = useAuthUser();

  const { data: tokenData } = useQuery({
    queryKey: ["streamToken"],
    queryFn: getStreamToken,
    enabled: !!authUser,
  });

  useEffect(() => {
    const initCall = async () => {
      if (!tokenData?.token || !authUser || !callId) return;

      try {
        console.log("Initializing Stream video client...");

        const user = {
          id: authUser._id,
          name: authUser.fullName,
          image: authUser.profilePic,
        };

        const videoClient = new StreamVideoClient({
          apiKey: STREAM_API_KEY,
          user,
          token: tokenData.token,
        });

        const callInstance = videoClient.call("default", callId);

        await callInstance.join({ create: true });

        console.log("Joined call successfully");

        setClient(videoClient);
        setCall(callInstance);
      } catch (error) {
        console.error("Error joining call:", error);
        toast.error("Could not join the call. Please try again.");
      } finally {
        setIsConnecting(false);
      }
    };

    initCall();
  }, [tokenData, authUser, callId]);

  if (isLoading || isConnecting) return <PageLoader />;

  return (
    <div className="h-screen flex flex-col items-center justify-center">
      <div className="relative w-full h-full">
        {client && call ? (
          <StreamVideo client={client}>
            <StreamCall call={call}>
              <CallContent call={call} />
            </StreamCall>
          </StreamVideo>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p>Could not initialize call. Please refresh or try again later.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const CallContent = ({ call }) => {
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();
  const navigate = useNavigate();
  const [hasLeft, setHasLeft] = useState(false);
  const [activeTool, setActiveTool] = useState(null); // 'whiteboard', 'annotation', or null

  useEffect(() => {
    const handleLeave = async () => {
      if (callingState === CallingState.LEFT && !hasLeft) {
        setHasLeft(true);
        try {
          // Pass authUser as a guaranteed participant if the list is empty (e.g. self-call or left early)
          // The backend uses this list to give access, so we must be in it.
          const currentUserId = call?.currentUserId; // Stream often has this
          let participants = call.state.participants.map(p => p.userId);

          // Fallback: If no *active* participants, add ourselves.
          if (!participants.includes(currentUserId)) {
            participants.push(currentUserId);
          }

          const startTime = call.data?.created_at || new Date();
          const endTime = new Date();

          await saveMeeting({
            participants,
            startTime,
            endTime,
            callId: call.id
          });
          toast.success("Meeting saved to history");
        } catch (error) {
          console.error("Failed to save meeting", error);
        }
        navigate("/");
      }
    };
    handleLeave();
  }, [callingState, navigate, call, hasLeft]);

  if (callingState === CallingState.LEFT) return null;

  return (
    <StreamTheme>
      <div className="relative h-full w-full">
        <SpeakerLayout />
        <CallControls />

        {/* Custom Tools */}
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 flex gap-4 pointer-events-auto z-[100]">
          <button
            onClick={() => setActiveTool(activeTool === 'whiteboard' ? null : 'whiteboard')}
            className={`p-3 rounded-full shadow-lg transition-colors ${activeTool === 'whiteboard' ? 'bg-primary text-primary-content' : 'bg-base-100 hover:bg-base-200'}`}
            title="Whiteboard"
          >
            <PenToolIcon size={20} />
          </button>
          <button
            onClick={() => setActiveTool(activeTool === 'annotation' ? null : 'annotation')}
            className={`p-3 rounded-full shadow-lg transition-colors ${activeTool === 'annotation' ? 'bg-primary text-primary-content' : 'bg-base-100 hover:bg-base-200'}`}
            title="Annotate Screen"
          >
            <MonitorIcon size={20} />
          </button>
        </div>

        {/* Overlays */}
        {activeTool === 'whiteboard' && (
          <Whiteboard
            roomId={call.id}
            onClose={() => setActiveTool(null)}
          />
        )}
        {activeTool === 'annotation' && (
          <Whiteboard
            roomId={call.id}
            onClose={() => setActiveTool(null)}
            isAnnotation={true}
          />
        )}
      </div>
    </StreamTheme>
  );
};

export default CallPage;

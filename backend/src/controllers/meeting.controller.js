import Meeting from "../models/Meeting.js";
import { getCallRecording } from "../lib/stream-video.js";

export const saveMeeting = async (req, res) => {
    try {
        const { participants, startTime, endTime, callId } = req.body;
        console.log("Saving meeting. CallID:", callId, "Participants:", participants); // Debug log

        let recordingUrl = null;
        if (callId) {
            recordingUrl = await getCallRecording(callId);
            console.log("Fetched recording URL:", recordingUrl); // Debug log
        }

        const meeting = new Meeting({
            participants,
            recordingUrl,
            startTime,
            endTime,
            callId, // Save callId
            summary: `Meeting held on ${new Date(startTime).toLocaleDateString()} at ${new Date(startTime).toLocaleTimeString()}. Participants: ${participants.length}. Duration: ${Math.round((new Date(endTime) - new Date(startTime)) / 1000 / 60)} minutes.`,
            highlights: [
                { time: "00:00", note: "Meeting Start" },
                { time: "End", note: "Meeting End" }
            ]
        });

        await meeting.save();
        console.log("Meeting saved to DB:", meeting._id); // Debug log
        res.status(201).json(meeting);
    } catch (error) {
        console.error("Error saving meeting:", error);
        res.status(500).json({ message: "Failed to save meeting" });
    }
};

export const getMyMeetings = async (req, res) => {
    try {
        console.log("Fetching meetings for user:", req.user._id); // Debug log
        const meetings = await Meeting.find({ participants: req.user._id })
            .populate("participants", "fullName profilePic")
            .sort({ createdAt: -1 });

        console.log("Found meetings:", meetings.length); // Debug log
        res.status(200).json(meetings);
    } catch (error) {
        console.error("Error fetching meetings:", error);
        res.status(500).json({ message: "Failed to fetch meetings" });
    }
};

export const getMeetingById = async (req, res) => {
    try {
        const meeting = await Meeting.findById(req.params.id).populate("participants", "fullName profilePic");
        if (!meeting) return res.status(404).json({ message: "Meeting not found" });

        // simple check if user was participant
        const isParticipant = meeting.participants.some(p => p._id.toString() === req.user._id.toString());
        if (!isParticipant) {
            return res.status(403).json({ message: "Not authorized to view this meeting" });
        }

        res.status(200).json(meeting);
    } catch (error) {
        res.status(500).json({ message: "Error fetching meeting" });
    }
};

export const checkRecording = async (req, res) => {
    try {
        const meeting = await Meeting.findById(req.params.id);
        if (!meeting) return res.status(404).json({ message: "Meeting not found" });

        // Try to fetch a fresh, non-expired recording URL from Stream.io if callId exists
        if (meeting.callId) {
            console.log("Fetching fresh recording URL dynamically for callId:", meeting.callId);
            const recordingUrl = await getCallRecording(meeting.callId, meeting.startTime);
            if (recordingUrl) {
                meeting.recordingUrl = recordingUrl;
                await meeting.save();
                return res.status(200).json({ recordingUrl });
            }
        }

        // Fallback to the stored URL if fresh fetch yields nothing (or if callId is missing)
        if (meeting.recordingUrl) {
            return res.status(200).json({ recordingUrl: meeting.recordingUrl });
        }

        res.status(404).json({ message: "Recording still not available" });
    } catch (error) {
        console.error("Error checking recording:", error);
        res.status(500).json({ message: "Failed to check recording" });
    }
};

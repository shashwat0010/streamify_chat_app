import mongoose from "mongoose";

const meetingSchema = new mongoose.Schema(
    {
        participants: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        startTime: {
            type: Date,
            default: Date.now,
        },
        callId: {
            type: String,
            required: false // Optional for older records
        },
        endTime: {
            type: Date,
        },
        recordingUrl: {
            type: String,
        },
        summary: { // For Smart Summaries
            type: String,
        },
        highlights: [{ // For Smart Summaries timestamps
            time: String,
            note: String
        }]
    },
    { timestamps: true }
);

const Meeting = mongoose.model("Meeting", meetingSchema);

export default Meeting;

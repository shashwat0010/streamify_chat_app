import { StreamClient } from "@stream-io/node-sdk";
import "dotenv/config";

const apiKey = process.env.STREAM_API_KEY;
const apiSecret = process.env.STREAM_API_SECRET;

if (!apiKey || !apiSecret) {
    console.error("Stream API key or Secret is missing");
}

const streamClient = new StreamClient(apiKey, apiSecret);

export const getCallRecording = async (callId, callStartTime) => {
    try {
        console.log(`Fetching recording for Call ID: ${callId}, Start Time: ${callStartTime}`);

        let recordings = [];

        // Approach 1: Client level queryRecordings (admin)
        if (typeof streamClient.queryRecordings === 'function') {
            const response = await streamClient.queryRecordings({
                filter_conditions: { call_cid: `default:${callId}` },
                sort: [{ field: 'start_time', direction: -1 }],
            });
            recordings = response.recordings;
        }

        // Approach 2: Call object level
        else {
            const call = streamClient.video.call("default", callId);
            if (typeof call.listRecordings === 'function') {
                const response = await call.listRecordings();
                recordings = response.recordings;
            } else if (typeof call.queryRecordings === 'function') {
                const response = await call.queryRecordings();
                recordings = response.recordings;
            }
        }

        if (!recordings || recordings.length === 0) return null;

        // If no callStartTime provided, return latest (legacy behavior)
        if (!callStartTime) {
            recordings.sort((a, b) => new Date(b.end_time) - new Date(a.end_time));
            return recordings[0].url;
        }

        // Filter: Find recording where start_time is close to callStartTime
        // Allow a window of e.g., 5 minutes difference
        const meetingStart = new Date(callStartTime).getTime();

        const matchingRecording = recordings.find(rec => {
            const recStart = new Date(rec.start_time).getTime();
            const diff = Math.abs(recStart - meetingStart);
            return diff < 5 * 60 * 1000; // 5 minutes tolerance
        });

        if (matchingRecording) {
            return matchingRecording.url;
        }

        console.log("No matching recording found for time window.");
        return null;

    } catch (error) {
        console.error("Error fetching recording:", error);
        return null;
    }
};

export default streamClient;

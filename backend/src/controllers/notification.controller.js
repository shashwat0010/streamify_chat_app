import Notification from "../models/Notification.js";
import { getIO } from "../lib/socket.js";

// Helper to trigger a notification and emit socket event
export async function triggerNotification({ recipient, sender, type, post = null, comment = null }) {
  try {
    if (recipient.toString() === sender.toString()) return;

    const notification = await Notification.create({
      recipient,
      sender,
      type,
      post,
      comment,
    });

    const populated = await Notification.findById(notification._id)
      .populate("sender", "fullName profilePic")
      .populate("post", "title");

    // Push real-time Socket event
    try {
      const io = getIO();
      io.to(recipient.toString()).emit("new-notification", populated);
    } catch (socketError) {
      console.log("Socket notification trigger failed (offline user or non-initialized):", socketError.message);
    }
  } catch (error) {
    console.error("Error triggerNotification helper:", error);
  }
}

// Get user notifications
export async function getNotifications(req, res) {
  try {
    const userId = req.user.id;

    const notifications = await Notification.find({ recipient: userId })
      .populate("sender", "fullName profilePic")
      .populate("post", "title")
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({ success: true, notifications });
  } catch (error) {
    console.error("Error in getNotifications controller:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

// Mark single notification as read
export async function markAsRead(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipient: userId },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.status(200).json({ success: true, notification });
  } catch (error) {
    console.error("Error in markAsRead controller:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

// Mark all notifications as read
export async function markAllAsRead(req, res) {
  try {
    const userId = req.user.id;

    await Notification.updateMany({ recipient: userId, isRead: false }, { isRead: true });

    res.status(200).json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    console.error("Error in markAllAsRead controller:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

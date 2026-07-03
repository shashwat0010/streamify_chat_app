import { axiosInstance } from "./axios";

export const signup = async (signupData) => {
  const response = await axiosInstance.post("/auth/signup", signupData);
  return response.data;
};

export const login = async (loginData) => {
  const response = await axiosInstance.post("/auth/login", loginData);
  return response.data;
};
export const logout = async () => {
  const response = await axiosInstance.post("/auth/logout");
  return response.data;
};

export const verifyEmail = async (verificationData) => {
  const response = await axiosInstance.post("/auth/verify-email", verificationData);
  return response.data;
};

export const getAuthUser = async (token) => {
  try {
    const config = {};
    if (token) {
      config.headers = { Authorization: `Bearer ${token}` };
    }
    const res = await axiosInstance.get("/auth/me", config);
    return res.data;
  } catch (error) {
    console.log("Error in getAuthUser:", error);
    return null;
  }
};

export const completeOnboarding = async (userData) => {
  const response = await axiosInstance.post("/auth/onboarding", userData);
  return response.data;
};

export async function getUserFriends() {
  const response = await axiosInstance.get("/users/friends");
  return response.data;
}

export async function getRecommendedUsers() {
  const response = await axiosInstance.get("/users");
  return response.data;
}

export async function getOutgoingFriendReqs() {
  const response = await axiosInstance.get("/users/outgoing-friend-requests");
  return response.data;
}

export async function sendFriendRequest(userId) {
  const response = await axiosInstance.post(`/users/friend-request/${userId}`);
  return response.data;
}

export async function getFriendRequests() {
  const response = await axiosInstance.get("/users/friend-requests");
  return response.data;
}

export async function acceptFriendRequest(requestId) {
  const response = await axiosInstance.put(`/users/friend-request/${requestId}/accept`);
  return response.data;
}

export async function removeFriend(friendId) {
  const response = await axiosInstance.delete(`/users/friends/${friendId}`);
  return response.data;
}

export async function getStreamToken() {
  const response = await axiosInstance.get("/chat/token");
  return response.data;
}

export async function saveMeeting(meetingData) {
  const response = await axiosInstance.post("/meetings", meetingData);
  return response.data;
}

export async function updateProfile(profileData) {
  const response = await axiosInstance.put("/users/profile", profileData);
  return response.data;
}

export async function checkMeetingRecording(meetingId) {
  const response = await axiosInstance.post(`/meetings/${meetingId}/check-recording`);
  return response.data;
}

// Community API endpoints
export async function createCommunity(communityData) {
  const response = await axiosInstance.post("/communities", communityData);
  return response.data;
}

export async function updateCommunity(communityId, communityData) {
  const response = await axiosInstance.put(`/communities/${communityId}`, communityData);
  return response.data;
}

export async function deleteCommunity(communityId) {
  const response = await axiosInstance.delete(`/communities/${communityId}`);
  return response.data;
}

export async function getCommunityMembers(communityId) {
  const response = await axiosInstance.get(`/communities/${communityId}/members`);
  return response.data;
}

export async function kickCommunityMember(communityId, targetUserId) {
  const response = await axiosInstance.delete(`/communities/${communityId}/members/${targetUserId}`);
  return response.data;
}

export async function getCommunities(search = "") {
  const response = await axiosInstance.get(`/communities?search=${encodeURIComponent(search)}`);
  return response.data;
}

export async function getJoinedCommunities() {
  const response = await axiosInstance.get("/communities/joined");
  return response.data;
}

export async function getCommunity(nameOrId) {
  const response = await axiosInstance.get(`/communities/${nameOrId}`);
  return response.data;
}

export async function joinCommunity(communityId) {
  const response = await axiosInstance.post(`/communities/${communityId}/join`);
  return response.data;
}

export async function leaveCommunity(communityId) {
  const response = await axiosInstance.post(`/communities/${communityId}/leave`);
  return response.data;
}

export async function updateMemberRole(communityId, targetUserId, role) {
  const response = await axiosInstance.put(`/communities/${communityId}/members/${targetUserId}/role`, { role });
  return response.data;
}

// Post API endpoints
export async function getUploadUrl(fileName, fileType) {
  const response = await axiosInstance.get(`/posts/upload-url?fileName=${encodeURIComponent(fileName)}&fileType=${encodeURIComponent(fileType)}`);
  return response.data;
}

export async function uploadFileToUrl(uploadUrl, file, fileType) {
  // Put directly to S3 or Local fallback
  const response = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": fileType,
    },
  });
  if (!response.ok) {
    throw new Error("Failed to upload file");
  }
  return true;
}

export async function createPost(postData) {
  const response = await axiosInstance.post("/posts", postData);
  return response.data;
}

export async function getCommunityPosts(communityNameOrId, sort = "new", page = 1) {
  const response = await axiosInstance.get(`/posts/c/${communityNameOrId}?sort=${sort}&page=${page}`);
  return response.data;
}

export async function deletePost(postId) {
  const response = await axiosInstance.delete(`/posts/${postId}`);
  return response.data;
}

export async function getPostDetails(postId) {
  const response = await axiosInstance.get(`/posts/${postId}`);
  return response.data;
}

// Comment & Vote & Bookmark API endpoints
export async function createComment(commentData) {
  const response = await axiosInstance.post("/comments", commentData);
  return response.data;
}

export async function getPostComments(postId) {
  const response = await axiosInstance.get(`/comments/post/${postId}`);
  return response.data;
}

export async function castVote(voteData) {
  // voteData: { targetId, targetType, voteType }
  const response = await axiosInstance.post("/comments/vote", voteData);
  return response.data;
}

export async function toggleBookmark(postId) {
  const response = await axiosInstance.post("/comments/bookmark", { postId });
  return response.data;
}

export async function getBookmarks() {
  const response = await axiosInstance.get("/comments/bookmarks");
  return response.data;
}

export async function getUserVotes() {
  const response = await axiosInstance.get("/comments/user-votes");
  return response.data;
}

export async function getUserBookmarksMap() {
  const response = await axiosInstance.get("/comments/user-bookmarks");
  return response.data;
}

// Feed & Search API endpoints
export async function getFeedPosts(sort = "new", page = 1) {
  const response = await axiosInstance.get(`/posts?sort=${sort}&page=${page}`);
  return response.data;
}

export async function searchAll(query) {
  const response = await axiosInstance.get(`/search?q=${encodeURIComponent(query)}`);
  return response.data;
}

// Notifications API endpoints
export async function getNotifications() {
  const response = await axiosInstance.get("/notifications");
  return response.data;
}

export async function markNotificationRead(id) {
  const response = await axiosInstance.put(`/notifications/${id}/read`);
  return response.data;
}

export async function markAllNotificationsRead() {
  const response = await axiosInstance.put("/notifications/read-all");
  return response.data;
}

export async function rejectFriendRequest(id) {
  const response = await axiosInstance.delete(`/users/friend-request/${id}/reject`);
  return response.data;
}

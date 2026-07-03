// High-quality curated Unsplash placeholders to wow the user
const AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80", // Female
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80", // Male
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80", // Female
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80", // Male
  "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&h=150&q=80", // Male
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&h=150&q=80", // Female
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&h=150&q=80", // Female
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&h=150&q=80", // Male
];

const COMMUNITY_AVATARS = [
  "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=150&h=150&q=80", // Podcast/Media
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=150&h=150&q=80", // Web/Tech
  "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=150&h=150&q=80", // Classroom/Discussion
  "https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=150&h=150&q=80", // Books/Study
  "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=150&h=150&q=80", // Group Meeting
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=150&h=150&q=80", // Study partners
];

const COMMUNITY_BANNERS = [
  "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1000&h=300&q=80", // Library
  "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1000&h=300&q=80", // Mountains
  "https://images.unsplash.com/photo-1502239608882-93b729c6af43?auto=format&fit=crop&w=1000&h=300&q=80", // Abstract Art
  "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1000&h=300&q=80", // Work desk
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1000&h=300&q=80", // Tech network
  "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1000&h=300&q=80", // Whiteboard
];

// Helper to deterministically choose a placeholder based on string seed hash
function getHashIndex(str, listLength) {
  let hash = 0;
  if (!str) return 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % listLength;
}

export function getRandomAvatar(seed = "") {
  const index = getHashIndex(seed, AVATARS.length);
  return AVATARS[index];
}

export function getRandomCommunityAvatar(seed = "") {
  const index = getHashIndex(seed, COMMUNITY_AVATARS.length);
  return COMMUNITY_AVATARS[index];
}

export function getRandomCommunityBanner(seed = "") {
  const index = getHashIndex(seed, COMMUNITY_BANNERS.length);
  return COMMUNITY_BANNERS[index];
}

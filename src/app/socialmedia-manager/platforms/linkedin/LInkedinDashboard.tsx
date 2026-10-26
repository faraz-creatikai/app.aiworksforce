"use client";

import { useState, useRef, useEffect } from "react";
import { SocialPost } from "../../page";
import { publishLinkedinPost, getLinkedinStatus } from "@/store/linkedin/linkedin"; 
import { toast } from "react-toastify";

interface LinkedinDashboardProps {
  posts: SocialPost[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

export default function LinkedinDashboard({
  posts,
  loading,
  error,
  onRefresh,
}: LinkedinDashboardProps) {
  const [tab, setTab] = useState<"posts" | "publish">("posts");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Independent state just for LinkedIn profile details
  const [localProfile, setLocalProfile] = useState<{ name?: string; picture?: string; email?: string; locale?: string; profileUrl?: string } | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const res = await getLinkedinStatus();
      if (res?.success && res.data) {
        setLocalProfile({
          name: res.data.name,
          picture: res.data.profilePicture,
          email: res.data.email,
          locale: res.data.locale,
          profileUrl: res.data.profileUrl,
        });
      }
    };
    fetchProfile();
  }, []);

  const handlePublish = async () => {
    if (!text && !file) {
      toast.error("Please provide either text or an image.");
      return;
    }

    setIsPublishing(true);

    // Build true FormData so backend Multer can catch the image
    const formData = new FormData();
    if (text) formData.append("text", text);
    if (file) formData.append("media", file); // Ensure backend Multer uses upload.single("media")

    const res = await publishLinkedinPost(formData);

    if (res?.success) {
      toast.success("Published to LinkedIn successfully!");
      setText("");
      setFile(null);
      setTab("posts");
      onRefresh(); 
    } else {
      toast.error(res?.message || res?.error || "Failed to publish post.");
    }
    setIsPublishing(false);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* 👤 CONNECTED ACCOUNT DETAILS CARD */}
      {localProfile ? (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-[#f3f2ef] border border-gray-200 rounded-2xl p-5 shadow-sm gap-4">
          <div className="flex items-center gap-4">
            {localProfile.picture ? (
              <img
                src={localProfile.picture}
                alt={localProfile.name || "Profile"}
                className="w-14 h-14 rounded-full border-2 border-white shadow-sm object-cover"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-[#0a66c2] text-white flex items-center justify-center text-2xl font-bold border-2 border-white shadow-sm">
                {localProfile.name?.charAt(0) || "U"}
              </div>
            )}
            <div className="flex flex-col gap-0.5">
              <h2 className="text-lg font-bold text-gray-900">{localProfile.name}</h2>
              <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                {localProfile.email && <span>{localProfile.email}</span>}
              </div>
              <p className="text-xs text-emerald-600 font-bold flex items-center gap-1 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Active Connection
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {localProfile.profileUrl && (
              <a 
                href={localProfile.profileUrl} 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                View Profile ↗
              </a>
            )}
            <span className="hidden sm:inline-block text-[10px] font-black uppercase tracking-widest text-[#0a66c2] bg-blue-50 px-3 py-1.5 rounded-full border border-blue-200">
              LinkedIn
            </span>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-medium">
          Account connected, loading account details...
        </div>
      )}

      {/* 🔘 TABS */}
      <div className="flex items-center gap-2 bg-gray-100 border border-gray-200 rounded-xl p-1 w-max">
        <button
          onClick={() => setTab("posts")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            tab === "posts" ? "bg-[#0a66c2] text-white shadow-sm" : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Published Posts ({posts.length})
        </button>
        <button
          onClick={() => setTab("publish")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            tab === "publish" ? "bg-[#0a66c2] text-white shadow-sm" : "text-gray-600 hover:text-gray-900"
          }`}
        >
          + Create Post
        </button>
      </div>

      {/* 📝 PUBLISH FORM */}
      {tab === "publish" && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm max-w-2xl flex flex-col gap-4">
          <div>
            <h3 className="text-base font-bold text-gray-900">Publish Post</h3>
            <p className="text-xs text-gray-500 mt-0.5">LinkedIn API publishes content directly in real-time.</p>
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What do you want to talk about?"
            className="w-full min-h-[130px] p-4 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0a66c2] text-gray-800 placeholder-gray-400"
          />

          <div className="flex items-center gap-3">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              ref={fileInputRef}
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-gray-100 border border-gray-200 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-200 transition-colors cursor-pointer"
            >
              {file ? "Change Attached Image" : "📷 Attach Image"}
            </button>
            {file && <span className="text-xs text-gray-600 font-medium truncate max-w-[200px]">{file.name}</span>}
          </div>

          <button
            onClick={handlePublish}
            disabled={isPublishing || (!text && !file)}
            className="w-full py-3 bg-[#0a66c2] text-white rounded-xl text-sm font-bold hover:bg-[#004182] transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
          >
            {isPublishing ? "Publishing to LinkedIn..." : "Publish Post Now"}
          </button>
        </div>
      )}

      {/* 🖼️ POSTS GRID */}
      {tab === "posts" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Activity History</span>
            <button onClick={onRefresh} disabled={loading} className="text-xs font-bold text-[#0a66c2] hover:underline cursor-pointer">
              Refresh Feed
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => <div key={i} className="h-48 rounded-2xl bg-gray-100 animate-pulse" />)}
            </div>
          ) : error ? (
            <p className="text-xs text-red-500 font-semibold">{error}</p>
          ) : posts.length === 0 ? (
            <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-gray-500 text-xs">
              No posts found. Create your first post using the button above.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {posts.map((post) => (
                <div key={post.id} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                  <div>
                    {post.media_url && <img src={post.media_url} alt="Post attachment" className="w-full aspect-video object-cover rounded-xl mb-3" />}
                    <p className="text-xs text-gray-800 line-clamp-3 leading-relaxed">{post.caption || "Image Post"}</p>
                  </div>
                  <div className="flex items-center justify-between border-t border-gray-100 pt-3 mt-3">
                    <span className="text-[10px] font-semibold text-gray-400">
                      {new Date(post.timestamp).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </span>
                    {post.permalink && (
                      <a href={post.permalink} target="_blank" rel="noreferrer" className="text-xs font-bold text-[#0a66c2] hover:underline">
                        View Post ↗
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
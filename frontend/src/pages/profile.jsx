import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

export default function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profileUser, setProfileUser] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const isOwnProfile = currentUser.id === id;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/users/${id}`);
        setProfileUser(res.data.user);
        setUserPosts(res.data.posts);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07070a] text-zinc-400 flex items-center justify-center">
        Loading profile...
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen bg-[#07070a] text-zinc-400 flex flex-col items-center justify-center gap-3">
        <p>User profile not found.</p>
        <button
          onClick={() => navigate("/feed")}
          className="px-4 py-1.5 rounded-xl bg-zinc-800 text-white text-xs cursor-pointer"
        >
          ← Back to Feed
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07070a] bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:24px_24px] text-zinc-100 p-6">
      <div className="max-w-xl mx-auto space-y-6">
        
        {/* Top Back Bar */}
        <button
          onClick={() => navigate("/feed")}
          className="px-3.5 py-1.5 rounded-full bg-zinc-900/90 border border-white/10 text-xs font-medium text-zinc-300 hover:text-white transition cursor-pointer"
        >
          ← Back to Feed
        </button>

        {/* Profile Header Card */}
        <div className="bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-violet-600 to-fuchsia-500 flex items-center justify-center text-2xl font-bold uppercase text-white shrink-0">
              {profileUser.name?.charAt(0) || "U"}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold text-white">{profileUser.name}</h1>
                {profileUser.role === "admin" && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-semibold">
                    Admin
                  </span>
                )}
                {isOwnProfile && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300">
                    You
                  </span>
                )}
              </div>
              <p className="text-sm text-violet-400">@{profileUser.username || "member"}</p>
              <p className="text-xs text-zinc-500 mt-1">
                Joined {new Date(profileUser.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="text-center px-4 py-2 rounded-xl bg-zinc-950/70 border border-white/5">
            <p className="text-xl font-bold text-white">{userPosts.length}</p>
            <p className="text-[11px] text-zinc-400 uppercase tracking-wider">Posts</p>
          </div>
        </div>

        {/* User's Posts Grid */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            {isOwnProfile ? "Your Posts" : `Posts by ${profileUser.name}`}
          </h2>

          {userPosts.length === 0 ? (
            <div className="bg-zinc-900/60 border border-white/5 rounded-2xl p-8 text-center text-sm text-zinc-500">
              No posts shared yet.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {userPosts.map((post) => (
                <div
                  key={post._id}
                  className="group relative aspect-square rounded-xl overflow-hidden bg-zinc-900 border border-white/10"
                >
                  <img
                    src={post.img_url || post.image}
                    alt={post.caption}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {post.caption && (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-xs text-white line-clamp-2">{post.caption}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


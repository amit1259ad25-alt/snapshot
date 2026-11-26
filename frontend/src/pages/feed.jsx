import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function Feed() {
  const [posts, setPosts] = useState([]);
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  const fetchPosts = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/posts`);
      setPosts(res.data.posts || res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/posts/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      fetchPosts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-[#07070a] bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:24px_24px] text-zinc-100 p-6">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Top Navbar */}
        <div className="flex items-center justify-between bg-zinc-900/80 backdrop-blur-xl border border-white/10 px-5 py-3.5 rounded-2xl">
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              Feed
            </h1>
            {currentUser.name && (
              <p className="text-xs text-zinc-400">
                Hi, {currentUser.name}
                {currentUser.role === "admin" && (
                  <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-semibold">
                    Admin
                  </span>
                )}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/profile/${currentUser.id}`)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition cursor-pointer"
            >
              My Profile
            </button>
            <button
              onClick={() => navigate("/create")}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 transition cursor-pointer"
            >
              + Create Post
            </button>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-xl text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition cursor-pointer"
            >
              Logout
            </button>
          </div>
        </div>

        {/* All Posts List */}
        <div className="space-y-5">
          {posts.map((post) => {
            const authorName = post.user?.name || post.userName || "User";
            const authorUsername = post.user?.username || "member";
            const isAuthorAdmin = post.user?.role === "admin";
            const authorId = post.user?._id || post.user;

            const canDelete =
              currentUser.role === "admin" ||
              (currentUser.id &&
                (post.user?._id === currentUser.id ||
                  post.user === currentUser.id));

            return (
              <div
                key={post._id}
                className="bg-zinc-900/90 border border-white/10 rounded-2xl overflow-hidden shadow-xl"
              >
                {/* User Profile Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                  <div
                    onClick={() => authorId && navigate(`/profile/${authorId}`)}
                    className="flex items-center gap-2.5 cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-600 to-fuchsia-500 flex items-center justify-center text-xs font-bold uppercase text-white">
                      {authorName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-100 leading-tight flex items-center gap-2">
                        {authorName}
                        {isAuthorAdmin && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-semibold">
                            Admin
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-violet-400">
                        @{authorUsername}
                      </p>
                    </div>
                  </div>

                  {canDelete && (
                    <button
                      onClick={() => handleDelete(post._id)}
                      className="text-xs px-2.5 py-1 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>

                {/* Post Image */}
                <img
                  src={post.img_url || post.image}
                  alt={post.caption}
                  className="w-full h-auto max-h-[800px] object-cover bg-zinc-950"
                />

                {/* Caption */}
                {post.caption && (
                  <div className="p-4 text-sm text-zinc-200">
                    <span className="font-semibold text-white mr-2">
                      {authorName}
                    </span>
                    {post.caption}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

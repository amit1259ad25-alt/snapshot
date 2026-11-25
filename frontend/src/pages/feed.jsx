import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const DUMMY_POSTS = [
  {
    _id: "1",
    img_url:
      "https://unsplash.com",
    caption: "Beutiful scenery",
  },
];

const Feed = () => {
  const [posts, setPosts] = useState(DUMMY_POSTS);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editCaption, setEditCaption] = useState("");
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_API_URL}/posts`)
      .then((res) => {
        const list = res.data.posts || [];
        setPosts(list.length > 0 ? list.slice().reverse() : DUMMY_POSTS);
      })
      .catch(() => setPosts(DUMMY_POSTS))
      .finally(() => setLoading(false));
  }, []);

  const startEdit = (post) => {
    setEditingId(post._id);
    setEditCaption(post.caption || "");
  };

  const saveEdit = async (id) => {
    if (busyId) return;
    setBusyId(id);
    try {
      await axios.patch(`${import.meta.env.VITE_API_URL}/posts/${id}`, {
        caption: editCaption,
      });
      setPosts((prev) =>
        prev.map((p) => (p._id === id ? { ...p, caption: editCaption } : p))
      );
      setEditingId(null);
    } catch (err) {
      console.error("Update failed:", err);
      alert("Could not update caption.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id) => {
    if (busyId) return;
    setBusyId(id);
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/posts/${id}`);
      setPosts((prev) => {
        const next = prev.filter((p) => p._id !== id);
        return next.length > 0 ? next : DUMMY_POSTS;
      });
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Could not delete post.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#090d16] text-white">
      <header className="sticky top-0 z-20 bg-[#090d16]/85 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-md mx-auto px-4 py-3.5 flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-wide bg-gradient-to-r from-emerald-400 to-sky-400 bg-clip-text text-transparent">
            Feed
          </h1>
          <Link
            to="/create"
            className="px-4 py-1.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-sm font-bold rounded-full transition active:scale-95"
          >
            + Create Post
          </Link>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 flex flex-col gap-6">
        {loading
          ? Array.from({ length: 2 }).map((_, n) => (
              <div
                key={n}
                className="bg-slate-900/70 border border-slate-800 rounded-3xl overflow-hidden animate-pulse"
              >
                <div className="aspect-[4/5] w-full bg-slate-800" />
                <div className="p-4">
                  <div className="h-4 w-3/4 bg-slate-800 rounded" />
                </div>
              </div>
            ))
          : posts.map((post, idx) => {
              const imgSrc =
                post.img_url || post.image || post.imageUrl || post.url;
              const isDummy = post._id === "1";
              const isEditing = editingId === post._id;

              return (
                <article
                  key={post._id || idx}
                  className="bg-white text-slate-900 rounded-3xl overflow-hidden shadow-[0_20px_50px_-15px_rgba(0,0,0,0.75)]"
                >
                  {imgSrc && (
                    <div className="relative aspect-[4/5] w-full bg-slate-100 overflow-hidden">
                      <img
                        src={imgSrc}
                        alt={post.caption || "Post image"}
                        className="h-full w-full object-cover"
                      />

                      {!isDummy && (
                        <button
                          type="button"
                          onClick={() => handleDelete(post._id)}
                          disabled={busyId === post._id}
                          title="Remove post"
                          className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/65 hover:bg-red-600 text-white text-xs font-semibold backdrop-blur-md transition cursor-pointer disabled:opacity-50"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="w-3.5 h-3.5"
                          >
                            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                  )}

                  <div className="p-4">
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editCaption}
                          onChange={(e) => setEditCaption(e.target.value)}
                          onKeyDown={(e) =>
                            e.key === "Enter" && saveEdit(post._id)
                          }
                          autoFocus
                          className="flex-1 px-3 py-1.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:border-slate-900"
                        />
                        <button
                          type="button"
                          onClick={() => saveEdit(post._id)}
                          disabled={busyId === post._id}
                          className="px-3 py-1.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-bold rounded-xl cursor-pointer"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm sm:text-base font-medium text-slate-800 whitespace-pre-line break-words">
                          {post.caption || "No caption"}
                        </p>

                        {!isDummy && (
                          <button
                            type="button"
                            onClick={() => startEdit(post)}
                            title="Edit caption"
                            className="shrink-0 p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                          >
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="w-4 h-4"
                            >
                              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                              <path d="m15 5 4 4" />
                            </svg>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
      </main>
    </div>
  );
};

export default Feed;

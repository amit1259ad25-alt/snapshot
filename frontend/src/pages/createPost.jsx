import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const CreatePost = () => {
  const navigate = useNavigate();
  const [preview, setPreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [caption, setCaption] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [overTrash, setOverTrash] = useState(false);
  const [snapX, setSnapX] = useState(false);
  const [snapY, setSnapY] = useState(false);

  const boxRef = useRef(null);
  const imgRef = useRef(null);
  const trashRef = useRef(null);
  const fileRef = useRef(null);
  const gest = useRef({ d: 0, a: 0, mx: 0, my: 0, z: 1, r: 0 });
  const p = useRef({
    bW: 260,
    bH: 340,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    z: 1,
    tz: 1,
    rot: 0,
    trot: 0,
    fx: 0,
    fy: 0,
    drag: false,
    lx: 0,
    ly: 0,
  });

  const measure = () => {
    const r = boxRef.current?.getBoundingClientRect();
    const img = imgRef.current;
    if (!r || !img || !img.naturalWidth) return;
    const sc =
      Math.min(r.width / img.naturalWidth, r.height / img.naturalHeight) * 0.92;
    p.current.bW = img.naturalWidth * sc;
    p.current.bH = img.naturalHeight * sc;
    img.style.width = `${p.current.bW}px`;
    img.style.height = `${p.current.bH}px`;
  };

  useEffect(() => {
    if (!preview) return;
    measure();
    const ro = new ResizeObserver(measure);
    if (boxRef.current) ro.observe(boxRef.current);
    let id;
    const tick = () => {
      const s = p.current;
      const img = imgRef.current;
      if (img) {
        const nz = s.z + (s.tz - s.z) * 0.25;
        if (Math.abs(nz - s.z) > 0.0001) {
          const ratio = nz / s.z;
          s.x = s.fx - (s.fx - s.x) * ratio;
          s.y = s.fy - (s.fy - s.y) * ratio;
          s.z = nz;
        }
        s.rot += (s.trot - s.rot) * 0.25;
        if (!s.drag) {
          s.x += s.vx;
          s.y += s.vy;
          s.vx *= 0.86;
          s.vy *= 0.86;
        }
        img.style.transform = `translate3d(${s.x}px,${s.y}px,0) rotate(${s.rot}deg) scale(${s.z})`;
      }
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(id);
      ro.disconnect();
    };
  }, [preview]);

  const onFile = (e) => {
    const file = e.target.files?.item(0);
    if (!file) return;
    Object.assign(p.current, {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      z: 1,
      tz: 1,
      rot: 0,
      trot: 0,
    });
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
    setOverTrash(false);
  };

  const reset = () => {
    setPreview(null);
    setImageFile(null);
    setDragging(false);
    setOverTrash(false);
    setSnapX(false);
    setSnapY(false);
    p.current.drag = false;
    if (fileRef.current) fileRef.current.value = "";
  };
  const renderBlob = () =>
    new Promise((res) => {
      const img = imgRef.current,
        box = boxRef.current;
      if (!img || !box) return res(imageFile);
      const c = document.createElement("canvas");
      c.width = 1080;
      c.height = 1350;
      const ctx = c.getContext("2d");
      ctx.save();
      ctx.filter = "blur(40px) brightness(0.65)";
      const bSc =
        Math.max(c.width / img.naturalWidth, c.height / img.naturalHeight) *
        1.15;
      ctx.drawImage(
        img,
        (c.width - img.naturalWidth * bSc) / 2,
        (c.height - img.naturalHeight * bSc) / 2,
        img.naturalWidth * bSc,
        img.naturalHeight * bSc,
      );
      ctx.restore();
      const r = box.getBoundingClientRect(),
        rx = c.width / r.width,
        ry = c.height / r.height;
      const { bW, bH, x, y, z, rot } = p.current;
      ctx.save();
      ctx.translate(c.width / 2 + x * rx, c.height / 2 + y * ry);
      ctx.rotate((rot * Math.PI) / 180);
      ctx.scale(z, z);
      ctx.drawImage(img, (-bW * rx) / 2, (-bH * ry) / 2, bW * rx, bH * ry);
      ctx.restore();
      c.toBlob((b) => res(b || imageFile), "image/jpeg", 0.9);
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageFile || submitting) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("image", await renderBlob(), "story.jpg");
      fd.append("caption", caption);
      await axios.post(`${import.meta.env.VITE_API_URL}/posts`, fd, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      navigate("/feed");
    } catch (err) {
      console.error(err);
      alert("Could not create post.");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const onWheel = (e) => {
      if (!preview) return;
      e.preventDefault();
      const r = box.getBoundingClientRect(),
        s = p.current;
      if (e.ctrlKey) {
        s.fx = e.clientX - r.left - r.width / 2;
        s.fy = e.clientY - r.top - r.height / 2;
        s.tz = Math.min(4, Math.max(0.35, s.tz * Math.exp(-e.deltaY * 0.012)));
      } else {
        s.x -= e.deltaX;
        s.y -= e.deltaY;
        setSnapX(Math.abs(s.x) < 6);
        setSnapY(Math.abs(s.y) < 6);
      }
    };
    box.addEventListener("wheel", onWheel, { passive: false });
    return () => box.removeEventListener("wheel", onWheel);
  }, [preview]);

  const hitTrash = (cx, cy) => {
    const r = trashRef.current?.getBoundingClientRect();
    return (
      r &&
      cx >= r.left - 16 &&
      cx <= r.right + 16 &&
      cy >= r.top - 16 &&
      cy <= r.bottom + 16
    );
  };

  const startDrag = (cx, cy) => {
    Object.assign(p.current, { drag: true, vx: 0, vy: 0, lx: cx, ly: cy });
    setDragging(true);
  };

  const moveDrag = (cx, cy) => {
    const s = p.current;
    if (!s.drag) return;
    const dx = cx - s.lx,
      dy = cy - s.ly;
    s.lx = cx;
    s.ly = cy;
    s.vx = s.vx * 0.4 + dx * 0.6;
    s.vy = s.vy * 0.4 + dy * 0.6;
    setOverTrash(hitTrash(cx, cy));
    s.x += dx;
    s.y += dy;
    setSnapX(Math.abs(s.x) < 6);
    setSnapY(Math.abs(s.y) < 6);
  };

  const endDrag = (cx, cy) => {
    if (!p.current.drag) return;
    p.current.drag = false;
    setDragging(false);
    setSnapX(false);
    setSnapY(false);
    if (hitTrash(cx, cy)) return reset();
    setOverTrash(false);
  };

  useEffect(() => {
    if (!dragging) return;
    const onM = (e) => moveDrag(e.clientX, e.clientY),
      onU = (e) => endDrag(e.clientX, e.clientY);
    window.addEventListener("mousemove", onM);
    window.addEventListener("mouseup", onU);
    return () => {
      window.removeEventListener("mousemove", onM);
      window.removeEventListener("mouseup", onU);
    };
  }, [dragging]);
  const onTouchStart = (e) => {
    if (!preview) return;
    if (e.touches.length === 2) {
      p.current.drag = false;
      const t0 = e.touches.item(0),
        t1 = e.touches.item(1);
      gest.current = {
        d: Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY),
        a: Math.atan2(t1.clientY - t0.clientY, t1.clientX - t0.clientX),
        mx: (t0.clientX + t1.clientX) / 2,
        my: (t0.clientY + t1.clientY) / 2,
        z: p.current.tz,
        r: p.current.trot,
      };
    } else if (e.touches.length === 1)
      startDrag(e.touches.item(0).clientX, e.touches.item(0).clientY);
  };

  const onTouchMove = (e) => {
    if (!preview) return;
    if (e.touches.length === 2 && boxRef.current) {
      const t0 = e.touches.item(0),
        t1 = e.touches.item(1),
        r = boxRef.current.getBoundingClientRect();
      const s = p.current,
        g = gest.current;
      const midX = (t0.clientX + t1.clientX) / 2,
        midY = (t0.clientY + t1.clientY) / 2;
      s.x += midX - g.mx;
      s.y += midY - g.my;
      g.mx = midX;
      g.my = midY;
      s.fx = midX - r.left - r.width / 2;
      s.fy = midY - r.top - r.height / 2;
      const d = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
      const a = Math.atan2(t1.clientY - t0.clientY, t1.clientX - t0.clientX);
      if (g.d > 0) {
        s.tz = Math.min(4, Math.max(0.35, g.z * (d / g.d)));
        s.trot = g.r + ((a - g.a) * 180) / Math.PI;
      }
    } else if (e.touches.length === 1)
      moveDrag(e.touches.item(0).clientX, e.touches.item(0).clientY);
  };

  const boxCls = preview
    ? "bg-slate-900 cursor-grab"
    : "bg-[#bbb8bb] cursor-pointer";
  const delCls = dragging
    ? overTrash
      ? "w-12 h-12 bg-red-600 text-white"
      : "w-10 h-10 bg-red-500 text-white"
    : "w-8 h-8 bg-black/60 text-white";

  return (
    <div className="relative  h-screen bg-linear-to-r from-pink-500 via-purple-300 to-blue-700 w-full flex justify-center items-center p-4 overflow-hidden">
      <button
        type="button"
        onClick={() => {
          reset();
          navigate("/feed");
        }}
        className="absolute top-5 left-5 z-20 flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/15 text-sm font-semibold cursor-pointer"
      >
        <span>← discard</span>
      </button>

      <div className="relative z-10 w-full max-w-sm bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-2xl capitalize flex flex-col overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.75)]">
        <div className="flex justify-center items-center py-3 px-4 bg-slate-900 text-white">
          <h1 className=" bg-linear-to-r from-green-600 via-cyan-500 to-blue-700 text-transparent bg-clip-text font-bold text-2xl">
            Create Post
          </h1>
        </div>

        <div className="p-4 font-bold">
          <div
            ref={boxRef}
            onClick={() => !preview && fileRef.current?.click()}
            onMouseDown={(e) => {
              if (preview) {
                e.preventDefault();
                startDrag(e.clientX, e.clientY);
              }
            }}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={(e) =>
              e.touches.length === 0 &&
              endDrag(
                e.changedTouches.item(0)?.clientX || 0,
                e.changedTouches.item(0)?.clientY || 0,
              )
            }
            className={`relative aspect-[4/5] w-full mb-4 border-2 rounded-2xl flex items-center justify-center overflow-hidden select-none touch-none ${boxCls}`}
          >
            {preview ? (
              <>
                <img
                  src={preview}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover scale-125 blur-2xl brightness-75 pointer-events-none"
                />
                <img
                  ref={imgRef}
                  src={preview}
                  alt="Preview"
                  onLoad={measure}
                  draggable={false}
                  style={{ opacity: overTrash ? 0.45 : 1 }}
                  className="relative z-10 max-w-none max-h-none rounded-xl shadow-2xl pointer-events-none"
                />
                <div
                  className={`absolute inset-0 z-20 pointer-events-none grid grid-cols-3 grid-rows-3 transition-opacity duration-150 ${dragging ? "opacity-100" : "opacity-0"}`}
                >
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div
                      key={i}
                      className="border-r border-b border-white/40 shadow-[inset_0_0_1px_rgba(0,0,0,0.35)]"
                    />
                  ))}
                </div>
                {snapX && (
                  <div className="absolute inset-y-0 left-1/2 w-0.5 bg-sky-400 z-20 pointer-events-none" />
                )}
                {snapY && (
                  <div className="absolute inset-x-0 top-1/2 h-0.5 bg-sky-400 z-20 pointer-events-none" />
                )}
                <div
                  onMouseDown={(e) => e.stopPropagation()}
                  className="absolute top-2.5 right-2.5 z-20 flex gap-1.5"
                >
                  <button
                    type="button"
                    onClick={() => (p.current.trot -= 15)}
                    className="px-2 py-1 rounded-full bg-black/60 text-white text-xs cursor-pointer"
                  >
                    ↺
                  </button>
                  <button
                    type="button"
                    onClick={() => (p.current.trot += 15)}
                    className="px-2 py-1 rounded-full bg-black/60 text-white text-xs cursor-pointer"
                  >
                    ↻
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      Object.assign(p.current, {
                        x: 0,
                        y: 0,
                        vx: 0,
                        vy: 0,
                        tz: 1,
                        trot: 0,
                      })
                    }
                    className="px-2 py-1 rounded-full bg-black/60 text-white text-[10px] uppercase cursor-pointer"
                  >
                    Fit
                  </button>
                </div>
                <button
                  ref={trashRef}
                  type="button"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    reset();
                  }}
                  className={`absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center justify-center rounded-full shadow-md cursor-pointer ${delCls}`}
                >
                  🗑
                </button>
              </>
            ) : (
              <span>Click To Select An Image</span>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <input
              ref={fileRef}
              name="image"
              type="file"
              accept="image/*"
              onChange={onFile}
              hidden
            />
            <textarea
              name="caption"
              rows="2"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Enter the caption here .."
              className=" bg-white w-full p-2.5 text-sm border rounded-xl mb-4 resize-none focus:outline-none"
            />
            <button
              type="submit"
              disabled={!imageFile || submitting}
              className="w-full py-2.5 bg-linear-to-r bg-emerald-600 disabled:opacity-50 border-2 active:scale-95 rounded-full font-bold cursor-pointer"
            >
              {submitting ? "posting..." : "submit"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreatePost;

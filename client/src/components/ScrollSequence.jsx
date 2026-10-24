import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

// Register ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

// Eagerly resolve dynamic asset imports using Vite
const frameModules = import.meta.glob("../assets/frames/*.jpg", { eager: true });
const framePaths = Object.keys(frameModules).sort();
const imageUrls = framePaths.map((path) => frameModules[path].default || frameModules[path]);

// Reveal the page as soon as this many frames are usable instead of
// blocking on the full 192-frame download. The rest keep loading silently.
const REVEAL_AFTER = 12;

// Cap canvas pixel density. Full devicePixelRatio (2-3x on phones) makes
// every scroll frame an expensive multi-megapixel canvas draw - the main
// source of the laggy feel. 1.5 stays sharp while roughly halving that cost.
const MAX_DPR = 1.5;

/**
 * Helper to draw image on canvas with 'cover' scaling (similar to CSS background-size: cover)
 */
const drawImageProp = (ctx, img, x = 0, y = 0, w = ctx.canvas.width, h = ctx.canvas.height, rOffset = 0.5, cOffset = 0.5) => {
  if (!img) return;

  const iw = img.width;
  const ih = img.height;
  const r = Math.min(w / iw, h / ih);
  let nw = iw * r;
  let nh = ih * r;
  let cx, cy, cw, ch;

  if (nw < w) {
    const r2 = w / nw;
    nw *= r2;
    nh *= r2;
  }
  if (nh < h) {
    const r2 = h / nh;
    nw *= r2;
    nh *= r2;
  }

  const ar = w / h;
  const iar = iw / ih;

  if (iar > ar) {
    cw = ih * ar;
    ch = ih;
    cx = (iw - cw) * rOffset;
    cy = 0;
  } else {
    cw = iw;
    ch = iw / ar;
    cx = 0;
    cy = (ih - ch) * cOffset;
  }

  ctx.drawImage(img, cx, cy, cw, ch, x, y, w, h);
};

const ScrollSequence = () => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const loadedImagesRef = useRef([]);
  const loadedCountRef = useRef(0);
  const lastDrawnRef = useRef(-1);
  const rafPendingRef = useRef(false);

  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState(0);

  // 1. Progressive preload: reveal after the first frames arrive, keep
  //    loading the remainder in the background.
  useEffect(() => {
    const totalFrames = imageUrls.length;
    if (totalFrames === 0) {
      setReady(true);
      return;
    }

    const preloadedImages = new Array(totalFrames);
    let revealed = false;

    imageUrls.forEach((url, index) => {
      const img = new Image();
      img.decoding = "async";
      img.src = url;

      const handleLoad = () => {
        loadedCountRef.current += 1;
        setProgress(Math.round((loadedCountRef.current / totalFrames) * 100));

        if (!revealed && loadedCountRef.current >= Math.min(REVEAL_AFTER, totalFrames)) {
          revealed = true;
          setReady(true);
        }
      };

      img.onload = handleLoad;
      img.onerror = handleLoad;
      preloadedImages[index] = img;
    });

    loadedImagesRef.current = preloadedImages;

    return () => {
      preloadedImages.forEach((img) => {
        if (img) {
          img.onload = null;
          img.onerror = null;
        }
      });
    };
  }, []);

  // 2. Setup GSAP Canvas Scroll trigger
  useEffect(() => {
    if (!ready || loadedImagesRef.current.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    // Draw the nearest fully-decoded frame at or below the target index,
    // so scrubbing never blanks while later frames are still downloading.
    const drawFrame = (frameIndex) => {
      const imgs = loadedImagesRef.current;
      let img = null;
      for (let i = Math.min(frameIndex, imgs.length - 1); i >= 0; i--) {
        if (imgs[i] && imgs[i].complete && imgs[i].naturalWidth > 0) {
          img = imgs[i];
          break;
        }
      }
      if (!img) {
        for (let i = frameIndex + 1; i < imgs.length; i++) {
          if (imgs[i] && imgs[i].complete && imgs[i].naturalWidth > 0) {
            img = imgs[i];
            break;
          }
        }
      }
      if (!img) return;
      lastDrawnRef.current = frameIndex;
      drawImageProp(context, img, 0, 0, window.innerWidth, window.innerHeight);
    };

    // High-DPI resizing helper (density capped for smooth drawing)
    const resizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";

      // Redraw current frame
      drawFrame(Math.round(imageSeq.frame));
    };

    const imageSeq = { frame: 0 };
    const frameCount = loadedImagesRef.current.length;

    // Set initial frame & subscribe resize listener
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Frame update scrub timeline
    const bgTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.5,
        onUpdate: () => {
          const frameIndex = Math.round(imageSeq.frame);
          // Skip redundant draws and coalesce to one draw per animation frame
          if (frameIndex === lastDrawnRef.current || rafPendingRef.current) return;
          rafPendingRef.current = true;
          requestAnimationFrame(() => {
            rafPendingRef.current = false;
            drawFrame(Math.round(imageSeq.frame));
          });
        },
      },
    });

    bgTimeline.to(imageSeq, {
      frame: frameCount - 1,
      snap: "frame",
      ease: "none",
    });

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      bgTimeline.kill();
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, [ready]);

  // 3. Setup Lenis smooth scrolling & GSAP integration
  useEffect(() => {
    if (!ready) return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // standard expo ease
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 2.0,
    });

    // Update ScrollTrigger on Lenis scroll
    lenis.on("scroll", ScrollTrigger.update);

    // Sync Lenis frame updates with GSAP global ticker
    const gsapTicker = (time) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(gsapTicker);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(gsapTicker);
      lenis.destroy();
    };
  }, [ready]);

  return (
    <div ref={containerRef} className="relative w-full min-h-[400vh] bg-black">
      {/* Absolute minimal loader label - only until the first frames are usable */}
      {!ready && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950 text-zinc-400 text-xs font-semibold uppercase tracking-widest">
          Loading Sequences ({progress}%)
        </div>
      )}

      {/* Full-screen fixed canvas background */}
      <canvas
        ref={canvasRef}
        className={`fixed inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
          ready ? "opacity-100" : "opacity-0"
        } z-0 pointer-events-none`}
      />
    </div>
  );
};

export default ScrollSequence;

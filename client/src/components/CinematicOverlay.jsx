import React, { useEffect, useState } from "react";

const CinematicOverlay = () => {
  const [scrollProgress, setScrollProgress] = useState(0);

  // High-performance scroll tracking for organic depth shifting on scroll
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          // Calculate scroll progress over 1.5 screen heights
          const maxScrollHeight = window.innerHeight * 1.5;
          const currentScroll = window.scrollY;
          setScrollProgress(Math.min(currentScroll / maxScrollHeight, 1));
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Calculate dynamic values based on scroll progress
  const glowOpacity = Math.max(1 - scrollProgress * 1.2, 0); // Fades faster to black as we scroll down
  const vignetteIntensity = 0.9 + scrollProgress * 0.1; // Deepens from 90% to 100% black edges
  const goldShiftY = scrollProgress * 100; // Drifts downward on scroll

  return (
    <div className="absolute top-0 left-0 w-full pointer-events-none overflow-hidden z-10" style={{ height: "400vh" }}>
      
      {/* LAYER 1: DEEP LUXURY BLACK BASE MAP */}
      <div className="absolute inset-0 bg-black/40 z-[1]" />

      {/* LAYER 2: LAYERED RADIAL GOLDEN GLOWS (CENTER-UPPER ILLUMINATION) */}
      <div 
        className="absolute inset-0 z-[2] transition-transform duration-300 ease-out"
        style={{
          opacity: glowOpacity,
          transform: `translateY(${goldShiftY * 0.15}px)`
        }}
      >
        {/* Soft, wide ambient amber/gold glow */}
        <div 
          className="absolute inset-0"
          style={{
            background: `radial-gradient(
              circle at 50% 42%, 
              rgba(200, 164, 93, 0.15) 0%, 
              rgba(163, 126, 51, 0.05) 40%, 
              rgba(0, 0, 0, 0) 75%
            )`
          }}
        />

        {/* Brighter warm brass focal hotspot (breathing pulse effect) */}
        <div 
          className="absolute inset-0 animate-glow-pulse"
          style={{
            background: `radial-gradient(
              circle at 50% 38%, 
              rgba(255, 225, 160, 0.18) 0%, 
              rgba(200, 164, 93, 0.04) 25%, 
              rgba(0, 0, 0, 0) 55%
            )`
          }}
        />

        {/* Vertical volumetric glow column simulating a projector/ambient beam */}
        <div 
          className="absolute inset-x-0 top-0 h-[70%] opacity-40"
          style={{
            background: `radial-gradient(
              ellipse at 50% 0%, 
              rgba(200, 164, 93, 0.08) 0%, 
              rgba(0, 0, 0, 0) 65%
            )`
          }}
        />
      </div>

      {/* LAYER 3: ATMOSPHERIC DRIFTING LIGHT ORBS (3D DEPTH) */}
      <div 
        className="absolute inset-0 z-[3]"
        style={{ opacity: glowOpacity }}
      >
        {/* Soft glowing ambient gold orb 1 */}
        <div className="absolute w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-amber-500/5 to-transparent blur-[120px] top-[15%] left-[5%] animate-float-slow pointer-events-none" />

        {/* Soft glowing ambient gold orb 2 */}
        <div className="absolute w-[600px] h-[600px] rounded-full bg-gradient-to-br from-[#C8A45D]/4 to-transparent blur-[140px] bottom-[20%] right-[5%] animate-float-medium pointer-events-none" />

        {/* Soft glowing ambient gold orb 3 */}
        <div className="absolute w-[400px] h-[400px] rounded-full bg-gradient-to-t from-amber-600/3 to-transparent blur-[100px] top-[50%] left-[40%] animate-float-reverse pointer-events-none" />
      </div>

      {/* LAYER 4: PREMIUM DEEP MOVIE-POSTER VIGNETTE */}
      <div 
        className="absolute inset-0 z-[4]"
        style={{
          background: `radial-gradient(
            circle at 50% 42%, 
            rgba(0, 0, 0, 0) 15%, 
            rgba(0, 0, 0, 0.35) 45%, 
            rgba(0, 0, 0, 0.8) 72%, 
            rgba(0, 0, 0, ${vignetteIntensity}) 100%
          )`
        }}
      />

      {/* ADDITIONAL CORNER-WEIGHTED BLACK VIGNETTING */}
      <div className="absolute inset-0 z-[4] shadow-[inset_0_0_120px_rgba(0,0,0,0.95)]" />

      {/* LAYER 5: DYNAMIC CINEMATIC FILM GRAIN (ADDS TEXTURE) */}
      <div className="absolute inset-0 z-[5] cinematic-grain" />

      {/* LAYER 6: EDITORIAL TOP & BOTTOM SHADOW BARRIERS */}
      <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black via-black/60 to-transparent z-[6]" />
      <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-black via-black/80 to-transparent z-[6]" />

    </div>
  );
};

export default CinematicOverlay;

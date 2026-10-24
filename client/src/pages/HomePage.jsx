import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ScrollSequence from "../components/ScrollSequence";
import CinematicOverlay from "../components/CinematicOverlay";
import StatueHotspots from "../components/StatueHotspots";
import Auth from "../components/Auth";
import useAuthStore from "../store/useAuthStore";
import { PreviewDemoModal } from "../components/PreviewDemoModal";
import LandingSections from "../components/LandingSections";

const HomePage = () => {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showAuth, setShowAuth] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  // Smooth scroll tracking to fade out/translate text elements as the user scrolls down
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const maxScrollHeight = window.innerHeight * 0.75;
          setScrollProgress(Math.min(window.scrollY / maxScrollHeight, 1));
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Compute text fade & transform
  const contentOpacity = Math.max(1 - scrollProgress * 1.3, 0);
  const contentTranslateY = -scrollProgress * 60; // Smooth parallax-like lift

  return (
    <div className="bg-black min-h-screen text-white overflow-hidden relative">

      {/* 1. Dynamic Canvas Background Sequence */}
      <ScrollSequence />

      {/* 1b. Presentable content sections after the scroll sequence */}
      <LandingSections
        onGetStarted={() => {
          if (isAuthenticated) {
            navigate("/workspace");
          } else {
            setShowAuth(true);
          }
        }}
        onPreviewDemo={() => setShowDemo(true)}
      />

      {/* 2. Premium Layered Cinematic Overlay */}
      <CinematicOverlay />

      {/* Statue Interactive Pointers Overlay */}
      {!showAuth && (
        <StatueHotspots />
      )}


      {/* 3. Editorial Front-Facing Hero Content */}
      <div
        className="fixed inset-0 z-20 flex items-center pointer-events-none transition-all duration-300 ease-out"
        style={{
          opacity: contentOpacity,
          transform: `translateY(${contentTranslateY}px)`,
        }}
      >
        {!showAuth && (
          <div className="max-w-7xl mx-auto w-full px-8 md:px-20 mt-5">
          <div className=" max-w-3xl">


            {/* Premium Gold scales + neural network vector SVG & Brand title */}
            <div className="mb-10 flex items-center gap-4">
              <div className="relative group">
                {/* SVG scale logo wrapper with warm gold dropshadow */}
                <div className="absolute inset-0 bg-[#C8A45D]/20 rounded-full blur-md opacity-75 group-hover:opacity-100 transition-opacity duration-500" />
                <svg
                  className="w-12 h-12 text-[#C8A45D] relative z-10"
                  viewBox="0 0 100 100"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Central Axis Pillar */}
                  <path
                    d="M50 22V78M50 78H64M50 78H36"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M50 26C52.2091 26 54 24.2091 54 22C54 19.7909 52.2091 18 50 18C47.7909 18 46 19.7909 46 22C46 24.2091 47.7909 26 50 26Z"
                    fill="currentColor"
                  />

                  {/* Crossbeam */}
                  <path
                    d="M24 35C35 31 65 31 76 35"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />

                  {/* Outer Neural Weights */}
                  <circle cx="24" cy="35" r="4.5" fill="#000" stroke="currentColor" strokeWidth="2.5" />
                  <circle cx="76" cy="35" r="4.5" fill="#000" stroke="currentColor" strokeWidth="2.5" />
                  <circle cx="50" cy="33" r="3" fill="currentColor" />

                  {/* Left Scale Bowl and Suspensions */}
                  <path
                    d="M16 58C16 58 20 62 24 62C28 62 32 58 32 58"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M24 35L16 58M24 35L32 58"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeDasharray="3 3"
                  />

                  {/* Right Scale Bowl and Suspensions */}
                  <path
                    d="M68 58C68 58 72 62 76 62C80 62 84 58 84 58"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M76 35L68 58M76 35L84 58"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeDasharray="3 3"
                  />

                  {/* Neural Interconnecting Vectors */}
                  <path
                    d="M50 42L24 35M50 42L76 35M50 42L50 68"
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeOpacity="0.4"
                  />
                  <circle cx="50" cy="42" r="2.5" fill="#C8A45D" />
                </svg>
              </div>

              <span className="text-[#C8A45D] text-lg font-display tracking-[0.45em] uppercase font-semibold">
                NyayVivek
              </span>
            </div>

            {/* Editorial Heading: Playful and High-Contrast Typography */}
            <h1
              className="
                font-serif
                text-white
                text-3xl
                md:text-5xl
                lg:text-6xl
                leading-[1.05]
                
                tracking-tighter
                
              "
            >
              Turning Evidence Into
              <br />
              Legal Insight

              <span className="font-normal ml-4 font-serif text-[#C8A45D] bg-gradient-to-r from-[#DFBA73] via-[#C8A45D] to-[#A28242] bg-clip-text text-transparent">
                NyayVivek
              </span>
            </h1>

            {/* Sleek, wide description */}
            <p
              className="
                mt-6
                text-zinc-400
                text-sm
                md:text-base
                leading-relaxed
                tracking-wide
                max-w-2xl
                font-light
                font-sans
              "
            >
              An advanced AI-powered assistant for analyzing case documents, mapping connected evidence, and searching similar past legal judgments.
            </p>

            {/* Interactive Luxury CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-5 mt-10 w-full sm:w-auto">

              {/* PRIMARY GOLD GLOW BUTTON */}
              <button
                className="
                  btn-gold-glow
                  px-8
                  py-4.5
                  rounded-full
                  bg-[#C8A45D]
                  text-black
                  font-semibold
                  text-xs
                  uppercase
                  tracking-[0.25em]
                  transition-all
                  duration-500
                  hover:scale-[1.03]
                  hover:shadow-[0_0_35px_rgba(200,164,93,0.45)]
                  pointer-events-auto
                  cursor-pointer
                "
                onClick={() => {
                  if (isAuthenticated) {
                    navigate("/workspace");
                  } else {
                    setShowAuth(true);
                  }
                }}
              >
                Get Started
              </button>

              {/* SECONDARY BACKDROP BLUR BUTTON */}
              <button
                onClick={() => setShowDemo(true)}
                className="
                  px-8
                  py-4.5
                  rounded-full
                  border
                  border-[#C8A45D]/40
                  text-[#C8A45D]
                  backdrop-blur-md
                  bg-[#C8A45D]/5
                  text-xs
                  uppercase
                  tracking-[0.25em]
                  font-semibold
                  transition-all
                  duration-500
                  
                  hover:scale-[1.03]
                  pointer-events-auto
                  cursor-pointer
                "
              >
                Preview Demo
              </button>
            </div>
          </div>
        </div>
        )}
        {showAuth && (
          <Auth setShowLogin={setShowAuth} />
        )}
        
      </div>

      {/* 4. Peripheral HUD Editorial Elements (Movie Poster feel) */}
      <div
        className="fixed top-10 right-10 z-20 pointer-events-none text-right hidden md:block transition-opacity duration-300"
        style={{ opacity: contentOpacity }}
      >
        <span className="text-[9px] uppercase tracking-[0.3em] text-[#C8A45D] font-medium block">
          AI ASSISTANT
        </span>
        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-1 block">
          SECURE & ENCRYPTED
        </span>
      </div>

      <div
        className="fixed bottom-10 right-10 z-20 pointer-events-none text-right hidden md:flex items-center transition-opacity duration-300"
        style={{ opacity: contentOpacity }}
      >
        {/* Desktop Nav Links */}
        <nav className="flex items-center gap-6 text-[9px] font-mono tracking-[0.2em] text-zinc-400">
          <a href="#synthesis" className="hover:text-white transition-colors pointer-events-auto">EVIDENCE MAP</a>
          <a href="#indexing" className="hover:text-white transition-colors pointer-events-auto">SEARCH CASES</a>
          <button 
            onClick={() => navigate("/dashboard")}
            className="hover:text-[#C8A45D] text-[9px] font-mono tracking-[0.2em] transition-colors cursor-pointer text-zinc-400 uppercase font-semibold pointer-events-auto"
          >
            DASHBOARD
          </button>
          <button 
            onClick={() => navigate("/workspace")}
            className="hover:text-[#C8A45D] text-[9px] font-mono tracking-[0.2em] transition-colors cursor-pointer text-zinc-400 uppercase font-semibold pointer-events-auto"
          >
            WORKSPACE
          </button>
        </nav>
      </div>

      {/* Scroll Down Indicator */}
      <div
        className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 pointer-events-none flex flex-row items-center gap-3 transition-opacity duration-300"
        style={{ opacity: contentOpacity }}
      >
        <span className="text-[10px] uppercase tracking-[0.25em] text-zinc-300 font-medium block text-center">
          SCROLL DOWN TO SCRUB
        </span>
        <div className="flex flex-col gap-1 items-center animate-bounce">
          <span className="w-1.5 h-1.5 rounded-full bg-[#C8A45D]" />
          <span className="w-1 h-3 rounded-full bg-[#C8A45D]/40" />
        </div>
      </div>



      <PreviewDemoModal
        isOpen={showDemo}
        onClose={() => setShowDemo(false)}
        onGetStarted={() => {
          setShowDemo(false);
          if (isAuthenticated) {
            navigate("/workspace");
          } else {
            setShowAuth(true);
          }
        }}
      />
    </div>
  );
};

export default HomePage;

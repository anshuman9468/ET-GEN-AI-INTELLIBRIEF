import React from "react";
import { AbsoluteFill, Sequence, Audio, Video } from "remotion";

// Helper for professional text card
const HeadlineCard = ({ text }) => {
  return (
    <div style={{
      position: "absolute",
      top: "15%",
      left: "6%",
      width: "55%", // Limit width so it doesn't overlap the avatar
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      padding: "45px 50px",
      backgroundColor: "rgba(10, 15, 30, 0.85)", // Sleek dark translucent
      borderLeft: "8px solid #E63946", // News red accent
      boxShadow: "20px 20px 50px rgba(0,0,0,0.6)",
      backdropFilter: "blur(12px)",
      minHeight: "180px",
      zIndex: 10
    }}>
      <h1 style={{
        color: "#ffffff",
        fontSize: "40px",
        fontWeight: "800",
        textAlign: "left",
        lineHeight: "1.35",
        margin: 0,
        textShadow: "0 4px 10px rgba(0,0,0,0.8)",
        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
        letterSpacing: "0.5px"
      }}>
        {text}
      </h1>
    </div>
  );
};

// Main video composition
export const NewsVideo = ({ 
  scenes = [], 
  persona = "Investor", 
  audioUrl, 
  sceneAudio = [] 
}) => {
  const FPS = 30;
  
  // Calculate frames for each scene for perfect sync
  let currentFrameOffset = 0;
  const processedScenes = (sceneAudio && sceneAudio.length > 0) 
    ? sceneAudio.map((segment) => {
        const start = currentFrameOffset;
        const durationByAudio = Math.ceil(segment.duration * FPS);
        currentFrameOffset += durationByAudio;
        return {
          ...segment,
          startFrame: start,
          durationFrames: durationByAudio
        };
      })
    : scenes.map((text, i) => {
        const d = 5 * FPS;
        return {
          text: typeof text === "string" ? text : text.text,
          startFrame: i * d,
          durationFrames: d
        };
      });

  return (
    <AbsoluteFill style={{ 
      backgroundColor: "#050914", 
      overflow: "hidden",
      fontFamily: "'Helvetica Neue', system-ui, sans-serif"
    }}>
      {/* 1. Dynamic Background Grid Pattern */}
      <div style={{
        position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
        background: "radial-gradient(ellipse at center, #112240 0%, #050914 100%)"
      }} />
      <div style={{
        position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
        backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
        backgroundSize: "60px 60px",
        opacity: 0.6
      }} />

      {/* 2. Top Header Highlight */}
      <div style={{
        position: "absolute", top: 0, left: 0, width: "100%", height: "6px",
        background: "linear-gradient(90deg, #E63946, #F4A261, #E63946)" 
      }} />

      {/* 3. INTELLIBRIEF Logo - Top Right */}
      <div style={{
        position: "absolute", top: "35px", right: "50px",
        display: "flex", flexDirection: "column", alignItems: "flex-end", zIndex: 100
      }}>
        <div style={{
          backgroundColor: "#E63946",
          color: "white",
          padding: "10px 24px",
          fontWeight: "900",
          fontSize: "26px",
          letterSpacing: "3px",
          boxShadow: "0 10px 20px rgba(0,0,0,0.4)",
          borderRadius: "4px"
        }}>
          INTELLIBRIEF
        </div>
        <div style={{
          backgroundColor: "#ffffff",
          color: "#050914",
          padding: "4px 16px",
          marginTop: "6px",
          fontWeight: "800",
          fontSize: "14px",
          letterSpacing: "2px",
          textTransform: "uppercase",
          borderRadius: "4px",
          boxShadow: "0 5px 10px rgba(0,0,0,0.3)",
        }}>
          {persona} EDITION
        </div>
      </div>

      {/* 4. The Headlines - Synced to Audio segments */}
      {processedScenes.map((scene, i) => (
        <Sequence
          key={i}
          from={scene.startFrame}
          durationInFrames={scene.durationFrames}
        >
          {scene.dataUri && <Audio src={scene.dataUri} />}
          <HeadlineCard text={scene.text} />
        </Sequence>
      ))}

      {/* 5. Bottom Ticker Bar */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, width: "100%", height: "70px",
        backgroundColor: "#ffffff",
        display: "flex", alignItems: "center",
        boxShadow: "0 -10px 30px rgba(0,0,0,0.6)", zIndex: 40
      }}>
        {/* Slanted Breaking News tag */}
        <div style={{
          backgroundColor: "#E63946", height: "100%", padding: "0 40px 0 20px",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "white", fontWeight: "900", fontSize: "20px", letterSpacing: "2px",
          clipPath: "polygon(0 0, 100% 0, 85% 100%, 0 100%)",
          minWidth: "220px"
        }}>
          LATEST ALERTS
        </div>
        <div style={{
          flex: 1, padding: "0 20px", color: "#111", fontSize: "18px", fontWeight: "700",
          letterSpacing: "1px", textTransform: "uppercase"
        }}>
          • MARKET UPDATE • STAY TUNED FOR MORE AI-GENERATED INSIGHTS •
        </div>
      </div>

      {/* 6. Avatar Talking Video Overlay (Looping) */}
      <Video
        src="http://localhost:5000/videos/avatar.mp4"
        style={{
          position: "absolute",
          bottom: 70, // Flush against the ticker
          right: 50,
          width: 320, // Slightly bigger, perfect size for desk anchor
          borderTopLeftRadius: "12px",
          borderTopRightRadius: "12px",
          borderTop: "6px solid #E63946", // News room accent
          borderLeft: "2px solid rgba(255, 255, 255, 0.2)",
          borderRight: "2px solid rgba(255, 255, 255, 0.2)",
          boxShadow: "-15px -15px 40px rgba(0, 0, 0, 0.5)",
          zIndex: 50
        }}
        muted={true}
        loop
      />

    </AbsoluteFill>
  );
};


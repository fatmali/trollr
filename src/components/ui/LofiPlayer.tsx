"use client";

import React, { useEffect, useRef, useState } from "react";
import { useLofiStore, LOFI_STATIONS } from "@/hooks/useLofiStore";

// No need to define stations here as they're imported from the store

interface LofiPlayerProps {
  minimal?: boolean;
  className?: string;
}

const MusicWaveAnimation = () => (
  <div className="music-wave-animation ml-1">
    <span className="bar"></span>
    <span className="bar"></span>
    <span className="bar"></span>
    <span className="bar"></span>
  </div>
);

// Creating a shared audio element to ensure consistency across minimal and full views
let sharedAudioRef: HTMLAudioElement | null = null;

export const LofiPlayer: React.FC<LofiPlayerProps> = ({
  minimal = false,
  className = "",
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [volume, setVolume] = useState(0.5); // This is correctly between 0-1
  const [showStations, setShowStations] = useState(false);
  const {
    isPlaying,
    selectedStation,
    setStation,
    addListener,
    pause,
    play,
    removeListener,
  } = useLofiStore();

  // Initialize audio and ensure it's shared between instances
  useEffect(() => {
    // Create audio element if it doesn't exist yet
    if (!sharedAudioRef) {
      sharedAudioRef = new Audio();
      sharedAudioRef.src = selectedStation.url;
      sharedAudioRef.volume = volume;
      sharedAudioRef.load();
    }

    // Always point local ref to the shared audio
    audioRef.current = sharedAudioRef;

    // Handle state changes without causing loops
    const handleStateChange = () => {
      if (!audioRef.current) return;

      // Update audio source if station changed
      if (audioRef.current.src !== selectedStation.url) {
        // Pause and reset the current audio before changing the source
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        
        audioRef.current.src = selectedStation.url;
        audioRef.current.load();
        
        // If it should be playing, restart after loading the new source
        if (isPlaying) {
          audioRef.current.play().catch((err) => {
            console.error("Error playing audio:", err);
            pause(false);
          });
        }
      } else {
        // Normal play/pause handling when not changing stations
        const shouldPlay = isPlaying;
        if (shouldPlay && audioRef.current.paused) {
          audioRef.current.play().catch((err) => {
            console.error("Error playing audio:", err);
            pause(false);
          });
        } else if (!shouldPlay && !audioRef.current.paused) {
          audioRef.current.pause();
        }
      }
    };

    // Add listener and initialize state
    addListener(handleStateChange);
    handleStateChange();

    // Cleanup
    return () => {
      removeListener(handleStateChange);
    };
  }, [selectedStation, volume, isPlaying, addListener, removeListener, pause]);

  // Handle volume changes separately
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
  };

  const changeStation = (stationId: string) => {
    const station = LOFI_STATIONS.find((s) => s.id === stationId);
    if (station) {
      setStation(station);
      setShowStations(false);
    }
  };

  // Minimal player just shows station name and animation
  if (minimal) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        {/* Station info and animation */}
        <div className="flex items-center">
        {isPlaying && <MusicWaveAnimation />}

          <div className="text-xs text-primary truncate max-w-[80px] ml-4">
            {selectedStation.name}
          </div>
          {/* Show the animation when store isPlaying is true */}
        </div>
      </div>
    );
  }

  // Full player with more controls
  return (
    <>
      <div
        className={`relative bg-background rounded-lg border border-border ${className}`}
      >
        {/* Background image */}
        <div
          className="absolute inset-0 opacity-35 rounded-lg overflow-hidden"
          style={{
            backgroundImage: `url(${selectedStation.image})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        ></div>

        <div className="relative z-10 p-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
            {isPlaying && <MusicWaveAnimation />}
              <h3 className="font-medium ml-8">Lofi Music</h3>
            </div>
            <div className="relative">
              <button
                onClick={() => setShowStations(!showStations)}
                className="text-xs px-2 py-1 rounded bg-background border border-primary/30 shadow-sm hover:bg-primary/10 transition-colors flex items-center gap-1 font-medium"
              >
                {selectedStation.name}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`transition-transform ${
                    showStations ? "rotate-180" : ""
                  }`}
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>

              {showStations && (
                <div className="absolute right-0 top-8 z-10 bg-white/90 border border-primary/30 rounded-md shadow-lg w-36 py-1">
                  {LOFI_STATIONS.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => changeStation(s.id)}
                      className={`w-full text-left px-3 py-1.5 text-xs hover:bg-black/20 text-black hover:cursor-pointer hover:text-white ${
                        s.id === selectedStation.id
                          ?  "font-medium"
                          : ""
                      }`}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-muted-foreground"
                >
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                  {volume > 0 && (
                    <>
                      <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                      {volume > 0.5 && (
                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                      )}
                    </>
                  )}
                </svg>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="flex-1 h-2 appearance-none bg-gray-200 dark:bg-gray-700 rounded-full cursor-pointer"
                  style={{
                    // Custom styling for webkit browsers (Safari, Chrome)
                    WebkitAppearance: 'none',
                    // Progress fill effect
                    background: `linear-gradient(to right, black ${volume * 100}%, #e5e5e5 ${volume * 100}%)`,
                  }}
                />
              </div>
              
              {/* Add custom CSS for slider thumb styling */}
              <style jsx>{`
                input[type="range"]::-webkit-slider-thumb {
                  -webkit-appearance: none;
                  appearance: none;
                  width: 12px;
                  height: 12px;
                  border-radius: 50%;
                  background: #000000;
                  cursor: pointer;
                  border: 2px solid white;
                  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
                }
                
                input[type="range"]::-moz-range-thumb {
                  width: 12px;
                  height: 12px;
                  border-radius: 50%;
                  background: #000000;
                  cursor: pointer;
                  border: 2px solid white;
                  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
                }
                
                /* Dark mode adjustments */
                @media (prefers-color-scheme: dark) {
                  input[type="range"] {
                    background: linear-gradient(to right, white ${volume * 100}%, #333 ${volume * 100}%) !important;
                  }
                  
                  input[type="range"]::-webkit-slider-thumb {
                    background: white;
                    border: 2px solid black;
                  }
                  
                  input[type="range"]::-moz-range-thumb {
                    background: white;
                    border: 2px solid black;
                  }
                }
              `}</style>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

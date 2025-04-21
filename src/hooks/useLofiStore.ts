import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Define the station type
interface LofiStation {
  id: string;
  name: string;
  url: string;
  image: string;
}

interface LofiState {
  isPlaying: boolean;
  wasPlaying: boolean;
  selectedStation: LofiStation;
  listeners: Array<() => void>;
  play: () => void;
  pause: (rememberState?: boolean) => void;
  setStation: (station: LofiStation) => void;
  addListener: (listener: () => void) => void;
  removeListener: (listener: () => void) => void;
}

// Default stations list
const DEFAULT_STATIONS: LofiStation[] = [
  {
    id: "lofi-radio",
    name: "Lofi Radio",
    url: "https://play.streamafrica.net/lofiradio",
    image: "/images/lofi/lofi-girl.png",
  },
  {
    id: "chillhop",
    name: "Chillhop Radio",
    url: "https://streams.fluxfm.de/Chillhop/mp3-320/streams.fluxfm.de/",
    image: "/images/lofi/chillhop.jpg",
  },
  {
    id: "jazz-hop",
    name: "Jazzhop Radio",
    url: "https://streams.fluxfm.de/jazzhop/mp3-320/streams.fluxfm.de/",
    image: "/images/lofi/jazzhop.jpg",
  },
  {
    id: "synthwave",
    name: "Synthwave Radio",
    url: "https://streams.fluxfm.de/Synthwave/mp3-320/streams.fluxfm.de/",
    image: "/images/lofi/synthwave.jpg",
  },
];

export const useLofiStore = create<LofiState>()(
  persist(
    (set, get) => ({
      isPlaying: false,
      wasPlaying: false,
      selectedStation: DEFAULT_STATIONS[0],
      listeners: [],

      play: () => {
        // Only update if not already playing
        if (!get().isPlaying) {
          set({ isPlaying: true });
          get().listeners.forEach(listener => listener());
        }
      },

      pause: (rememberState = true) => {
        // Only update if currently playing
        if (get().isPlaying) {
          if (rememberState) {
            set({ wasPlaying: true, isPlaying: false });
          } else {
            set({ wasPlaying: false, isPlaying: false });
          }
          get().listeners.forEach(listener => listener());
        }
      },

      setStation: (station: LofiStation) => {
        set({ selectedStation: station });
        get().listeners.forEach(listener => listener());
      },

      addListener: (listener: () => void) => {
        // Check if listener already exists
        if (!get().listeners.includes(listener)) {
          set(state => ({
            listeners: [...state.listeners, listener]
          }));
        }
      },

      removeListener: (listener: () => void) => {
        set(state => ({
          listeners: state.listeners.filter(l => l !== listener)
        }));
      }
    }),
    {
      name: 'lofi-storage',
      // Only persist the playing state and selected station
      partialize: (state) => ({
        isPlaying: state.isPlaying,
        wasPlaying: state.wasPlaying,
        selectedStation: state.selectedStation
      })
    }
  )
);

// Export stations for reuse
export const LOFI_STATIONS = DEFAULT_STATIONS;
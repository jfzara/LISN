// hooks/useSpotifyPreview.js
// Hook global — une seule instance audio dans toute l'app
// Gère play/pause/stop, progression, état de chargement

import { useState, useEffect, useRef, useCallback } from "react";

// Singleton audio — une seule instance partagée
let globalAudio = null;
let globalListeners = new Set();

function getAudio() {
  if (!globalAudio && typeof window !== "undefined") {
    globalAudio = new Audio();
    globalAudio.volume = 0.8;
    globalAudio.crossOrigin = "anonymous";
  }
  return globalAudio;
}

function notifyAll(state) {
  globalListeners.forEach(fn => fn(state));
}

export function useSpotifyPreview() {
  const [state, setState] = useState({
    workId:     null,
    isPlaying:  false,
    isLoading:  false,
    progress:   0,       // 0..1
    duration:   30,      // secondes
    previewUrl: null,
    albumArt:   null,
    error:      null,
  });

  const stateRef   = useRef(state);
  const progressId = useRef(null);

  // S'abonner aux mises à jour globales
  useEffect(() => {
    const handler = (newState) => {
      stateRef.current = newState;
      setState(newState);
    };
    globalListeners.add(handler);
    return () => globalListeners.delete(handler);
  }, []);

  const updateState = useCallback((patch) => {
    const next = { ...stateRef.current, ...patch };
    stateRef.current = next;
    notifyAll(next);
  }, []);

  // Progression
  const startProgress = useCallback(() => {
    if (progressId.current) clearInterval(progressId.current);
    progressId.current = setInterval(() => {
      const audio = getAudio();
      if (!audio || audio.paused) return;
      const prog = audio.duration > 0 ? audio.currentTime / audio.duration : 0;
      updateState({ progress: prog });
    }, 200);
  }, [updateState]);

  const stopProgress = useCallback(() => {
    if (progressId.current) clearInterval(progressId.current);
    progressId.current = null;
  }, []);

  // Play une œuvre
  const play = useCallback(async (work) => {
    const audio = getAudio();
    if (!audio) return;

    // Même œuvre en cours → toggle pause/play
    if (stateRef.current.workId === work.id) {
      if (audio.paused) {
        audio.play();
        updateState({ isPlaying: true });
        startProgress();
      } else {
        audio.pause();
        updateState({ isPlaying: false });
        stopProgress();
      }
      return;
    }

    // Nouvelle œuvre — stop l'ancienne
    audio.pause();
    stopProgress();
    updateState({ workId: work.id, isLoading: true, isPlaying: false, progress: 0, error: null });

    try {
      const res  = await fetch(
        `/api/spotify-preview?artist=${encodeURIComponent(work.artist)}&title=${encodeURIComponent(work.title)}`
      );
      const data = await res.json();

      if (!data.previewUrl) {
        updateState({
          isLoading: false,
          error: "Preview non disponible pour cette œuvre.",
          albumArt: data.albumArt || null,
        });
        return;
      }

      audio.src = data.previewUrl;
      audio.currentTime = 0;

      // Fade in
      audio.volume = 0;
      await audio.play();

      let vol = 0;
      const fadeIn = setInterval(() => {
        vol = Math.min(0.8, vol + 0.05);
        audio.volume = vol;
        if (vol >= 0.8) clearInterval(fadeIn);
      }, 40);

      updateState({
        isLoading:  false,
        isPlaying:  true,
        previewUrl: data.previewUrl,
        albumArt:   data.albumArt || null,
        duration:   (data.durationMs || 30000) / 1000,
        error:      null,
      });
      startProgress();

      // Auto-stop à la fin
      audio.onended = () => {
        stopProgress();
        updateState({ isPlaying: false, progress: 1 });
      };

    } catch (err) {
      updateState({ isLoading: false, error: "Erreur de chargement.", isPlaying: false });
    }
  }, [updateState, startProgress, stopProgress]);

  // Stop global
  const stop = useCallback(() => {
    const audio = getAudio();
    if (audio) { audio.pause(); audio.currentTime = 0; }
    stopProgress();
    updateState({ isPlaying: false, progress: 0, workId: null });
  }, [updateState, stopProgress]);

  // Seek
  const seek = useCallback((ratio) => {
    const audio = getAudio();
    if (!audio || !audio.duration) return;
    audio.currentTime = ratio * audio.duration;
    updateState({ progress: ratio });
  }, [updateState]);

  useEffect(() => () => stopProgress(), [stopProgress]);

  return { ...state, play, stop, seek };
}

import { isMuted } from "./storage";

let audioContext: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctor) return null;
  if (!audioContext) audioContext = new Ctor();
  if (audioContext.state === "suspended") {
    audioContext.resume().catch(() => {});
  }
  return audioContext;
}

function playTone(
  frequency: number,
  startTime: number,
  duration: number,
  volume = 0.12,
): void {
  const ctx = getContext();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(0, ctx.currentTime + startTime);
  gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + startTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(
    0.001,
    ctx.currentTime + startTime + duration,
  );
  osc.connect(gain).connect(ctx.destination);
  osc.start(ctx.currentTime + startTime);
  osc.stop(ctx.currentTime + startTime + duration + 0.05);
}

export function playCorrectSound(): void {
  if (isMuted()) return;
  playTone(523.25, 0, 0.15); // do
  playTone(659.25, 0.12, 0.15); // mi
  playTone(783.99, 0.24, 0.25); // sol
}

export function playWrongSound(): void {
  if (isMuted()) return;
  playTone(330, 0, 0.2, 0.08);
  playTone(294, 0.15, 0.25, 0.08);
}

export function playTapSound(): void {
  if (isMuted()) return;
  playTone(880, 0, 0.08, 0.06);
}

export function playCelebrationSound(): void {
  if (isMuted()) return;
  [523.25, 587.33, 659.25, 783.99, 1046.5].forEach((freq, i) => {
    playTone(freq, i * 0.1, 0.2);
  });
}

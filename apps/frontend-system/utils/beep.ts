// Lightweight WebAudio beep utility for POS scanner feedback.
// No external assets; safe to call rapidly.

let ctx: AudioContext | null = null;

const getCtx = () => {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor =
      (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext })
        .AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  return ctx;
};

const tone = (frequency: number, durationMs: number, volume = 0.15) => {
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === "suspended") void ac.resume();
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = "square";
  osc.frequency.value = frequency;
  gain.gain.value = volume;
  osc.connect(gain);
  gain.connect(ac.destination);
  const now = ac.currentTime;
  osc.start(now);
  // small fade-out to avoid click
  gain.gain.setValueAtTime(volume, now + durationMs / 1000 - 0.02);
  gain.gain.linearRampToValueAtTime(0, now + durationMs / 1000);
  osc.stop(now + durationMs / 1000);
};

export const beepSuccess = () => tone(1000, 80);
export const beepError = () => {
  tone(380, 150);
  setTimeout(() => tone(280, 180), 160);
};

let newOrderAudio: HTMLAudioElement | null = null;
let paidAudio: HTMLAudioElement | null = null;
let muted = false;
let unlocked = false;

function unlockAudio() {
  if (unlocked || typeof window === 'undefined') return;
  newOrderAudio = new Audio('/sounds/new-order.mp3');
  paidAudio = new Audio('/sounds/order-paid.mp3');
  unlocked = true;
}

if (typeof window !== 'undefined') {
  document.addEventListener('click', unlockAudio, { once: true });
}

export function setMuted(v: boolean) {
  muted = v;
}

export function isMuted(): boolean {
  return muted;
}

function playWithFallback(audio: HTMLAudioElement | null) {
  if (muted) return;
  if (audio) {
    try {
      audio.currentTime = 0;
      audio.play().catch(() => playWebAudioTone());
    } catch {
      playWebAudioTone();
    }
  } else {
    playWebAudioTone();
  }
}

function playWebAudioTone() {
  try {
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.setValueAtTime(1100, now + 0.08);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.4);
    osc.onended = () => ctx.close();
  } catch { /* silencieux */ }
}

export function playNewOrderSound() {
  playWithFallback(newOrderAudio);
}

export function playPaidSound() {
  playWithFallback(paidAudio);
}

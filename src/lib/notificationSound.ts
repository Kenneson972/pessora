// Inspire de DALCIELO : priming audio sur premiere interaction utilisateur
let newOrderAudio: HTMLAudioElement | null = null;
let paidAudio: HTMLAudioElement | null = null;
let muted = false;
let unlocked = false;

function unlockAudio() {
  if (unlocked || typeof window === 'undefined') return;

  newOrderAudio = new Audio('/sounds/new-order.mp3');
  paidAudio = new Audio('/sounds/order-paid.mp3');

  // Prime les deux pistes : lecture silencieuse pour debloquer l'autoplay
  [newOrderAudio, paidAudio].forEach((a) => {
    if (!a) return;
    a.volume = 0;
    a.play().then(() => {
      a.pause();
      a.currentTime = 0;
      a.volume = 1;
    }).catch(() => {});
  });

  unlocked = true;
}

if (typeof window !== 'undefined') {
  document.addEventListener('click', unlockAudio, { once: true });
  document.addEventListener('touchstart', unlockAudio, { once: true });
  document.addEventListener('keydown', unlockAudio, { once: true });
}

export function setMuted(v: boolean) {
  muted = v;
}

export function isMuted(): boolean {
  return muted;
}

function playSound(audio: HTMLAudioElement | null) {
  if (muted) return;
  if (!audio) { playWebAudioTone(); return; }
  try {
    audio.currentTime = 0;
    audio.play().catch(() => playWebAudioTone());
  } catch {
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
  playSound(newOrderAudio);
}

export function playPaidSound() {
  playSound(paidAudio);
}

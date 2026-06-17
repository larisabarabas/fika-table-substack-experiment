import { PASTELS } from '../config';

export function fireConfetti() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const layer = document.getElementById('confetti-layer');
  if (!layer) return;

  const cx = window.innerWidth / 2;
  const cy = window.innerHeight * 0.34;

  for (let i = 0; i < 90; i++) {
    const el    = document.createElement('i');
    const color = PASTELS[i % PASTELS.length];
    const sz    = 6 + Math.random() * 8;
    const round = Math.random() < 0.5;

    el.style.cssText = `position:fixed;left:${cx}px;top:${cy}px;width:${sz}px;height:${sz * (0.5 + Math.random())}px;background:${color};border-radius:${round ? '50%' : '2px'};pointer-events:none;`;
    layer.appendChild(el);

    const ang  = Math.random() * Math.PI * 2;
    const dist = 80 + Math.random() * 320;
    const dx   = Math.cos(ang) * dist;
    const dy   = Math.sin(ang) * dist - 140 - Math.random() * 120;
    const rot  = (Math.random() - 0.5) * 720;

    el.animate(
      [
        { transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
        { transform: `translate(${dx}px,${dy + 420}px) rotate(${rot}deg)`, opacity: 0 },
      ],
      { duration: 1400 + Math.random() * 900, easing: 'cubic-bezier(.2,.7,.3,1)' }
    ).onfinish = () => el.remove();
  }
}

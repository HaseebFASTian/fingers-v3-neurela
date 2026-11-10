// The outer wrapper owns pointer tilt; CSS handles the one-time entrance.
export function initHeroMotion() {
  const hero = document.querySelector("#home.hero-showcase");
  const tilt = hero?.querySelector(".hero-tilt");
  if (!hero || !tilt) return;
  hero.classList.add("is-motion-ready");

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const initialBounds = hero.getBoundingClientRect();
  let visible =
    initialBounds.bottom > 0 && initialBounds.top < window.innerHeight;
  let frame = 0;
  let pointer = null;

  function resetTilt() {
    cancelAnimationFrame(frame);
    frame = 0;
    pointer = null;
    tilt.style.removeProperty("transform");
  }

  function canTilt() {
    return (
      !reducedMotion.matches &&
      finePointer.matches &&
      visible &&
      !document.hidden
    );
  }

  function syncMotion() {
    hero.classList.toggle("is-offscreen", !visible || document.hidden);
    if (!canTilt()) resetTilt();
  }

  function updateTilt() {
    frame = 0;
    if (!pointer || !canTilt()) return;
    const bounds = hero.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    const x = Math.max(
      -1,
      Math.min(1, ((pointer.x - bounds.left) / bounds.width) * 2 - 1),
    );
    const y = Math.max(
      -1,
      Math.min(1, ((pointer.y - bounds.top) / bounds.height) * 2 - 1),
    );
    tilt.style.transform = `translate3d(${(x * 5).toFixed(2)}px, ${(y * 3).toFixed(2)}px, 0) rotateX(${(-y * 3).toFixed(2)}deg) rotateY(${(x * 4).toFixed(2)}deg)`;
  }

  function onPointerMove(event) {
    if (event.pointerType === "touch" || !canTilt()) return;
    pointer = { x: event.clientX, y: event.clientY };
    // Only schedule work in response to input; no permanent animation loop.
    if (!frame) frame = requestAnimationFrame(updateTilt);
  }

  const observer =
    "IntersectionObserver" in window
      ? new IntersectionObserver(
          (entries) => {
            visible = entries[0].isIntersecting;
            syncMotion();
          },
          { threshold: 0 },
        )
      : null;

  hero.addEventListener("pointermove", onPointerMove, { passive: true });
  hero.addEventListener("pointerleave", resetTilt);
  reducedMotion.addEventListener("change", syncMotion);
  finePointer.addEventListener("change", syncMotion);
  document.addEventListener("visibilitychange", syncMotion);
  observer?.observe(hero);
  syncMotion();

  return () => {
    observer?.disconnect();
    resetTilt();
    hero.removeEventListener("pointermove", onPointerMove);
    hero.removeEventListener("pointerleave", resetTilt);
    reducedMotion.removeEventListener("change", syncMotion);
    finePointer.removeEventListener("change", syncMotion);
    document.removeEventListener("visibilitychange", syncMotion);
    hero.classList.remove("is-motion-ready", "is-offscreen");
  };
}

initHeroMotion();

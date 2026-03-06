(() => {
  const frame = document.querySelector('.frame');
  if (!frame) return;

  // Keep the frame scaled to fit smaller displays while preserving the exact 1920x1080 proportions.
  const resize = () => {
    const scale = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
    frame.style.transform = `scale(${Math.min(1, scale)})`;
    frame.style.transformOrigin = 'top center';
    frame.style.marginTop = scale < 1 ? '16px' : '0';
  };

  window.addEventListener('resize', resize);
  resize();
})();

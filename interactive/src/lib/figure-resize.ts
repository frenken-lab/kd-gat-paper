// Auto-resize the parent <iframe> to fit this figure's content.
//
// Two paths:
//   1. Same-origin: directly write the parent frame element's height. Used
//      when the host page is on the same origin as this figure (e.g. MyST
//      site + iframes both on frenken-lab.github.io, or the TMLR Jekyll
//      build).
//   2. Cross-origin: postMessage the desired height to the parent. The
//      parent must listen for `{ type: 'kd-gat-paper:resize', height }` to
//      apply it. Used for curve.space (different origin from GitHub Pages
//      figure URLs). Harmless when nobody is listening — figures keep their
//      author-declared default height.
//
// Updates fire on initial paint, ResizeObserver content changes (for
// expandable figures like gat-layer), window resize, and load events
// (images/fonts may settle late).

const MESSAGE_TYPE = 'kd-gat-paper:resize';

export function autoResizeIframe(): void {
  if (typeof window === 'undefined' || window.parent === window) return;

  const measure = (): number => Math.ceil(document.documentElement.scrollHeight);

  let lastSent = 0;
  function post(): void {
    const h = measure();
    if (h === lastSent) return;
    lastSent = h;

    // Same-origin direct write. Use setProperty with 'important' so the
    // element-style override beats the article-theme wrapper neutralizer
    // in _static/custom.css (which marks the default 400px height as
    // !important so it wins over the theme's inline height:100%).
    try {
      const frame = window.frameElement as HTMLIFrameElement | null;
      if (frame) {
        frame.setAttribute('height', String(h));
        frame.style.setProperty('height', `${h}px`, 'important');
      }
    } catch {
      // Cross-origin SecurityError — fall through.
    }

    // Cross-origin (or any) parent listener.
    window.parent.postMessage(
      { type: MESSAGE_TYPE, height: h, slug: location.pathname },
      '*',
    );
  }

  // Wait two animation frames so initial layout has settled.
  requestAnimationFrame(() => requestAnimationFrame(post));

  if (typeof ResizeObserver !== 'undefined') {
    const ro = new ResizeObserver(() => post());
    ro.observe(document.documentElement);
  }

  window.addEventListener('resize', post);
  window.addEventListener('load', post);
}

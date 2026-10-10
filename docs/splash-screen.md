# Sentinel-IoT automatic loading screen

The branded eye, orbit ring, title, and loading track appear from the initial
HTML response. Critical inline styles hide the story from the first paint while
keeping the existing model stage mounted and measurable. The story loads behind
the splash; its framing and model size are unchanged.

Every page load opens automatically. The splash fades out once the scene (or
text fallback), page assets, and fonts are ready, after a short 900 ms minimum.
A separate head timer closes it at two seconds including the exit transition,
even if the application module has not started. This is a loading deadline,
not a guarantee that a slow network will finish downloading within two seconds.
There is no required Enter button. Skip and Escape remain available.

The production build embeds its local stylesheet into the initial HTML, retaining
the generated CSS file. Google Fonts load separately without blocking the first
paint. Consequently the deadline reveals a styled page, even when an external
font or the application module is still downloading. The background model then
initializes when its module becomes available.

The initial close preserves the requested chapter. The footer's **Replay welcome
screen** also closes automatically within two seconds and restores its opener
and reading position. Scrolling is locked while the native dialog is open.
Reduced motion and the pause setting use a still introduction and instant exit.
Returning from the browser back-forward cache checks the absolute deadline.

The first-paint gate and eye placements are in `index.html`; additional welcome styles
are in `src/splash.css`; finite Anime.js transitions and readiness are in
`src/splash.js`; build-time style embedding is in `vite.config.js`.
`docs/verify-startup-server.mjs` serves the actual production build locally for
verification. Its optional `?slow=1` delays the main module by four seconds.
All changes remain inside the portfolio folder. Original project files are
preserved.

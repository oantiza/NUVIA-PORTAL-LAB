/**
 * Apertura audiovisual de Academia NUVIA.
 *
 * La página permanece cargada detrás del vídeo. Cualquier error, preferencia
 * de movimiento reducido o espera excesiva libera inmediatamente el acceso.
 */
(() => {
  'use strict';

  const intro = document.querySelector('[data-academy-intro]');
  const video = intro?.querySelector('[data-academy-intro-video]');
  const playButton = intro?.querySelector('[data-academy-intro-play]');
  const skipButton = intro?.querySelector('[data-academy-intro-skip]');
  const status = intro?.querySelector('[data-academy-intro-status]');
  const pageShell = document.querySelector('x-dc');

  if (!intro || !video || !playButton || !skipButton) return;

  const root = document.documentElement;
  let finished = false;
  let safetyTimer;

  root.classList.add('has-academy-intro');
  pageShell?.setAttribute('inert', '');
  video.defaultMuted = true;
  video.muted = true;

  const removeKeyListener = () => document.removeEventListener('keydown', onKeyDown);

  const finish = (reason = 'ended') => {
    if (finished) return;
    finished = true;
    window.clearTimeout(safetyTimer);
    removeKeyListener();
    video.pause();
    intro.dataset.finishReason = reason;
    intro.classList.add('is-leaving');
    root.classList.remove('has-academy-intro');
    window.setTimeout(() => {
      intro.remove();
      pageShell?.removeAttribute('inert');
      const main = document.querySelector('main');
      if (main) {
        main.setAttribute('tabindex', '-1');
        main.focus({ preventScroll: true });
        main.addEventListener('blur', () => main.removeAttribute('tabindex'), { once: true });
      }
    }, 560);
  };

  function onKeyDown(event) {
    if (event.key === 'Escape') finish('escape');
  }

  const showManualPlay = () => {
    playButton.hidden = false;
    if (status) status.textContent = 'Pulsa para reproducir la presentación o continúa directamente.';
    playButton.focus({ preventScroll: true });
  };

  const startPlayback = () => {
    try {
      const attempt = video.play();
      if (attempt && typeof attempt.catch === 'function') {
        attempt.catch(showManualPlay);
      }
    } catch {
      showManualPlay();
    }
  };

  video.addEventListener('playing', () => {
    playButton.hidden = true;
    if (status) status.textContent = 'Reproduciendo la presentación de Academia NUVIA.';
  });
  video.addEventListener('ended', () => finish('ended'), { once: true });
  video.addEventListener('error', () => finish('video-error'), { once: true });
  skipButton.addEventListener('click', () => finish('skip'));
  playButton.addEventListener('click', startPlayback);
  document.addEventListener('keydown', onKeyDown);
  window.setTimeout(() => skipButton.focus({ preventScroll: true }), 0);

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    finish('reduced-motion');
    return;
  }

  safetyTimer = window.setTimeout(() => finish('safety-timeout'), 30000);
  startPlayback();
})();

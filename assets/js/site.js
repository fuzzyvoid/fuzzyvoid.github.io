/* ==========================================================================
basic site-wide JS, aimed as non-essential enhancements so the site still functions if the visitor has no JS. Must load before Alpine JS.
Kinda janky just to run everything on every page. but eh it's not that much, and none of it is essential functionality, just fanciness.
========================================================================== */

(() => {
	'use strict';

	/**
	 * Sets page for screenreaders.
	 */
	const markCurrentNav = () => {
		const page = document.body.dataset.page;

		if (!page) {
			return;
		}

		document
			.querySelectorAll(`.nav__link[data-nav="${page}"]`)
			.forEach((el) => el.setAttribute('aria-current', 'page'));
	};

	/**
	 * Make dot nav anchor highlighting follow the scroll.
	 *
	 * TODO: do it with just alpine.js?
	 *
	 * rootMargin '-50% 0px -50% 0px' makes the observer root a zero-height line across the middle of the viewport.
	 */
	const trackPanels = () => {
		const dots = Array.from(document.querySelectorAll('.dot-nav__link'));

		if (dots.length === 0 || !('IntersectionObserver' in window)) {
			return;
		}

		const dotForPanel = new Map();

		dots.forEach((dot) => {
			const id = (dot.getAttribute('href') || '').replace(/^#/, '');
			const panel = id ?
				document.getElementById(id) :
				null;

			if (panel) {
				dotForPanel.set(panel, dot);
			}
		});

		if (dotForPanel.size === 0) {
			return;
		}

		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (!entry.isIntersecting) {
						return;
					}

					const active = dotForPanel.get(entry.target);

					if (!active) {
						return;
					}

					dots.forEach((d) => d.setAttribute('aria-current', 'false'));
					active.setAttribute('aria-current', 'true');
				});
			},
			{
				rootMargin: '-50% 0px -50% 0px',
				threshold: 0
			}
		);

		dotForPanel.forEach((_dot, panel) => observer.observe(panel));
	};

	/**
	 * Hovering any [data-survivor] element (header icons, survivor bubbles) fades in the matching [data-survivor-video] over the eye. Mouse users only.
	 */
	const heroVideos = () => {
		/**
		 * @var {NodeListOf<HTMLVideoElement>} videos
		 */
		const videos = document.querySelectorAll('[data-survivor-video]');

		if (videos.length === 0) {
			return;
		}

		if (!matchMedia('(hover: hover) and (pointer: fine)').matches) {
			return;
		}

		if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
			return;
		}

		const loadVideos = () => {
			videos.forEach((video) => {
				if (video.dataset.src) {
					video.src = video.dataset.src;
					delete video.dataset.src;
					video.preload = 'auto';
					video.load();
				}
			});
		};

		const eye = document.querySelector('.survivor-eye');

		if (eye && 'IntersectionObserver' in window) {
			const observer = new IntersectionObserver((entries) => {
				if (entries.some((entry) => entry.isIntersecting)) {
					loadVideos();
					observer.disconnect();
				}
			}, { rootMargin: '300px' });

			observer.observe(eye);
		} else {
			loadVideos();
		}

		let activeVideo = null;

		/** @param {?string} survivor */
		const show = (survivor) => {
			const nextVideo = Array.from(videos).find(
				(video) => video.dataset.survivorVideo === survivor
			) || null;

			if (nextVideo === activeVideo) {
				return;
			}

			activeVideo = nextVideo;

			videos.forEach((video) => {
				const on = video === activeVideo;

				video.classList.toggle('is-active', on);

				if (!on) {
					video.pause();
				}
			});

			if (nextVideo) {
				loadVideos();

				nextVideo.currentTime = 0;

				nextVideo.play().catch((error) => {
					// Leaving a button can interrupt a pending play request.
					if (error.name === 'AbortError') {
						return;
					}

					console.warn('Unable to play survivor preview:', error);

					if (activeVideo === nextVideo) {
						show(null);
					}
				});
			}
		};

		document.querySelectorAll('[data-survivor]').forEach((el) => {
			el.addEventListener('mouseenter', () => show(el.dataset.survivor));
			el.addEventListener('mouseleave', () => show(null));
		});
	};

	/**
	 * Finds the eye on the page and does slow mouse tracking, using an animation frame loop.
	 *
	 * Rotates the eye by updating the CSS variable --eye-rotation to a value within a max range since the art gets janky outside of it.
	 */
	const trackEye = () => {
		const eye = document.querySelector('.survivor-eye');
		const layers = eye?.querySelector('.survivor-eye__layers');
		const eyeball = eye?.querySelector('.survivor-eye__eyeball');

		const MAX_ANGLE = 15;

		if (!layers || !eyeball) {
			return;
		}

		// AKA generally only track on desktop where reduced motion is not preferred
		const motion = matchMedia(
			'(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)'
		);

		let visible = true;
		/**
		 * @var {{x: number, y: number}|null} pointer
		 */
		let pointer = null;
		/**
		 * @var {number|null} frame
		 */
		let frame = null;

		const reset = () => {
			cancelAnimationFrame(frame);
			frame = null;
			pointer = null;
			eye.style.removeProperty('--eye-rotation');
		};

		const update = () => {
			frame = null;

			if (!pointer || !visible || !motion.matches) {
				return;
			}

			const bounds = layers.getBoundingClientRect();
			const [originX, originY] = getComputedStyle(eyeball)
				.transformOrigin
				.split(' ')
				.map(Number.parseFloat);

			// Eye is flipped by via scaleX(-1)
			const reversed = eye.classList.contains('reversed');

			// i hate math
			const centreX = reversed ? bounds.right - originX : bounds.left + originX;
			const dx = pointer.x - centreX;
			const dy = pointer.y - (bounds.top + originY);

			// The artwork faces left; use horizontal distance to avoid a 180deg flip.
			const angle = Math.atan2(-dy, Math.max(Math.abs(dx), 1)) * 180 / Math.PI;
			const rotation = Math.max(-MAX_ANGLE, Math.min(MAX_ANGLE, angle));

			eye.style.setProperty(
				'--eye-rotation',
				`${reversed ? -rotation : rotation}deg`
			);
		};

		/**
		 * Calling schedule() instead of update() lets us control the frame rate/avoid unnecessary updates.
		 */
		const schedule = () => {
			// Schedule the next frame if necessary (if pointer is available, eye is visible, and motion is allowed)
			if (frame === null && pointer && visible && motion.matches) {
				frame = requestAnimationFrame(update);
			}
		};

		// Add schedule and reset events
		document.addEventListener('pointermove', (event) => {
			if (event.pointerType === 'touch' || !motion.matches || !visible) {
				return;
			}

			pointer = { x: event.clientX, y: event.clientY };
			schedule();
		}, { passive: true });
		document.documentElement.addEventListener('pointerleave', reset);
		window.addEventListener('blur', reset);
		window.addEventListener('scroll', schedule, { passive: true });
		window.addEventListener('resize', schedule);
		motion.addEventListener('change', reset);

		// Compat check
		if ('IntersectionObserver' in window) {
			// When the eye leaves, the viewport, we should stop tracking it.
			const observer = new IntersectionObserver(([entry]) => {
				visible = entry.isIntersecting;

				if (!visible) {
					reset();
				}
			});

			observer.observe(eye);
		}
	};

	/**
	 * Starts fetching/playing `[data-autoplay]` videos using `preload="none"` shortly before they scroll into view, and pause once they exit.
	 *
	 * This means other content on the page (which will almost certainly be smaller) can load without being blocked, but we still get SOME autoloading.
	 */
	const lazyAutoplay = () => {
		/**
		 * @var {NodeListOf<HTMLVideoElement>} videos
		 */
		const videos = document.querySelectorAll('video[data-autoplay]');

		if (videos.length === 0) {
			return;
		}

		const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

		const start = (video) => {
			if (reducedMotion.matches) {
				video.preload = 'metadata';

				return;
			}

			video.preload = 'auto';
			video.play().catch(() => {
				// Autoplay can be blocked (e.g. low power mode); the poster stays visible.
			});
		};

		// Compat check
		if (!('IntersectionObserver' in window)) {
			videos.forEach(start);

			return;
		}

		// Otherwise do the start lazy loading
		const observer = new IntersectionObserver((entries) => {
			entries.forEach(({ target, isIntersecting }) => {
				if (isIntersecting) {
					start(target);
				} else {
					target.pause();
				}
			});
		}, { rootMargin: '100% 0px' });

		videos.forEach((video) => observer.observe(video));
	};

	markCurrentNav();
	trackPanels();
	heroVideos();
	trackEye();
	lazyAutoplay();

	// iOS/safari only applies :active on touch when this listener exists...
	document.addEventListener('touchstart', () => { }, { passive: true });
})();

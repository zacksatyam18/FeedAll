import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';

/**
 * EXACT CONFIGURATION CONSTANTS
 * TRANSITION_DURATION: Exact 500ms (0.5 seconds) sliding transition
 * AUTOPLAY_INTERVAL: 3000ms (3.0 seconds) between automatic slide advances
 */
export const TRANSITION_DURATION = 500; // 500ms = 0.5s transition
export const AUTOPLAY_INTERVAL = 3000;  // 3000ms = 3.0s autoplay interval

export default function HeroSlider({ slides = [], className = '' }) {
  const slideCount = slides.length;

  // Prepend last slide and append first slide for seamless infinite horizontal loop
  const extendedSlides = useMemo(() => {
    if (slideCount <= 1) return slides;
    const first = slides[0];
    const last = slides[slideCount - 1];
    return [last, ...slides, first];
  }, [slides, slideCount]);

  // Index 1 corresponds to slides[0]
  const [currentIndex, setCurrentIndex] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });
  const [failedImages, setFailedImages] = useState({});

  const timerRef = useRef(null);

  // Active original slide index (0 to slideCount - 1)
  const activeDotIndex = useMemo(() => {
    if (slideCount <= 1) return 0;
    if (currentIndex === 0) return slideCount - 1;
    if (currentIndex === extendedSlides.length - 1) return 0;
    return currentIndex - 1;
  }, [currentIndex, extendedSlides.length, slideCount]);

  // Check user preference for reduced motion changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const listener = (e) => setPrefersReducedMotion(e.matches);
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, []);

  // Handle seamless teleporting when arriving at cloned boundary slides
  const handleTransitionEnd = useCallback(() => {
    if (slideCount <= 1) return;
    if (currentIndex === extendedSlides.length - 1) {
      // Reached appended clone of first slide -> snap instantly to actual first slide (index 1)
      setIsTransitioning(false);
      setCurrentIndex(1);
    } else if (currentIndex === 0) {
      // Reached prepended clone of last slide -> snap instantly to actual last slide
      setIsTransitioning(false);
      setCurrentIndex(slideCount);
    }
  }, [currentIndex, extendedSlides.length, slideCount]);

  // Move to next slide (leftward slide in 500ms)
  const nextSlide = useCallback(() => {
    if (slideCount <= 1) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => {
      if (prev >= extendedSlides.length - 1) return prev;
      return prev + 1;
    });
  }, [extendedSlides.length, slideCount]);

  // Move to previous slide (rightward slide in 500ms)
  const prevSlide = useCallback(() => {
    if (slideCount <= 1) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => {
      if (prev <= 0) return prev;
      return prev - 1;
    });
  }, [slideCount]);

  // Jump to specific slide dot
  const goToSlide = useCallback((targetIndex) => {
    setIsTransitioning(true);
    setCurrentIndex(targetIndex + 1);
  }, []);

  // Set up autoplay timer
  useEffect(() => {
    if (!isPlaying || slideCount <= 1) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    // Stop autoplay when tab is inactive to prevent transition accumulation
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (timerRef.current) clearInterval(timerRef.current);
      } else {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(nextSlide, AUTOPLAY_INTERVAL);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Start interval
    timerRef.current = setInterval(nextSlide, AUTOPLAY_INTERVAL);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isPlaying, nextSlide, slideCount]);

  // Ensure transition re-enables after instant snap
  useEffect(() => {
    if (!isTransitioning) {
      // Allow DOM to apply instant snap without transition before re-enabling
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsTransitioning(true);
        });
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [isTransitioning]);

  // Cleanup autoplay timer on unmount
  useEffect(() => {
    const timer = timerRef.current;
    return () => {
      if (timer) clearInterval(timer);
    };
  }, []);

  const handleImageError = (index) => {
    setFailedImages((prev) => ({ ...prev, [index]: true }));
  };

  const transformStyle = useMemo(() => {
    if (slideCount <= 1) return 'none';
    return `translate3d(-${currentIndex * 100}%, 0, 0)`;
  }, [currentIndex, slideCount]);

  const transitionStyle = useMemo(() => {
    if (prefersReducedMotion || !isTransitioning || slideCount <= 1) {
      return 'none';
    }
    return `transform ${TRANSITION_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`;
  }, [prefersReducedMotion, isTransitioning, slideCount]);

  // 1. If empty slides array
  if (slideCount === 0) {
    return <div className={`relative w-full h-full bg-slate-900 ${className}`} />;
  }

  // 2. If single slide
  if (slideCount === 1) {
    return (
      <div className={`relative w-full h-full overflow-hidden ${className}`}>
        <img
          src={slides[0].src}
          alt={slides[0].alt || 'Hero presentation'}
          className="w-full h-full object-cover object-center"
        />
      </div>
    );
  }

  // 3. Normal multi-slide slider
  return (
    <div
      className={`hero-carousel-container relative w-full h-full overflow-hidden select-none ${className}`}
      role="region"
      aria-roledescription="carousel"
      aria-label="FeedAll Mission Highlights"
    >
      {/* Horizontal sliding track */}
      <div
        className="hero-carousel-track flex w-full h-full will-change-transform"
        style={{
          transform: transformStyle,
          transition: transitionStyle
        }}
        onTransitionEnd={handleTransitionEnd}
      >
        {extendedSlides.map((slide, idx) => {
          const isError = failedImages[idx];
          return (
            <div
              key={`${slide.src}-${idx}`}
              className="hero-carousel-slide flex-shrink-0 min-w-full w-full h-full relative overflow-hidden"
              aria-hidden={activeDotIndex !== (idx === 0 ? slideCount - 1 : idx === extendedSlides.length - 1 ? 0 : idx - 1)}
            >
              {isError ? (
                <div className="w-full h-full bg-slate-800 flex flex-col items-center justify-center p-6 text-center text-slate-300">
                  <span className="text-3xl mb-2">🍲</span>
                  <p className="text-xs font-semibold">{slide.alt || 'FeedAll Community Kitchen'}</p>
                </div>
              ) : (
                <img
                  src={slide.src}
                  alt={slide.alt || 'FeedAll impact photo'}
                  className="hero-carousel-img w-full h-full object-cover object-center pointer-events-none"
                  loading={idx === 1 ? 'eager' : 'lazy'}
                  onError={() => handleImageError(idx)}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Subtle bottom-edge gradient for contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-forest-950/40 via-transparent to-transparent pointer-events-none z-10" />

      {/* Manual Navigation Controls (Keyboard & click accessible) */}
      <div className="absolute inset-y-0 left-3 flex items-center z-20 pointer-events-none">
        <button
          type="button"
          onClick={() => {
            prevSlide();
            if (timerRef.current) {
              clearInterval(timerRef.current);
              if (isPlaying) timerRef.current = setInterval(nextSlide, AUTOPLAY_INTERVAL);
            }
          }}
          className="pointer-events-auto p-2 rounded-full bg-black/30 hover:bg-black/60 text-white backdrop-blur-sm transition-all transform hover:scale-105 active:scale-95 border border-white/20 focus:outline-none focus:ring-2 focus:ring-white"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      <div className="absolute inset-y-0 right-3 flex items-center z-20 pointer-events-none">
        <button
          type="button"
          onClick={() => {
            nextSlide();
            if (timerRef.current) {
              clearInterval(timerRef.current);
              if (isPlaying) timerRef.current = setInterval(nextSlide, AUTOPLAY_INTERVAL);
            }
          }}
          className="pointer-events-auto p-2 rounded-full bg-black/30 hover:bg-black/60 text-white backdrop-blur-sm transition-all transform hover:scale-105 active:scale-95 border border-white/20 focus:outline-none focus:ring-2 focus:ring-white"
          aria-label="Next slide"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Slide Indicators & Play/Pause Button */}
      <div className="absolute bottom-4 right-4 flex items-center gap-2 z-20 bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
        {/* Play/Pause toggle button */}
        <button
          type="button"
          onClick={() => setIsPlaying((p) => !p)}
          className="text-white hover:text-emerald-300 transition-colors p-0.5 focus:outline-none focus:ring-1 focus:ring-white rounded"
          aria-label={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        </button>

        <div className="h-3 w-px bg-white/25" />

        {/* Slide pagination dots */}
        <div className="flex items-center gap-1.5">
          {slides.map((slide, index) => {
            const isActive = activeDotIndex === index;
            return (
              <button
                key={slide.src || index}
                type="button"
                onClick={() => {
                  goToSlide(index);
                  if (timerRef.current) {
                    clearInterval(timerRef.current);
                    if (isPlaying) timerRef.current = setInterval(nextSlide, AUTOPLAY_INTERVAL);
                  }
                }}
                aria-label={`Go to slide ${index + 1}`}
                aria-current={isActive ? 'true' : undefined}
                className={`h-1.5 rounded-full transition-all duration-300 focus:outline-none focus:ring-1 focus:ring-white ${
                  isActive
                    ? 'w-6 bg-white shadow-sm'
                    : 'w-1.5 bg-white/50 hover:bg-white/80'
                }`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

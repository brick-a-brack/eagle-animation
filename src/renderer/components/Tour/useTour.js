import useSettings from '@hooks/useSettings';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

import { measureStep } from './geometry';

// Drives a single tour: navigation state, completion persistence, and the side
// effects that keep it in sync with the DOM (measurement, keyboard, target click).
// Returns everything the presentational layer needs to render a step.
const useTour = (tourKey, steps) => {
  const { settings, actions: settingsActions } = useSettings();
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState(undefined); // undefined = not measured yet
  const [dismissed, setDismissed] = useState(false);
  const [activeSteps, setActiveSteps] = useState(null); // null = presence not resolved yet
  const directionRef = useRef(1);
  const startedRef = useRef(false);
  const activeStepsRef = useRef(null);
  const stepRef = useRef(null);

  const isOpen = !dismissed && !!settings && !(settings.TOURS_COMPLETED || []).includes(tourKey) && steps.length > 0;

  // Resolve which steps actually apply to the current layout: keep centered steps
  // (no selectors) and steps whose target is present. This keeps the step counter
  // honest on layouts where some targets are hidden (e.g. mobile), instead of
  // counting steps that would be silently skipped. Recomputed on resize, because
  // crossing a layout breakpoint can show or hide targets and the counter must
  // follow; the user is kept on their current step whenever it survives.
  useLayoutEffect(() => {
    if (!isOpen) {
      setActiveSteps(null);
      activeStepsRef.current = null;
      return undefined;
    }
    const resolve = () => {
      const next = steps.filter((s) => measureStep(s.selectors) !== false);
      const previous = activeStepsRef.current;
      if (previous && previous.length === next.length && previous.every((s, i) => s === next[i])) {
        return;
      }
      activeStepsRef.current = next;
      const current = stepRef.current;
      const target = current ? next.indexOf(current) : -1;
      setStepIndex((i) => (target !== -1 ? target : Math.min(i, Math.max(0, next.length - 1))));
      setActiveSteps(next);
    };
    resolve();
    window.addEventListener('resize', resolve);
    return () => window.removeEventListener('resize', resolve);
  }, [isOpen, steps]);

  const step = isOpen && activeSteps ? activeSteps[stepIndex] : null;
  const stepCount = activeSteps ? activeSteps.length : 0;

  // Track the current step so a resize-driven recompute can keep the user on it.
  stepRef.current = step;

  const finish = useCallback(
    (reason) => {
      setDismissed(true);
      const completed = settings?.TOURS_COMPLETED || [];
      if (!completed.includes(tourKey)) {
        settingsActions.setSettings({ TOURS_COMPLETED: [...completed, tourKey] });
      }
      window.track?.(reason === 'skipped' ? 'tour_skipped' : 'tour_completed', { tour: tourKey });
    },
    [settings, settingsActions, tourKey]
  );

  const goNext = useCallback(() => {
    directionRef.current = 1;
    setStepIndex((i) => i + 1); // Going past the last step completes the tour
  }, []);

  const goPrevious = useCallback(() => {
    directionRef.current = -1;
    setStepIndex((i) => Math.max(0, i - 1));
  }, []);

  useEffect(() => {
    if (isOpen && !startedRef.current) {
      startedRef.current = true;
      window.track?.('tour_started', { tour: tourKey });
    }
  }, [isOpen, tourKey]);

  // Measure the highlighted element, skip steps that became unavailable and follow layout changes
  useLayoutEffect(() => {
    if (!isOpen || !activeSteps) {
      return undefined;
    }
    if (stepIndex >= activeSteps.length) {
      finish('completed');
      return undefined;
    }
    const currentStep = activeSteps[stepIndex];
    const measure = () => {
      const r = measureStep(currentStep.selectors);
      if (r === false) {
        setStepIndex((i) => (i + directionRef.current < 0 ? i + 1 : i + directionRef.current));
        return;
      }
      setRect((previous) => (JSON.stringify(previous) === JSON.stringify(r) ? previous : r));
    };

    // Coalesce bursts of scroll/resize events into a single measure per frame so
    // the spotlight stays glued to the target without thrashing layout.
    let frame = null;
    const scheduleMeasure = () => {
      if (frame !== null) {
        return;
      }
      frame = requestAnimationFrame(() => {
        frame = null;
        measure();
      });
    };

    measure();
    const clock = setInterval(measure, 300);
    window.addEventListener('resize', scheduleMeasure);
    // Capture phase so scrolls inside nested scrollable containers are caught too
    // (scroll events do not bubble).
    window.addEventListener('scroll', scheduleMeasure, true);
    return () => {
      clearInterval(clock);
      if (frame !== null) {
        cancelAnimationFrame(frame);
      }
      window.removeEventListener('resize', scheduleMeasure);
      window.removeEventListener('scroll', scheduleMeasure, true);
    };
  }, [isOpen, stepIndex, activeSteps, finish]);

  // Lock scrolling while the tour is open so the highlighted element stays put
  // under its spotlight. The overlay panels can't prevent it on their own: a wheel
  // event still bubbles to a scrollable DOM ancestor of the (nested) overlay.
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }
    const preventScroll = (e) => e.preventDefault();
    window.addEventListener('wheel', preventScroll, { capture: true, passive: false });
    window.addEventListener('touchmove', preventScroll, { capture: true, passive: false });
    return () => {
      window.removeEventListener('wheel', preventScroll, { capture: true });
      window.removeEventListener('touchmove', preventScroll, { capture: true });
    };
  }, [isOpen]);

  // Keyboard navigation, captured on window to keep app shortcuts inactive during the tour
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }
    // Keys that would otherwise scroll the page; blocked to keep the tour static.
    const scrollKeys = [' ', 'ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End'];
    const handleKeyDown = (e) => {
      e.stopPropagation();
      if (e.key === 'Escape') {
        finish('skipped');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrevious();
      } else if (e.key === 'Enter' && e.target === document.body) {
        goNext();
      } else if (scrollKeys.includes(e.key) && e.target === document.body) {
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, finish, goNext, goPrevious]);

  return { isOpen, step, stepIndex, stepCount, rect, goNext, goPrevious, finish };
};

export default useTour;

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

  const isOpen = !dismissed && !!settings && !(settings.TOURS_COMPLETED || []).includes(tourKey) && steps.length > 0;

  // Resolve which steps actually apply to the current layout once, when the tour
  // opens: keep centered steps (no selector) and steps whose target is present.
  // This keeps the step counter honest on layouts where some targets are hidden
  // (e.g. mobile), instead of counting steps that would be silently skipped.
  useLayoutEffect(() => {
    if (!isOpen) {
      setActiveSteps(null);
      return;
    }
    setActiveSteps((current) => current ?? steps.filter((s) => measureStep(s.selector) !== false));
  }, [isOpen, steps]);

  const step = isOpen && activeSteps ? activeSteps[stepIndex] : null;
  const stepCount = activeSteps ? activeSteps.length : 0;

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
      const r = measureStep(currentStep.selector);
      if (r === false) {
        setStepIndex((i) => (i + directionRef.current < 0 ? i + 1 : i + directionRef.current));
        return;
      }
      setRect((previous) => (JSON.stringify(previous) === JSON.stringify(r) ? previous : r));
    };
    measure();
    const clock = setInterval(measure, 300);
    window.addEventListener('resize', measure);
    return () => {
      clearInterval(clock);
      window.removeEventListener('resize', measure);
    };
  }, [isOpen, stepIndex, activeSteps, finish]);

  // Keyboard navigation, captured on window to keep app shortcuts inactive during the tour
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }
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
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, finish, goNext, goPrevious]);

  // Complete the tour when the highlighted element is clicked
  useEffect(() => {
    if (!isOpen || !step?.completeOnTargetClick || !step?.selector) {
      return undefined;
    }
    const handleClick = (e) => {
      if (e.target?.closest?.(step.selector)) {
        finish('completed');
      }
    };
    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [isOpen, step, finish]);

  return { isOpen, step, stepIndex, stepCount, rect, goNext, goPrevious, finish };
};

export default useTour;

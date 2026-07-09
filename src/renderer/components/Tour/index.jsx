import useSettings from '@hooks/useSettings';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { withTranslation } from 'react-i18next';

import TOURS from './tours';

import * as style from './style.module.css';

const SPOTLIGHT_PADDING = 8;
const CARD_MARGIN = 12;
const CARD_WIDTH = 340;
const CARD_ESTIMATED_HEIGHT = 210;

// Union of the rects of all visible elements matching the selector
// Returns `null` for selector-less (centered) steps and `false` if nothing matches
const measureStep = (selector) => {
  if (!selector) {
    return null;
  }
  const rects = [...document.querySelectorAll(selector)].map((el) => el.getBoundingClientRect()).filter((r) => r.width > 0 && r.height > 0);
  if (!rects.length) {
    return false;
  }
  const left = Math.min(...rects.map((r) => r.left));
  const top = Math.min(...rects.map((r) => r.top));
  const right = Math.max(...rects.map((r) => r.right));
  const bottom = Math.max(...rects.map((r) => r.bottom));
  return { left, top, right, bottom };
};

const Tour = ({ tourKey, t }) => {
  const { settings, actions: settingsActions } = useSettings();
  const steps = useMemo(() => (TOURS[tourKey] ? TOURS[tourKey](t) : []), [tourKey, t]);
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState(undefined); // undefined = not measured yet
  const [dismissed, setDismissed] = useState(false);
  const directionRef = useRef(1);
  const startedRef = useRef(false);
  const cardRef = useRef(null);

  const isOpen = !dismissed && !!settings && !(settings.TOURS_COMPLETED || []).includes(tourKey) && steps.length > 0;
  const step = isOpen ? steps[stepIndex] : null;

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

  // Measure the highlighted element, skip unavailable steps and follow layout changes
  useLayoutEffect(() => {
    if (!isOpen) {
      return undefined;
    }
    if (stepIndex >= steps.length) {
      finish('completed');
      return undefined;
    }
    const currentStep = steps[stepIndex];
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
  }, [isOpen, stepIndex, steps, finish]);

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

  if (!isOpen || !step || rect === undefined) {
    return null;
  }

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const hole = rect
    ? {
        left: Math.max(rect.left - SPOTLIGHT_PADDING, 0),
        top: Math.max(rect.top - SPOTLIGHT_PADDING, 0),
        right: Math.min(rect.right + SPOTLIGHT_PADDING, vw),
        bottom: Math.min(rect.bottom + SPOTLIGHT_PADDING, vh),
      }
    : null;

  const cardWidth = Math.min(CARD_WIDTH, vw - 2 * CARD_MARGIN);
  let cardStyle = { left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: `${cardWidth}px` };
  if (hole) {
    const centerX = (hole.left + hole.right) / 2;
    const left = Math.min(Math.max(centerX - cardWidth / 2, CARD_MARGIN), vw - cardWidth - CARD_MARGIN);
    if (hole.bottom + CARD_MARGIN + CARD_ESTIMATED_HEIGHT <= vh - CARD_MARGIN) {
      cardStyle = { left: `${left}px`, top: `${hole.bottom + CARD_MARGIN}px`, width: `${cardWidth}px` };
    } else {
      cardStyle = { left: `${left}px`, bottom: `${vh - hole.top + CARD_MARGIN}px`, width: `${cardWidth}px` };
    }
  }

  return (
    <div className={style.overlay}>
      {hole ? (
        <>
          <div className={style.panel} style={{ height: `${hole.top}px`, left: 0, top: 0, width: `${vw}px` }} />
          <div className={style.panel} style={{ height: `${hole.bottom - hole.top}px`, left: 0, top: `${hole.top}px`, width: `${hole.left}px` }} />
          <div className={style.panel} style={{ height: `${hole.bottom - hole.top}px`, left: `${hole.right}px`, top: `${hole.top}px`, width: `${vw - hole.right}px` }} />
          <div className={style.panel} style={{ height: `${vh - hole.bottom}px`, left: 0, top: `${hole.bottom}px`, width: `${vw}px` }} />
          <div
            className={`${style.ring} ${step.interactive ? style.ringInteractive : ''}`}
            style={{ height: `${hole.bottom - hole.top}px`, left: `${hole.left}px`, top: `${hole.top}px`, width: `${hole.right - hole.left}px` }}
          />
        </>
      ) : (
        <div className={style.panel} style={{ inset: 0 }} />
      )}
      <div className={style.card} style={cardStyle} ref={cardRef}>
        <div className={style.title}>{step.title}</div>
        <div className={style.content}>{step.content}</div>
        <div className={style.footer}>
          <span className={style.counter}>{`${stepIndex + 1}/${steps.length}`}</span>
          <div className={style.actions}>
            <button type="button" className={style.skip} onClick={() => finish('skipped')}>
              {t('Skip')}
            </button>
            {stepIndex > 0 && (
              <button type="button" className={`${style.button} ${style.buttonGhost}`} onClick={goPrevious}>
                {t('Back')}
              </button>
            )}
            <button type="button" className={style.button} onClick={goNext}>
              {stepIndex === steps.length - 1 ? t('Finish') : t('Next')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default withTranslation()(Tour);

import { useMemo } from 'react';
import { withTranslation } from 'react-i18next';

import { computeCardStyle, computeHole } from './geometry';
import Spotlight from './Spotlight';
import TourCard from './TourCard';
import TOURS from './tours';
import useTour from './useTour';

import * as style from './style.module.css';

const Tour = ({ tourKey, t }) => {
  const steps = useMemo(() => (TOURS[tourKey] ? TOURS[tourKey](t) : []), [tourKey, t]);
  const { isOpen, step, stepIndex, stepCount, rect, goNext, goPrevious, finish } = useTour(tourKey, steps);

  if (!isOpen || !step || rect === undefined) {
    return null;
  }

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const hole = computeHole(rect, vw, vh);
  const cardStyle = computeCardStyle(hole, vw, vh);

  return (
    <div className={style.overlay}>
      <Spotlight hole={hole} interactive={step.interactive} vw={vw} vh={vh} />
      <TourCard step={step} stepIndex={stepIndex} stepCount={stepCount} cardStyle={cardStyle} onNext={goNext} onPrevious={goPrevious} onSkip={() => finish('skipped')} t={t} />
    </div>
  );
};

export default withTranslation()(Tour);

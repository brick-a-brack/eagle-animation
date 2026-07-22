import Button from '@components/Button';
import faChevronLeft from '@icons/faChevronLeft';

import * as style from './style.module.css';

// The step card: title, content and navigation controls. Purely presentational —
// all state and handlers come from the parent.
const TourCard = ({ step, stepIndex, stepCount, cardStyle, onNext, onPrevious, onSkip, t }) => (
  <div className={style.card} style={cardStyle}>
    <div className={style.title}>{step.title}</div>
    <div className={style.content}>{step.content}</div>
    <div className={style.footer}>
      <span className={style.counter}>{`${stepIndex + 1}/${stepCount}`}</span>
      <div className={style.actions}>
        <Button color="link" size="small" label={t('Skip')} onClick={onSkip} />
        {stepIndex > 0 && <Button color="ghost" size="small" icon={faChevronLeft} onClick={onPrevious} />}
        <Button color="primary" size="small" label={stepIndex === stepCount - 1 ? t('Finish') : t('Next')} onClick={onNext} />
      </div>
    </div>
  </div>
);

export default TourCard;

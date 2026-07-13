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
        <button type="button" className={style.skip} onClick={onSkip}>
          {t('Skip')}
        </button>
        {stepIndex > 0 && (
          <button type="button" className={`${style.button} ${style.buttonGhost}`} onClick={onPrevious}>
            {t('Back')}
          </button>
        )}
        <button type="button" className={style.button} onClick={onNext}>
          {stepIndex === stepCount - 1 ? t('Finish') : t('Next')}
        </button>
      </div>
    </div>
  </div>
);

export default TourCard;

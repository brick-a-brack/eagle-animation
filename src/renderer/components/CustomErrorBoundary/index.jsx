import ActionCard from '@components/ActionCard';
import PropTypes from 'prop-types';
import { Component } from 'react';
import { withTranslation } from 'react-i18next';

import * as style from './style.module.css';

class CustomErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    window.trackException(error);
  }

  render() {
    const { t, children } = this.props;
    const { hasError } = this.state;
    if (!hasError) {
      return children;
    }

    return (
      <div className={style.container}>
        <div>
          <h1 className={style.error}>{t('Oops!')}</h1>
          <h2 className={style.error}>{t('Something wrong happened...')}</h2>
          <div className={style.actions}>
            <ActionCard title={t('Restart app')} onClick={() => window.location.reload()} sizeAuto secondary />
          </div>
        </div>
      </div>
    );
  }
}

CustomErrorBoundary.propTypes = {
  children: PropTypes.any.isRequired,
};

export default withTranslation()(CustomErrorBoundary);

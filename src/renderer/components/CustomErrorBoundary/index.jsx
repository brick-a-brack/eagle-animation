import ActionCard from '@components/ActionCard';
import PropTypes from 'prop-types';
import { Component } from 'react';
import { withTranslation } from 'react-i18next';

import * as style from './style.module.css';
import useAppVersion from '@hooks/useAppVersion';
import { BUILD } from '@config-web';

const ReportButton = withTranslation()(({ t }) => {
  const { actions } = useAppVersion()
  return <ActionCard title={t('Report on Github')} onClick={() => actions?.openReportErrorPage()} sizeAuto secondary />
});

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
    this.setState({ error });
  }

  render() {
    const { t, children } = this.props;
    const { hasError, error } = this.state;
    if (!hasError) {
      return children;
    }

    const textError = error?.stack || error?.toString() || error?.message || null;

    return (
      <div className={style.container}>
        <div>
          <h1 className={style.error}>{t('Oops!')}</h1>
          <h2 className={style.error}>{t('Something wrong happened...')}</h2>
          {textError && <pre className={style.stack}>{textError}</pre>}
          <div className={style.version}>{t('Build: {{id}}', { id: BUILD })}</div>
          <div className={style.actions}>
            <ActionCard title={t('Restart app')} onClick={() => window.location.reload()} sizeAuto secondary />
            <ReportButton />
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

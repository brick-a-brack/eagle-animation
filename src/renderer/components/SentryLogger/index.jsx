import * as Sentry from '@sentry/browser';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { SENTRY_DSN, VERSION } from '../../config';
import * as style from './style.module.css';
import { withTranslation } from 'react-i18next';

if (SENTRY_DSN)
    Sentry.init({ dsn: SENTRY_DSN, release: VERSION });

class SentryLogger extends Component {
    constructor(props) {
        super(props);
        this.state = { error: null, eventId: null };
        this.lock = false;
    }

    onReport() {
        const { eventId } = this.state;
        Sentry.showReportDialog({ eventId });
    }

    static onReload() {
        document.location.reload(true);
    }

    componentDidCatch(error, errorInfo) {
        if (SENTRY_DSN && !this.lock) {
            this.lock = true;
            Sentry.withScope((scope) => {
                scope.setExtras(errorInfo);
                const eventId = Sentry.captureException(error);
                this.setState({ eventId });
            });
        }
        this.setState({ error });
    }

    render() {
        const { t } = this.props;
        const { error } = this.state;
        if (error) {
            return (
                <div className={style.container}>
                    <div>
                        <h1 className={style.error}>{t('Oops!')}</h1>
                        <h2 className={style.error}>{t('Something wrong happened...')}</h2>
                        <div className={style.actions}>
                            {SENTRY_DSN && (
                                <span
                                    role="button"
                                    tabIndex={0}
                                    className={style.button}
                                    onClick={() => { this.onReport(); }}
                                >
                                    {t('Report feedback')}
                                </span>
                            )}
                            {SENTRY_DSN && <span> | </span>}
                            <span
                                role="button"
                                tabIndex={0}
                                className={style.button}
                                onClick={SentryLogger.onReload}
                            >
                                {t('Restart app')}
                            </span>
                        </div>
                    </div>
                </div>
            );
        }
        const { children } = this.props;
        return children;
    }
}

SentryLogger.propTypes = {
    children: PropTypes.any.isRequired
};

export default withTranslation()(SentryLogger);

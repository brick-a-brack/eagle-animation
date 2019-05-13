import * as Sentry from '@sentry/browser';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { SENTRY_DSN, EA_VERSION, APP_NAME } from '../../config';
import styles from './styles.module.css';
import {
    FATAL_ERROR_TITLE, FATAL_ERROR_DETAIL, FATAL_ERROR_FEEDBACK, FATAL_ERROR_RESTART
} from '../../languages';

if (SENTRY_DSN)
    Sentry.init({ dsn: SENTRY_DSN, release: `${APP_NAME}@${EA_VERSION}` });

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
        const { error } = this.state;
        if (error) {
            return (
                <div className={styles.container}>
                    <div>
                        <h1 className={styles.error}>{FATAL_ERROR_TITLE}</h1>
                        <h2 className={styles.error}>{FATAL_ERROR_DETAIL}</h2>
                        <div className={styles.actions}>
                            {SENTRY_DSN && (
                                <span
                                    role="button"
                                    tabIndex={0}
                                    className={styles.button}
                                    onClick={() => { this.onReport() }}
                                    onKeyPress={() => { this.onReport() }}
                                >
                                    {FATAL_ERROR_FEEDBACK}
                                </span>
                            )}
                            {SENTRY_DSN && <span> | </span>}
                            <span
                                role="button"
                                tabIndex={0}
                                className={styles.button}
                                onClick={SentryLogger.onReload}
                                onKeyPress={SentryLogger.onReload}
                            >
                                {FATAL_ERROR_RESTART}
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

export default SentryLogger;

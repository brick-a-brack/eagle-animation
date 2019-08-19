import React, { Component } from 'react';
import PropTypes from 'prop-types';
import styles from './styles.module.css';
import { ReactComponent as Logo } from './assets/logo.svg';
import { openLink } from '../../core/utils';
import { UPDATE_DOWNLOAD } from '../../languages';

class Header extends Component {
    render() {
        const { link, version, canBeUpdated, latestVersion } = this.props;
        return (
            <div className={styles.container}>
                <div className={styles.logo}>
                    <Logo />
                </div>
                <div className={`${styles.version} ${canBeUpdated ? styles.update : ''}`}>
                    {canBeUpdated && (
                        <span
                            role="button"
                            tabIndex={0}
                            onClick={() => {
                                openLink(link);
                            }}
                            onKeyPress={() => {
                                openLink(link);
                            }}>
                            {UPDATE_DOWNLOAD}
                            <span>{version}{' → '}{latestVersion}</span>
                        </span>
                    )}
                    {!canBeUpdated && (
                        <span
                            role="button"
                            tabIndex={0}
                            onClick={() => {
                                openLink(link);
                            }}
                            onKeyPress={() => {
                                openLink(link);
                            }}
                        >
                            {version}
                        </span>
                    )}
                </div>
                <div className={styles.line} />
            </div>
        );
    }
}

Header.propTypes = {
    version: PropTypes.string.isRequired,
    link: PropTypes.string.isRequired,
    canBeUpdated: PropTypes.bool.isRequired,
    latestVersion: PropTypes.string.isRequired,
};

export default Header;

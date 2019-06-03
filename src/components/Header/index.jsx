import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { APP_NAME } from '../../languages';
import styles from './styles.module.css';
import { ReactComponent as Logo } from './assets/logo.svg';
import { openLink } from '../../core/utils';

class Header extends Component {
    render() {
        const { link, version } = this.props;
        return (
            <div className={styles.container}>
                <div className={styles.logo}>
                    <Logo />
                    <h1 className={styles.title}>{APP_NAME}</h1>
                </div>
                <div className={styles.version}>
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
                </div>
                <div className={styles.line} />
            </div>
        );
    }
}

Header.propTypes = {
    version: PropTypes.string.isRequired,
    link: PropTypes.string.isRequired
};

export default Header;

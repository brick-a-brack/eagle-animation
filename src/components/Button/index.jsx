import React, { Component } from 'react';
import PropTypes from 'prop-types';
import styles from './styles.module.css';

class Button extends Component {
    render() {
        const {
            icon, onClick, title, size, selected, children
        } = this.props;
        return (
            <div className={styles.mainContainer}>
                <div
                    {...((title) ? { 'data-tip': title } : {})}
                    role="button"
                    tabIndex={0}
                    onClick={() => onClick()
                    }
                    onKeyPress={() => { }}
                    className={`${(size === 'mini') ? styles.button_mini : styles.button} ${(selected) ? styles.selected : ''}`}
                >
                    {icon}
                </div>
                <div className={styles.containerMenu}>
                    {children}
                </div>
            </div>
        );
    }
}

Button.propTypes = {
    children: PropTypes.any,
    icon: PropTypes.any.isRequired,
    title: PropTypes.string,
    onClick: PropTypes.func,
    size: PropTypes.string.isRequired,
    selected: PropTypes.bool
};

Button.defaultProps = {
    children: false,
    title: '',
    selected: false,
    onClick: () => {}
};

export default Button;

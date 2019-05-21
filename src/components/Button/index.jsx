import React, { Component } from 'react';
import PropTypes from 'prop-types';
import styles from './styles.module.css';

class Button extends Component {
    render() {
        const {
            icon, onClick, title, size
        } = this.props;
        return (
            <span
                {...((title) ? { 'data-tip': title } : {})}
                role="button"
                tabIndex={0}
                onClick={() => onClick()
                }
                onKeyPress={() => onClick()}
                className={(size === 'mini') ? styles.button_mini : styles.button}
            >
                {icon}
            </span>
        );
    }
}

Button.propTypes = {
    icon: PropTypes.any.isRequired,
    title: PropTypes.string,
    onClick: PropTypes.func.isRequired,
    size: PropTypes.string.isRequired
};

Button.defaultProps = {
    title: ''
};

export default Button;

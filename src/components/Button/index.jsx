import React, { Component } from 'react';
import PropTypes from 'prop-types';
import styles from './styles.module.css';

class Button extends Component {
    render() {
        const {
            icon, onClick, title, size, selected
        } = this.props;
        return (
            <span
                {...((title) ? { 'data-tip': title } : {})}
                role="button"
                tabIndex={0}
                onClick={() => onClick()
                }
                onKeyPress={() => onClick()}
                className={`${(size === 'mini') ? styles.button_mini : styles.button} ${(selected) ? styles.selected : ''}`}
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
    size: PropTypes.string.isRequired,
    selected: PropTypes.bool
};

Button.defaultProps = {
    title: '',
    selected: false
};

export default Button;

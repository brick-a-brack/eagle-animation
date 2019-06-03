import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Button from '../Button';
import { ReactComponent as IconBack } from './assets/back.svg';
import {
    ANIMATOR_BUTTON_BACK
} from '../../languages';
import styles from './styles.module.css';

class LeftBar extends Component {
    render() {
        const { onAction } = this.props;

        return (
            <div className={styles.container}>
                <Button title={ANIMATOR_BUTTON_BACK} onClick={() => { onAction('HOME'); }} size="mini" icon={<IconBack />} />
            </div>
        );
    }
}

LeftBar.propTypes = {
    onAction: PropTypes.func.isRequired
};

export default LeftBar;

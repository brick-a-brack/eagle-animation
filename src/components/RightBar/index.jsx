import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Button from '../Button';
import { ReactComponent as IconExport } from './assets/export.svg';
import { ReactComponent as IconSettings } from './assets/settings.svg';
import styles from './styles.module.css';
import { ANIMATOR_BUTTON_SETTINGS, ANIMATOR_BUTTON_EXPORT } from '../../languages';

class RightBar extends Component {
    render() {
        const { onAction } = this.props;

        return (
            <div className={styles.container}>
                <Button title={ANIMATOR_BUTTON_SETTINGS} onClick={() => { onAction('SETTINGS'); }} size="mini" icon={<IconSettings />} />
                <Button title={ANIMATOR_BUTTON_EXPORT} onClick={() => { onAction('EXPORT'); }} size="mini" icon={<IconExport />} />
            </div>
        );
    }
}

RightBar.propTypes = {
    onAction: PropTypes.func.isRequired
};

export default RightBar;

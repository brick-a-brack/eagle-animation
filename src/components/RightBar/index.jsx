import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Button from '../Button';
import { ReactComponent as IconExport } from './assets/export.svg';
import { ReactComponent as IconSettings } from './assets/settings.svg';
import styles from './styles.module.css';
import { ANIMATOR_BUTTON_SETTINGS, ANIMATOR_BUTTON_EXPORT, SOON } from '../../languages';

class RightBar extends Component {
    render() {
        const { onExport, onSettings } = this.props;

        return (
            <div className={styles.container}>

                <Button title={ANIMATOR_BUTTON_SETTINGS} onClick={() => { window.alert(SOON); onSettings(); }} size="mini" icon={<IconSettings />} />
                <Button title={ANIMATOR_BUTTON_EXPORT} onClick={() => { onExport(); }} size="mini" icon={<IconExport />} />
            </div>
        );
    }
}

RightBar.propTypes = {
    onExport: PropTypes.func.isRequired,
    onSettings: PropTypes.func.isRequired
};

export default RightBar;

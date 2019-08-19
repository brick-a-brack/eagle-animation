import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Button from '../Button';
import { ReactComponent as IconExport } from './assets/export.svg';
import { ReactComponent as IconSettings } from './assets/settings.svg';
import { ReactComponent as IconDelete } from './assets/delete.svg';
import styles from './styles.module.css';
import { ANIMATOR_BUTTON_SETTINGS, ANIMATOR_BUTTON_EXPORT, ANIMATOR_BUTTON_DELETE_PROJECT } from '../../languages';

class RightBar extends Component {
    render() {
        const { onAction } = this.props;

        return (
            <div className={styles.container}>
                <Button title={ANIMATOR_BUTTON_SETTINGS} onClick={() => { onAction('SETTINGS'); }} size="mini" icon={<IconSettings />} />
                <Button title={ANIMATOR_BUTTON_EXPORT} onClick={() => { onAction('EXPORT'); }} size="mini" icon={<IconExport />} />
                <Button title={ANIMATOR_BUTTON_DELETE_PROJECT} onClick={() => { onAction('DELETE_PROJECT'); }} size="mini" icon={<IconDelete />} />
            </div>
        );
    }
}

RightBar.propTypes = {
    onAction: PropTypes.func.isRequired
};

export default RightBar;

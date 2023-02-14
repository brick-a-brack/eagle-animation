import React from 'react';
import * as style from './style.module.css';
import Logo from 'jsx:./assets/logo.svg';
import { withTranslation } from 'react-i18next';
import { compareVersions } from 'compare-versions';
import Action from '../Action';

const Header = ({
    action = null, version, latestVersion, t
}) => {
    const canBeUpdated = compareVersions(latestVersion || '0.0.0', version || '0.0.0') === 1;

    return (
        <div className={style.container}>
            <div className={style.logo}>
                <Logo />
            </div>
            <Action action={action} role="button" tabIndex={0} className={`${style.version} ${canBeUpdated ? style.update : ''}`}>
                {canBeUpdated && (
                    <>
                        <span>{t('Update available')}</span>
                        <span>{`${version || ''} → ${latestVersion || ''}`}</span>
                    </>
                )}
                {!canBeUpdated && (
                    <>
                        <span>{version}</span>
                    </>
                )}
            </Action>
            <div className={style.line} />
        </div >
    );
};

export default withTranslation()(Header);


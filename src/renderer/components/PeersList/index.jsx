import Button from '@components/Button';
import Input from '@components/Input';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import faKey from '@icons/faKey';
import faSignal from '@icons/faSignal';
import faTrash from '@icons/faTrash';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { withTranslation } from 'react-i18next';

import * as style from './style.module.css';

const parseHostPort = (url) => {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
};

const PeersList = ({ t, peers = [], onConnect = () => {}, onDelete = () => {} }) => {
  const [submitError, setSubmitError] = useState(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { isValid },
  } = useForm({
    mode: 'all',
    defaultValues: { host: '', token: '' },
  });

  const onSubmit = async ({ host, token }) => {
    const cleanHost = (host || '').trim();
    const cleanToken = (token || '').trim();
    setSubmitError(null);
    try {
      await onConnect(cleanHost, cleanToken || null);
      reset({ host: '', token: '' });
    } catch (err) {
      setSubmitError(err?.message || t('Connection failed'));
    }
  };

  return (
    <div className={style.container}>
      <h1 className={style.title}>{peers.length === 0 ? t('No devices connected') : t('{{count}} device connected', { count: peers.length })}</h1>

      <div className={style.formCard}>
        <form className={style.form} onSubmit={handleSubmit(onSubmit)}>
          <div className={style.fieldGroup}>
            <span className={style.fieldLabel}>{t('Device address')}</span>
            <Input className={style.field} placeholder="192.168.1.1:8040" register={register('host', { validate: (value) => (value || '').trim().length > 0 })} />
          </div>
          <div className={style.fieldGroup}>
            <span className={style.fieldLabel}>{t('Pairing code')}</span>
            <Input className={style.field} placeholder="RH8EA6" register={register('token')} />
          </div>
          {submitError && <p className={style.errorMessage}>{t('Failed to connect to the device')}</p>}
          <button type="submit" className={`${style.submitButton} ${!isValid ? style.submitButtonDisabled : ''}`} disabled={!isValid}>
            {t('Connect')}
          </button>
        </form>
      </div>

      {peers.length > 0 && (
        <ul className={style.list}>
          {peers.map((peer) => (
            <li key={peer.id} className={style.item}>
              <div className={style.info}>
                <span className={style.serverTag}>{t('Toucan Camera')}</span>
                <span className={style.url}>
                  <FontAwesomeIcon className={style.fieldIcon} icon={faSignal} />
                  {parseHostPort(peer.url)}
                </span>
                {peer.token ? (
                  <span className={style.token}>
                    <FontAwesomeIcon className={style.fieldIcon} icon={faKey} />
                    {peer.token}
                  </span>
                ) : null}
              </div>
              <Button icon={faTrash} title={t('Disconnect')} onClick={() => onDelete(peer.id)} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default withTranslation()(PeersList);

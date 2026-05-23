import Button from '@components/Button';
import Input from '@components/Input';
import faPaperPlane from '@icons/faPaperPlane';
import faTrash from '@icons/faTrash';
import { useForm } from 'react-hook-form';
import { withTranslation } from 'react-i18next';

import * as style from './style.module.css';

const PeersList = ({ t, peers = [], onConnect = () => {}, onDelete = () => {} }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { isValid },
  } = useForm({
    mode: 'all',
    defaultValues: { host: '', token: '' },
  });

  const onSubmit = ({ host, token }) => {
    const cleanHost = (host || '').trim();
    if (!cleanHost) {
      return;
    }
    const cleanToken = (token || '').trim();
    onConnect(cleanHost, cleanToken || null);
    reset({ host: '', token: '' });
  };

  return (
    <div className={style.container}>
      <ul className={style.list}>
        {peers.length === 0 && <li className={style.empty}>{t('No peer connected')}</li>}
        {peers.map((peer) => (
          <li key={peer.id} className={style.item}>
            <div className={style.info}>
              <span className={style.url}>{peer.url}</span>
              {peer.token ? <span className={style.token}>{peer.token}</span> : null}
            </div>
            <Button icon={faTrash} title={t('Disconnect')} onClick={() => onDelete(peer.id)} />
          </li>
        ))}
      </ul>

      <form className={style.form} onSubmit={handleSubmit(onSubmit)}>
        <Input className={style.field} placeholder={t('Host')} register={register('host', { validate: (value) => (value || '').trim().length > 0 })} />
        <Input className={style.field} placeholder={t('Token (optional)')} register={register('token')} />
        <Button icon={faPaperPlane} color="primary" title={t('Connect')} disabled={!isValid} onClick={handleSubmit(onSubmit)} />
      </form>
    </div>
  );
};

export default withTranslation()(PeersList);

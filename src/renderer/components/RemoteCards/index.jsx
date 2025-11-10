import * as style from './style.module.css';

const RemoteCards = ({ deviceId, connections = [], actions = {}, t }) => {
  const onConnect = () => {
    const val = document.getElementById('_ID')?.value;
    if (val && actions.connectTo) actions.connectTo(val);
  };

  const onAskCameras = async (id) => {
    if (actions.action) await actions.action(id, 'LIST_CAMERAS', {});
  };

  const copyId = async () => {
    if (!deviceId) return;
    try {
      await navigator.clipboard.writeText(deviceId);
    } catch (e) {
      // ignore
    }
  };

  return (
    <div className={style.container}>
      <div className={style.card}>
        <h2 className={style.title}>{t ? t('This device') : 'This device'}</h2>
        <div className={style.body}>
          <div className={style.deviceRow}>
            <div className={style.label}>{t ? t('My PEERID') : 'My PEERID'}</div>
            <input
              className={style.peerId}
              value={deviceId || ''}
              readOnly
              aria-label={t ? t('Peer ID') : 'Peer ID'}
            />
            <button className={style.copyButton} onClick={copyId}>
              {t ? t('Copy') : 'Copy'}
            </button>
          </div>

          <div className={style.sectionTitle}>{t ? t('Connections') : 'Connections'}</div>
          <ul className={style.list}>
            {connections.length === 0 && <li className={style.empty}>{t ? t('No connections') : 'No connections'}</li>}
            {connections.map((c) => (
              <li key={c.id} className={style.listItem}>
                <span className={style.connectionId}>{c.id}</span>
                <button className={style.smallButton} onClick={() => onAskCameras(c.id)}>
                  {t ? t('Ask cameras') : 'Ask cameras'}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className={style.card}>
        <h2 className={style.title}>{t ? t('Pair with code') : 'Pair with code'}</h2>
        <div className={style.body}>
          <p className={style.description}>{t ? t('Enter the code from the other device to pair') : 'Enter the code from the other device to pair'}</p>
          <div className={style.pairRow}>
            <input id="_ID" className={style.input} defaultValue="" placeholder={t ? t('Paste code here') : 'Paste code here'} />
            <button className={style.button} onClick={onConnect}>
              {t ? t('Connect') : 'Connect'}
            </button>
          </div>
          <div className={style.hint}>
            {t ? t('After pairing you will be able to share cameras and control the other device') : 'After pairing you will be able to share cameras and control the other device'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RemoteCards;

import { getOscActionAddress, getOscEventAddress, getOscStateAddress, OSC_ACTIONS, OSC_ARG_TYPE_LABELS, OSC_DOC_LINK, OSC_EVENTS, OSC_GROUPS, OSC_STATE_ADDRESS, OSC_STATE_FIELDS } from '@common/osc';
import Button from '@components/Button';
import Divider from '@components/Divider';
import Heading from '@components/Heading';
import { Fragment } from 'react';
import { withTranslation } from 'react-i18next';

import * as style from './style.module.css';

const formatArgs = (args = []) => args.map(({ key, type }) => `${OSC_ARG_TYPE_LABELS[type] || type} ${key}`).join('  ');

const groupBy = (items) =>
  Object.keys(OSC_GROUPS)
    .map((group) => ({ group, items: items.filter((item) => item.group === group) }))
    .filter(({ items }) => items.length > 0);

const ReferenceTable = ({ t, items, getAddress }) =>
  groupBy(items).map(({ group, items: groupItems }) => (
    <Fragment key={group}>
      <Heading h={3} className={style.group}>
        {OSC_GROUPS[group](t)}
      </Heading>
      {groupItems.map((item) => (
        <div key={item.name} className={style.line}>
          <div>
            <code className={style.address}>{getAddress(item.name)}</code>
            {item.args?.length > 0 && <code className={style.args}>{formatArgs(item.args)}</code>}
          </div>
          <div>{item.description(t)}</div>
        </div>
      ))}
    </Fragment>
  ));

const OscHelpWindow = ({ t }) => {
  return (
    <div className={style.container}>
      <Heading h={1}>{t('OSC remote control')}</Heading>
      <p className={style.text}>
        {t(
          'OSC (Open Sound Control) is a network protocol used by show control tools such as TouchOSC, Bitfocus Companion (Stream Deck), QLC+ or Arduino boards. It lets these tools control Eagle Animation and react to what happens in the app, for example to drive lights or a motion control rig.'
        )}
      </p>

      <Heading h={2}>{t('Configuration')}</Heading>
      <ul className={style.list}>
        <li>
          {t('Listening host and port: where Eagle Animation receives actions. Use 127.0.0.1 to accept messages from this computer only, or 0.0.0.0 to accept them from any device on the network.')}
        </li>
        <li>{t('Target host and port: where Eagle Animation sends events. Use the IP address of the device running your OSC tool.')}</li>
        <li>{t('Both apps can not listen on the same port of the same computer: when the target is local, use two different ports.')}</li>
        <li>{t('With TCP, packets are framed with SLIP (OSC 1.1).')}</li>
        <li>{t('Buttons sending 0 or False on release are ignored, so a press triggers the action only once.')}</li>
      </ul>

      <Divider />
      <Heading h={2}>{t('Actions (incoming)')}</Heading>
      <p className={style.text}>{t('Send these addresses to Eagle Animation while a project is opened. Unknown addresses are ignored.')}</p>
      <ReferenceTable t={t} items={OSC_ACTIONS} getAddress={getOscActionAddress} />

      <Divider />
      <Heading h={2}>{t('Events (outgoing)')}</Heading>
      <p className={style.text}>{t('Sent to the target host and port. Frame and scene indexes start at 0.')}</p>
      <ReferenceTable t={t} items={OSC_EVENTS} getAddress={getOscEventAddress} />

      <Divider />
      <Heading h={2}>{t('State')}</Heading>
      <p className={style.text}>{t('Send {{address}} to receive the current state. The reply is sent back to the sender as a bundle containing these messages:', { address: OSC_STATE_ADDRESS })}</p>
      {OSC_STATE_FIELDS.map((field) => (
        <div key={field.name} className={style.line}>
          <div>
            <code className={style.address}>{getOscStateAddress(field.name)}</code>
            <code className={style.args}>{formatArgs(field.args)}</code>
          </div>
          <div>{field.description(t)}</div>
        </div>
      ))}

      <Divider />
      <div className={style.actions}>
        <Button size="small" color="primary" label={t('Full documentation')} onClick={() => window.EA('OPEN_LINK', { link: OSC_DOC_LINK })} />
      </div>
    </div>
  );
};

export default withTranslation()(OscHelpWindow);

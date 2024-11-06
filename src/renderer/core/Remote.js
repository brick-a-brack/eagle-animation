import { isEdge } from '@braintree/browser-detection';
import isFirefox from '@braintree/browser-detection/is-firefox';
import Peer from 'peerjs';
import { v4 } from 'uuid';

import { getCameras } from '../cameras';

const ActionsHandler = async (action, data) => {
  if (action === 'LIST_CAMERAS') {
    const cameras = await getCameras(false);
    return { cameras };
  }
};

class Remote {
  constructor() {
    this._id = null;
    this._listeners = [];
    this._connections = [];
    this._peer = new Peer(isEdge() ? 'ea-firefox-test' : 'ea-chrome-test');
    this._peer.on('open', (id) => {
      this._id = id;
    });

    this._peer.on('connection', (conn) => {
      conn.on('open', () => {
        this._connections.push(conn);
      });
      conn.on('close', () => {
        this._connections.filter((e) => e !== conn);
      });
      conn.on('error', (err) => {
        console.error(err);
        this._connections.filter((e) => e !== conn);
      });
      conn.on('data', (data) => this._onData(conn.peer, data));
    });
  }

  get connections() {
    return this._connections.map((c) => ({ id: c.peer, connection: c }));
  }

  addEventListener(name, callback) {
    this._listeners.push({ name, callback });
  }

  removeEventListener(name, callback) {
    this._listeners = this._listeners.filter((l) => l.name !== name || l.callback !== callback);
  }

  async _onData(connectionId, data) {
    const conn = this._connections.find((e) => e.peer === connectionId);
    if (!conn) {
      console.error('conn not found');
      return;
    }

    console.log('onData', data, this._listeners);
    for (const listener of this._listeners) {
      if (listener.name === 'data') {
        listener.callback(data);
      }
    }

    const outData = await ActionsHandler(data.action, data.data);
    if (typeof outData !== 'undefined') {
      conn.send(JSON.parse(JSON.stringify({ id: data.id, action: `${data.action}_REPLY`, data: outData })));
    }
  }

  get deviceId() {
    return this._id;
  }

  action(connectionId, action, data = {}) {
    console.log('CTION', connectionId, action, data);
    const conn = this._connections.find((e) => e.peer === connectionId);
    if (!conn) {
      console.error('conn not found');
      return;
    }

    const id = v4();
    console.log('id', id);

    return new Promise((resolve, reject) => {
      const callback = (data) => {
        if (data.id !== id) {
          return;
        }
        console.log('RRR', data);
        resolve(data.data);
        this.removeEventListener('data', callback);
      };
      this.addEventListener('data', callback);
      console.log('SEND');
      conn.send({ id, action: `${action}`, data });
    });
  }

  connectTo(id) {
    const conn = this._peer.connect(id);
    conn.on('open', () => {
      this._connections.push(conn);
    });
    conn.on('data', (data) => this._onData(conn.peer, data));
  }
}

const remote = new Remote();

export default remote;

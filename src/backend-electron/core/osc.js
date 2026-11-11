import dgram from 'node:dgram';
import net from 'node:net';
import { networkInterfaces } from 'node:os';

import { fromBuffer, toBuffer } from 'osc-min';

import { getOscActionAddress, getOscEventAddress, getOscStateAddress, OSC_ACTIONS, OSC_DEFAULT_SETTINGS, OSC_DEFAULT_STATE, OSC_EVENTS, OSC_STATE_ADDRESS, OSC_STATE_FIELDS } from '../../common/osc';

const ACTIONS_BY_ADDRESS = Object.fromEntries(OSC_ACTIONS.map((action) => [getOscActionAddress(action.name), action.name]));
const EVENTS_BY_NAME = Object.fromEntries(OSC_EVENTS.map((event) => [event.name, event]));

const APPLY_DEBOUNCE_MS = 300;
const TCP_RECONNECT_DELAY_MS = 2000;
const SLIP_MAX_PACKET_SIZE = 65536;

let config = null;
let status = { state: 'DISABLED', message: null, addresses: [] };
let currentState = { ...OSC_DEFAULT_STATE };
let handlers = { onAction: () => {}, onStatus: () => {} };

let udpSocket = null;
let tcpServer = null;
let tcpClients = new Set();
let tcpTarget = null;
let tcpTargetLastAttempt = 0;
let applyTimer = null;

const setStatus = (state, message = null) => {
  const addresses = state === 'LISTENING' ? getListenAddresses(config) : [];
  status = { state, message, addresses };
  handlers.onStatus(status);
};

// Lists the addresses remote devices can use, 0.0.0.0 expands to every IPv4 interface
const getListenAddresses = ({ listenHost, listenPort }) => {
  if (listenHost !== '0.0.0.0') {
    return [`${listenHost}:${listenPort}`];
  }
  return Object.values(networkInterfaces())
    .flat()
    .filter((e) => e && e.family === 'IPv4' && !e.internal)
    .map((e) => `${e.address}:${listenPort}`);
};

const parsePort = (value) => {
  const port = Number(value);
  return Number.isInteger(port) && port > 0 && port < 65536 ? port : null;
};

const normalizeConfig = (settings = {}) => {
  const s = { ...OSC_DEFAULT_SETTINGS, ...settings };
  return {
    enabled: !!s.OSC_ENABLED,
    protocol: s.OSC_PROTOCOL === 'tcp' ? 'tcp' : 'udp',
    listenHost: `${s.OSC_LISTEN_HOST || ''}`.trim() || OSC_DEFAULT_SETTINGS.OSC_LISTEN_HOST,
    listenPort: parsePort(s.OSC_LISTEN_PORT),
    targetHost: `${s.OSC_TARGET_HOST || ''}`.trim() || OSC_DEFAULT_SETTINGS.OSC_TARGET_HOST,
    targetPort: parsePort(s.OSC_TARGET_PORT),
    sendFramePlayed: !!s.OSC_SEND_FRAME_PLAYED,
  };
};

// ---- Encoding

const toOscArg = (type, value) => {
  if (type === 'i') return { type: 'integer', value: Math.round(Number(value) || 0) };
  if (type === 'f') return { type: 'float', value: Number(value) || 0 };
  if (type === 'T') return { type: value ? 'true' : 'false' };
  return { type: 'string', value: `${value ?? ''}` };
};

const toOscMessage = (address, args = [], values = {}) => ({
  oscType: 'message',
  address,
  args: args.map(({ key, type }) => toOscArg(type, values[key])),
});

const encode = (packet) => {
  const view = toBuffer(packet);
  return Buffer.from(view.buffer, view.byteOffset, view.byteLength);
};

const buildStateBundle = () =>
  encode({
    oscType: 'bundle',
    timetag: [0, 1],
    elements: OSC_STATE_FIELDS.map((field) => toOscMessage(getOscStateAddress(field.name), field.args, currentState)),
  });

// ---- SLIP framing (OSC 1.1 over TCP)

const SLIP_END = 0xc0;
const SLIP_ESC = 0xdb;
const SLIP_ESC_END = 0xdc;
const SLIP_ESC_ESC = 0xdd;

const slipEncode = (buffer) => {
  const bytes = [SLIP_END];
  for (const byte of buffer) {
    if (byte === SLIP_END) bytes.push(SLIP_ESC, SLIP_ESC_END);
    else if (byte === SLIP_ESC) bytes.push(SLIP_ESC, SLIP_ESC_ESC);
    else bytes.push(byte);
  }
  bytes.push(SLIP_END);
  return Buffer.from(bytes);
};

const createSlipDecoder = (onPacket) => {
  let bytes = [];
  let escaped = false;
  return (chunk) => {
    for (const byte of chunk) {
      if (escaped) {
        bytes.push(byte === SLIP_ESC_END ? SLIP_END : byte === SLIP_ESC_ESC ? SLIP_ESC : byte);
        escaped = false;
      } else if (byte === SLIP_ESC) {
        escaped = true;
      } else if (byte === SLIP_END) {
        if (bytes.length) onPacket(Buffer.from(bytes));
        bytes = [];
      } else {
        bytes.push(byte);
      }
      // A peer that never sends END would grow the buffer forever
      if (bytes.length > SLIP_MAX_PACKET_SIZE) bytes = [];
    }
  };
};

// ---- Incoming messages

// Buttons (TouchOSC, Companion…) usually send 1 on press and 0 on release, only the press triggers the action
const isReleaseMessage = (message) => {
  const first = message.args?.[0];
  if (!first) return false;
  if (first.type === 'false') return true;
  return (first.type === 'integer' || first.type === 'float' || first.type === 'double') && Number(first.value) === 0;
};

const handleMessage = (message, reply) => {
  if (message.address === OSC_STATE_ADDRESS) {
    reply(buildStateBundle());
    return;
  }
  const action = ACTIONS_BY_ADDRESS[message.address];
  if (action && !isReleaseMessage(message)) {
    handlers.onAction(action);
  }
};

const handlePacket = (packet, reply) => {
  if (packet.oscType === 'bundle') {
    packet.elements.forEach((element) => handlePacket(element, reply));
  } else {
    handleMessage(packet, reply);
  }
};

const handleData = (buffer, reply) => {
  try {
    handlePacket(fromBuffer(buffer), reply);
  } catch (err) {
    console.warn('⚠️ OSC invalid packet ignored', err?.message || err);
  }
};

// ---- Transports

const startUdp = () => {
  const socket = dgram.createSocket('udp4');
  udpSocket = socket;
  socket.on('error', (err) => {
    console.error('❌ OSC UDP error', err);
    if (udpSocket === socket) setStatus('ERROR', err?.message || `${err}`);
  });
  socket.on('message', (buffer, rinfo) => {
    handleData(buffer, (data) => socket.send(data, rinfo.port, rinfo.address));
  });
  socket.bind(config.listenPort, config.listenHost, () => {
    if (udpSocket !== socket) return;
    console.log(`🎛️ OSC listening on udp://${config.listenHost}:${config.listenPort}`);
    setStatus('LISTENING');
  });
};

const startTcp = () => {
  const server = net.createServer((socket) => {
    tcpClients.add(socket);
    const decode = createSlipDecoder((buffer) => handleData(buffer, (data) => socket.write(slipEncode(data))));
    socket.on('data', decode);
    socket.on('error', () => socket.destroy());
    socket.on('close', () => tcpClients.delete(socket));
  });
  tcpServer = server;
  server.on('error', (err) => {
    console.error('❌ OSC TCP error', err);
    if (tcpServer === server) setStatus('ERROR', err?.message || `${err}`);
  });
  server.listen(config.listenPort, config.listenHost, () => {
    if (tcpServer !== server) return;
    console.log(`🎛️ OSC listening on tcp://${config.listenHost}:${config.listenPort}`);
    setStatus('LISTENING');
  });
};

// Outgoing TCP connection, opened on the first event and retried at most every TCP_RECONNECT_DELAY_MS
const getTcpTarget = () => {
  if (tcpTarget) return tcpTarget;
  if (Date.now() - tcpTargetLastAttempt < TCP_RECONNECT_DELAY_MS) return null;
  tcpTargetLastAttempt = Date.now();
  const socket = net.connect({ host: config.targetHost, port: config.targetPort });
  socket.on('error', (err) => console.warn('⚠️ OSC TCP target unreachable', err?.message || err));
  socket.on('close', () => {
    if (tcpTarget === socket) tcpTarget = null;
  });
  tcpTarget = socket;
  return socket;
};

const send = (buffer) => {
  if (!config?.enabled || !config.targetPort || status.state !== 'LISTENING') return;
  if (config.protocol === 'udp') {
    udpSocket?.send(buffer, config.targetPort, config.targetHost, (err) => {
      if (err) console.warn('⚠️ OSC send failed', err?.message || err);
    });
  } else {
    getTcpTarget()?.write(slipEncode(buffer));
  }
};

const stop = () => {
  if (udpSocket) {
    const socket = udpSocket;
    udpSocket = null;
    try {
      socket.close();
    } catch (err) {
      // Already closed after a bind error
    }
  }
  if (tcpServer) {
    tcpServer.close();
    tcpServer = null;
  }
  tcpClients.forEach((socket) => socket.destroy());
  tcpClients.clear();
  tcpTarget?.destroy();
  tcpTarget = null;
  tcpTargetLastAttempt = 0;
};

const start = () => {
  if (!config.enabled) {
    setStatus('DISABLED');
    return;
  }
  if (!config.listenPort || !config.targetPort) {
    setStatus('ERROR', 'Invalid port');
    return;
  }
  setStatus('STARTING');
  try {
    if (config.protocol === 'tcp') startTcp();
    else startUdp();
  } catch (err) {
    console.error('❌ OSC failed to start', err);
    setStatus('ERROR', err?.message || `${err}`);
  }
};

// ---- Public API

export const setOscHandlers = ({ onAction = () => {}, onStatus = () => {} } = {}) => {
  handlers = { onAction, onStatus };
};

// Debounced because the settings form saves on every keystroke
export const applyOscSettings = (settings) => {
  clearTimeout(applyTimer);
  applyTimer = setTimeout(() => {
    const newConfig = normalizeConfig(settings);
    if (JSON.stringify(newConfig) === JSON.stringify(config)) return;
    stop();
    config = newConfig;
    start();
  }, APPLY_DEBOUNCE_MS);
};

export const getOscStatus = () => status;

export const setOscState = (state = {}) => {
  currentState = { ...OSC_DEFAULT_STATE, ...state };
};

export const sendOscEvent = (name, payload = {}) => {
  const event = EVENTS_BY_NAME[name];
  if (!event || (event.optIn && !config?.sendFramePlayed)) return;
  try {
    send(encode(toOscMessage(getOscEventAddress(name), event.args, payload)));
  } catch (err) {
    console.warn('⚠️ OSC event not sent', name, err?.message || err);
  }
};

export const stopOsc = () => {
  clearTimeout(applyTimer);
  stop();
};

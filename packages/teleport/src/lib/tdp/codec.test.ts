const { TextEncoder, TextDecoder } = require('util');
import Codec, {
  MessageType,
  ButtonState,
  MouseButton,
  ScrollAxis,
} from './codec';

// Use nodejs TextEncoder until jsdom adds support for TextEncoder (https://github.com/jsdom/jsdom/issues/2524)
window.TextEncoder = window.TextEncoder || TextEncoder;
window.TextDecoder = window.TextDecoder || TextDecoder;
const codec = new Codec();

test('encodes the screen spec', () => {
  const w = 1800;
  const h = 1200;
  const message = codec.encodeScreenSpec(w, h);
  const view = new DataView(message);
  expect(view.getUint8(0)).toEqual(MessageType.CLIENT_SCREEN_SPEC);
  expect(view.getUint32(1)).toEqual(w);
  expect(view.getUint32(5)).toEqual(h);
});

test('encodes mouse moves', () => {
  const x = 0;
  const y = Math.pow(2, 32) - 1;
  const message = codec.encodeMouseMove(x, y);
  const view = new DataView(message);
  expect(view.getUint8(0)).toEqual(MessageType.MOUSE_MOVE);
  expect(view.getUint32(1)).toEqual(x);
  expect(view.getUint32(5)).toEqual(y);
});

test('encodes mouse buttons', () => {
  [0, 1, 2].forEach(button => {
    [ButtonState.DOWN, ButtonState.UP].forEach(state => {
      const message = codec.encodeMouseButton(button as MouseButton, state);
      const view = new DataView(message);
      expect(view.getUint8(0)).toEqual(MessageType.MOUSE_BUTTON);
      expect(view.getUint8(1)).toEqual(button);
      expect(view.getUint8(2)).toEqual(state);
    });
  });
});

// Username/password tests inspired by https://github.com/google/closure-library/blob/master/closure/goog/crypt/crypt_test.js (Apache License)
test('encodes typical characters for username and password', () => {
  // Create a test value with letters, symbols, and numbers and its known UTF8 encodings
  const username = 'Helloworld!*@123';
  const usernameUTF8 = [
    0x0048, 0x0065, 0x006c, 0x006c, 0x006f, 0x0077, 0x006f, 0x0072, 0x006c,
    0x0064, 0x0021, 0x002a, 0x0040, 0x0031, 0x0032, 0x0033,
  ];

  // Encode test vals
  const message = codec.encodeUsername(username);
  const view = new DataView(message);

  // Walk through output
  let offset = 0;
  expect(view.getUint8(offset++)).toEqual(MessageType.CLIENT_USERNAME);
  expect(view.getUint32(offset)).toEqual(usernameUTF8.length);
  offset += 4;
  usernameUTF8.forEach(byte => {
    expect(view.getUint8(offset++)).toEqual(byte);
  });
});

test('encodes utf8 characters correctly up to 3 bytes for username and password', () => {
  const first3RangesString = '\u0000\u007F\u0080\u07FF\u0800\uFFFF';
  const first3RangesUTF8 = [
    0x00, 0x7f, 0xc2, 0x80, 0xdf, 0xbf, 0xe0, 0xa0, 0x80, 0xef, 0xbf, 0xbf,
  ];
  const message = codec.encodeUsername(first3RangesString);
  const view = new DataView(message);
  let offset = 0;
  expect(view.getUint8(offset++)).toEqual(MessageType.CLIENT_USERNAME);
  expect(view.getUint32(offset)).toEqual(first3RangesUTF8.length);
  offset += 4;
  first3RangesUTF8.forEach(byte => {
    expect(view.getUint8(offset++)).toEqual(byte);
  });
});

test('encodes mouse wheel scroll event', () => {
  const axis = ScrollAxis.VERTICAL;
  const delta = 860;
  const message = codec.encodeMouseWheelScroll(axis, delta);
  const view = new DataView(message);
  expect(view.getUint8(0)).toEqual(MessageType.MOUSE_WHEEL_SCROLL);
  expect(view.getUint8(1)).toEqual(axis);
  expect(view.getUint16(2)).toEqual(delta);
});

function makeBufView(type: MessageType, size = 100) {
  const buffer = new ArrayBuffer(size);
  const view = new DataView(buffer);
  view.setUint8(0, type);
  return { buffer, view };
}

test('decodes message types', () => {
  const { buffer: pngFrameBuf, view: pngFrameView } = makeBufView(
    MessageType.PNG_FRAME
  );
  const { buffer: clipboardBuf, view: clipboardView } = makeBufView(
    MessageType.CLIPBOARD_DATA
  );
  const { buffer: errorBuf, view: errorView } = makeBufView(MessageType.ERROR);
  const { buffer: cliScreenBuf, view: cliScreenView } = makeBufView(
    MessageType.CLIENT_SCREEN_SPEC
  );

  pngFrameView.setUint8(0, MessageType.PNG_FRAME);
  expect(codec.decodeMessageType(pngFrameBuf)).toEqual(MessageType.PNG_FRAME);

  clipboardView.setUint8(0, MessageType.CLIPBOARD_DATA);
  expect(codec.decodeMessageType(clipboardBuf)).toEqual(
    MessageType.CLIPBOARD_DATA
  );

  errorView.setUint8(0, MessageType.ERROR);
  expect(codec.decodeMessageType(errorBuf)).toEqual(MessageType.ERROR);

  // We only expect to need to decode png frames and clipboard data.
  cliScreenView.setUint8(0, MessageType.CLIENT_SCREEN_SPEC);
  expect(() => {
    codec.decodeMessageType(cliScreenBuf);
  }).toThrow(`invalid message type: ${MessageType.CLIENT_SCREEN_SPEC}`);
});

test('decodes regions', () => {
  const { buffer, view } = makeBufView(MessageType.PNG_FRAME);
  view.setUint32(1, 0);
  view.setUint32(5, 0);
  view.setUint32(9, 64);
  view.setUint32(13, 64);

  const region = codec.decodeRegion(buffer);
  expect(region.top).toBe(0);
  expect(region.left).toBe(0);
  expect(region.bottom).toBe(64);
  expect(region.right).toBe(64);
});

test('decodes errors', () => {
  // First encode an error
  const encoder = new TextEncoder();
  const message = encoder.encode('An error occured');
  const bufLen = 1 + 4 + message.length;
  const tdpErrorBuffer = new ArrayBuffer(bufLen);
  const view = new DataView(tdpErrorBuffer);
  let offset = 0;
  view.setUint8(offset++, MessageType.ERROR);
  view.setUint32(offset, message.length);
  offset += 4; // 4 bytes to offset 32-bit uint
  message.forEach(byte => {
    view.setUint8(offset++, byte);
  });

  const error = codec.decodeErrorMessage(tdpErrorBuffer);
  expect(error).toBe('An error occured');
});

const os = require('os');
const util = require('util');
const { Blob } = require('buffer');
const { ReadableStream } = require('stream/web');
const nodeFetch = require('node-fetch');

if (!globalThis.Blob) {
  globalThis.Blob = Blob;
}

if (!globalThis.ReadableStream) {
  globalThis.ReadableStream = ReadableStream;
}

if (!globalThis.WebSocket) {
  try {
    globalThis.WebSocket = require('ws');
  } catch (e) {}
}

const nodeStream = require('stream');
if (!nodeStream.Readable.fromWeb) {
  nodeStream.Readable.fromWeb = function fromWeb(webStream) {
    const reader = webStream.getReader();
    return new nodeStream.Readable({
      async read() {
        try {
          const { done, value } = await reader.read();
          if (done) {
            this.push(null);
          } else {
            this.push(Buffer.isBuffer(value) ? value : Buffer.from(value));
          }
        } catch (err) {
          this.destroy(err);
        }
      }
    });
  };
}

if (!nodeStream.Readable.toWeb) {
  nodeStream.Readable.toWeb = function toWeb(nodeReadable) {
    if (!nodeReadable) return null;
    return new ReadableStream({
      start(controller) {
        nodeReadable.on('data', (chunk) => {
          controller.enqueue(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        });
        nodeReadable.on('end', () => {
          try { controller.close(); } catch (e) {}
        });
        nodeReadable.on('error', (err) => {
          try { controller.error(err); } catch (e) {}
        });
      },
      cancel() {
        if (typeof nodeReadable.destroy === 'function') {
          nodeReadable.destroy();
        }
      }
    });
  };
}

if (!globalThis.File) {
  class File extends Blob {
    constructor(chunks, name, opts) {
      super(chunks, opts);
      this.name = name;
      this.lastModified = opts?.lastModified || Date.now();
    }
  }
  globalThis.File = File;
}

if (!URL.canParse) {
  URL.canParse = function canParse(url, base) {
    try {
      new URL(url, base);
      return true;
    } catch {
      return false;
    }
  };
}

function toWebStream(body) {
  if (!body) return null;
  if (typeof body.getReader === 'function') return body;
  if (Buffer.isBuffer(body) || typeof body === 'string') {
    const buf = Buffer.isBuffer(body) ? body : Buffer.from(body);
    return new ReadableStream({
      start(controller) {
        controller.enqueue(buf);
        controller.close();
      }
    });
  }
  if (typeof body.on === 'function') {
    return new ReadableStream({
      start(controller) {
        body.on('data', (chunk) => controller.enqueue(chunk));
        body.on('end', () => controller.close());
        body.on('error', (err) => controller.error(err));
      },
      cancel() {
        if (typeof body.destroy === 'function') body.destroy();
      }
    });
  }
  return body;
}

const origBodyDesc = Object.getOwnPropertyDescriptor(nodeFetch.Response.prototype, 'body');

class WebResponse extends nodeFetch.Response {
  constructor(body, init) {
    if (body && typeof body.getReader === 'function') {
      super(null, init);
      this._webStream = body;
    } else {
      super(body, init);
    }
  }
  get body() {
    if (this._webStream) return this._webStream;
    const orig = origBodyDesc.get.call(this);
    return toWebStream(orig);
  }
  async text() {
    if (this._webStream) {
      const reader = this._webStream.getReader();
      const chunks = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(Buffer.isBuffer(value) ? value : Buffer.from(value));
      }
      return Buffer.concat(chunks).toString('utf8');
    }
    return super.text();
  }
  async json() {
    const txt = await this.text();
    return JSON.parse(txt);
  }
  async arrayBuffer() {
    if (this._webStream) {
      const reader = this._webStream.getReader();
      const chunks = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(Buffer.isBuffer(value) ? value : Buffer.from(value));
      }
      const buf = Buffer.concat(chunks);
      return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
    }
    return super.arrayBuffer();
  }
}

globalThis.Response = WebResponse;
nodeFetch.Response = WebResponse;

const rawFetch = nodeFetch.default || nodeFetch;
let cachedNativeModules = null;
try {
  const fs = require('fs');
  const path = require('path');
  const cachePath = path.join(__dirname, 'native-modules-57.json');
  if (fs.existsSync(cachePath)) {
    cachedNativeModules = fs.readFileSync(cachePath, 'utf8');
  }
} catch (e) {}

globalThis.fetch = async function robustFetch(url, options) {
  const urlStr = typeof url === 'string' ? url : (url && url.url) || '';
  if (urlStr.includes('api.expo.dev/v2/sdks/57.0.0/native-modules') && cachedNativeModules) {
    return new nodeFetch.Response(cachedNativeModules, {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }
  try {
    return await rawFetch(url, options);
  } catch (err) {
    if (urlStr.includes('native-modules') && cachedNativeModules) {
      return new nodeFetch.Response(cachedNativeModules, {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }
    throw err;
  }
};
if (!globalThis.Request) {
  globalThis.Request = nodeFetch.Request;
}
if (!globalThis.Headers) {
  globalThis.Headers = nodeFetch.Headers;
}

if (!Array.prototype.toReversed) {
  Array.prototype.toReversed = function () {
    return [...this].reverse();
  };
}

if (!Array.prototype.toSorted) {
  Array.prototype.toSorted = function (compareFn) {
    return [...this].sort(compareFn);
  };
}

if (!Array.prototype.toSpliced) {
  Array.prototype.toSpliced = function (start, deleteCount, ...items) {
    const copy = [...this];
    copy.splice(start, deleteCount, ...items);
    return copy;
  };
}

if (!Array.prototype.with) {
  Array.prototype.with = function (index, value) {
    const copy = [...this];
    copy[index] = value;
    return copy;
  };
}

if (!os.availableParallelism) {
  os.availableParallelism = () => (os.cpus() ? os.cpus().length : 4);
}

if (!util.parseEnv) {
  util.parseEnv = function parseEnv(content) {
    const res = {};
    if (!content) return res;
    const lines = content.toString().split(/\r\n|\r|\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        res[key] = val;
      }
    }
    return res;
  };
}

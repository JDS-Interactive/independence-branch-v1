// pngmeta.js
// Minimal PNG tEXt chunk writer/reader for embedding small metadata into a PNG.
// Intended for transparency + consistency verification in V1.
// NOTE: Social platforms often strip metadata. Use this for "vault images", not guaranteed for posted images.

(function(global){
  const textKey = "IB_V1";

  function crc32(buf) {
    // Standard CRC32 implementation
    let crc = 0 ^ (-1);
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ buf[i]) & 0xFF];
    }
    return (crc ^ (-1)) >>> 0;
  }

  const CRC_TABLE = (() => {
    const table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      table[i] = c >>> 0;
    }
    return table;
  })();

  function u32be(n){
    const b = new Uint8Array(4);
    b[0] = (n >>> 24) & 255;
    b[1] = (n >>> 16) & 255;
    b[2] = (n >>> 8) & 255;
    b[3] = n & 255;
    return b;
  }

  function concatBytes(...parts){
    const total = parts.reduce((s,p)=>s+p.length,0);
    const out = new Uint8Array(total);
    let o=0;
    for (const p of parts){ out.set(p,o); o+=p.length; }
    return out;
  }

  function strToBytes(s){
    return new TextEncoder().encode(s);
  }
  function bytesToStr(b){
    return new TextDecoder().decode(b);
  }

  function isPng(bytes){
    if (bytes.length < 8) return false;
    const sig = [137,80,78,71,13,10,26,10];
    for (let i=0;i<8;i++) if (bytes[i] !== sig[i]) return false;
    return true;
  }

  function buildTextChunk(key, valueStr){
    // tEXt chunk format: keyword (latin1) + null + text (latin1/utf-8; we use utf-8 bytes)
    const type = strToBytes("tEXt");
    const keyBytes = strToBytes(key);
    const zero = new Uint8Array([0]);
    const valBytes = strToBytes(valueStr);
    const data = concatBytes(keyBytes, zero, valBytes);

    const len = u32be(data.length);
    const crc = u32be(crc32(concatBytes(type, data)));
    return concatBytes(len, type, data, crc);
  }

  function addTextChunkToPng(pngBytes, key, valueStr){
    // Insert before IEND chunk.
    if (!isPng(pngBytes)) throw new Error("Not a PNG file.");

    let offset = 8; // after signature
    while (offset + 8 <= pngBytes.length) {
      const len = (pngBytes[offset]<<24) | (pngBytes[offset+1]<<16) | (pngBytes[offset+2]<<8) | (pngBytes[offset+3]);
      const type = bytesToStr(pngBytes.slice(offset+4, offset+8));
      const chunkTotal = 12 + (len >>> 0);

      if (type === "IEND") {
        const before = pngBytes.slice(0, offset);
        const iendAndAfter = pngBytes.slice(offset);
        const textChunk = buildTextChunk(key, valueStr);
        return concatBytes(before, textChunk, iendAndAfter);
      }
      offset += chunkTotal;
    }
    throw new Error("PNG missing IEND chunk.");
  }

  function extractTextChunks(pngBytes){
    if (!isPng(pngBytes)) throw new Error("Not a PNG file.");
    const found = [];
    let offset = 8;
    while (offset + 8 <= pngBytes.length) {
      const len = (pngBytes[offset]<<24) | (pngBytes[offset+1]<<16) | (pngBytes[offset+2]<<8) | (pngBytes[offset+3]);
      const type = bytesToStr(pngBytes.slice(offset+4, offset+8));
      const dataStart = offset + 8;
      const dataEnd = dataStart + (len >>> 0);
      if (dataEnd + 4 > pngBytes.length) break;

      if (type === "tEXt") {
        const data = pngBytes.slice(dataStart, dataEnd);
        // keyword\0text
        const zeroIdx = data.indexOf(0);
        if (zeroIdx > 0) {
          const k = bytesToStr(data.slice(0, zeroIdx));
          const v = bytesToStr(data.slice(zeroIdx+1));
          found.push({ key: k, value: v });
        }
      }
      offset = dataEnd + 4; // skip CRC
    }
    return found;
  }

  function b64EncodeStr(s){
    return btoa(unescape(encodeURIComponent(s)));
  }
  function b64DecodeStr(b64){
    return decodeURIComponent(escape(atob(b64)));
  }

  async function canvasToPngBytes(canvas){
    const blob = await new Promise(res => canvas.toBlob(res, "image/png"));
    const ab = await blob.arrayBuffer();
    return new Uint8Array(ab);
  }

  async function makeVaultPngWithPayload({ title, payloadObj }){
    // Make a simple PNG with visible label + embedded metadata
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 675;
    const ctx = canvas.getContext("2d");

    // background
    ctx.fillStyle = "#0b1220";
    ctx.fillRect(0,0,canvas.width,canvas.height);

    // header strip
    ctx.fillStyle = "rgba(103,163,255,0.18)";
    ctx.fillRect(50,50,1100,120);
    ctx.strokeStyle = "rgba(103,163,255,0.5)";
    ctx.lineWidth = 2;
    ctx.strokeRect(50,50,1100,120);

    ctx.fillStyle = "#eaf0ff";
    ctx.font = "bold 42px system-ui, -apple-system, Segoe UI, Roboto, Arial";
    ctx.fillText("Independence Branch — Private Result Image", 80, 110);

    ctx.fillStyle = "#9fb0d0";
    ctx.font = "22px system-ui, -apple-system, Segoe UI, Roboto, Arial";
    ctx.fillText("Consistent with V1 Questionnaire Logic • Not identity verification", 80, 150);

    ctx.fillStyle = "#eaf0ff";
    ctx.font = "bold 34px system-ui, -apple-system, Segoe UI, Roboto, Arial";
    ctx.fillText(title, 80, 240);

    ctx.fillStyle = "#9fb0d0";
    ctx.font = "20px system-ui, -apple-system, Segoe UI, Roboto, Arial";
    ctx.fillText("This file contains encoded questionnaire data for consistency verification.", 80, 290);

    const json = JSON.stringify(payloadObj);
    const b64 = b64EncodeStr(json);
    const pngBytes = await canvasToPngBytes(canvas);
    const injected = addTextChunkToPng(pngBytes, textKey, b64);
    return new Blob([injected], { type: "image/png" });
  }

  function readPayloadFromPngBytes(pngBytes){
    const chunks = extractTextChunks(pngBytes);
    const hit = chunks.find(c => c.key === textKey);
    if (!hit) return null;
    const json = b64DecodeStr(hit.value);
    return JSON.parse(json);
  }

  global.IBPngMeta = {
    addTextChunkToPng,
    extractTextChunks,
    makeVaultPngWithPayload,
    readPayloadFromPngBytes,
    isPng
  };
})(window);

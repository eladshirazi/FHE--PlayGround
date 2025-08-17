
// - WebCrypto returns ct||tag concatenated, we split to interop with Python's separate tag.

const TAG_LEN_BYTES = 16; // 128-bit tag is default in WebCrypto , to know where to split the tag

export function b64ToBytes(b64) {
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0)); //from base64 binary to bytes array
}

export function bytesToB64(bytes) {
  const bin = String.fromCharCode(...new Uint8Array(bytes));// convert bytes to binary string
  return btoa(bin); // convert binary string to base64
}

export async function importAesGcmKeyFromBase64(b64) { // import AES key from base64 string
  const raw = b64ToBytes(b64);
  return await crypto.subtle.importKey(
    "raw",
    raw,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
}

function genIvGcm() {
  // 12-byte IV 
  return crypto.getRandomValues(new Uint8Array(12));
}

export async function encryptJsonGcm(obj, key) {
  const iv = genIvGcm();
  const pt = new TextEncoder().encode(JSON.stringify(obj));// convert JSON object to UTF-8 bytes 
  const ctWithTag = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, pt) // encrypt the plaintext and return ciphertext with tag
  );

  // Split (ct || tag)
  const tag = ctWithTag.slice(ctWithTag.length - TAG_LEN_BYTES); 
  const ct = ctWithTag.slice(0, ctWithTag.length - TAG_LEN_BYTES);

  return {
    iv: bytesToB64(iv),
    ct: bytesToB64(ct),
    tag: bytesToB64(tag),
  };
}

export async function decryptJsonGcm(enc, key) {
  const iv = b64ToBytes(enc.iv);
  const ct = b64ToBytes(enc.ct);
  const tag = b64ToBytes(enc.tag);

  // Join (ct || tag) back
  const ctWithTag = new Uint8Array(ct.length + tag.length);
  ctWithTag.set(ct, 0);
  ctWithTag.set(tag, ct.length);

  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ctWithTag);
  return JSON.parse(new TextDecoder().decode(pt));
}

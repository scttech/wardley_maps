/** Encode map text as URL-safe base64 (UTF-8) for use in a #map=... link. */
export function encodeSource(source) {
  let binary = '';
  new TextEncoder().encode(source).forEach((b) => { binary += String.fromCharCode(b); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Inverse of encodeSource. Returns null if the text isn't valid. */
export function decodeSource(encoded) {
  try {
    const binary = atob(encoded.replace(/-/g, '+').replace(/_/g, '/'));
    return new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)));
  } catch {
    return null;
  }
}

/** Turn a map title into a safe file name stem. */
export function fileStem(title) {
  return (title || 'wardley-map').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'wardley-map';
}

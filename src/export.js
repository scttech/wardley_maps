// Computed-style properties copied onto the exported SVG so it looks the same outside the page's CSS.
const STYLE_PROPS = ['fill', 'fill-opacity', 'paint-order', 'stroke', 'stroke-width', 'stroke-dasharray', 'stroke-linecap', 'stroke-linejoin', 'font-size', 'font-family', 'font-weight', 'font-style', 'text-anchor'];

/** Serialize a rendered map <svg> to a standalone SVG string with a white background. */
export function serializeSvg(svgEl, background = '#ffffff') {
  const { width, height } = svgEl.getBoundingClientRect();
  const clone = svgEl.cloneNode(true);
  const originals = [svgEl, ...svgEl.querySelectorAll('*')];
  const copies = [clone, ...clone.querySelectorAll('*')];
  originals.forEach((el, i) => {
    const computed = getComputedStyle(el);
    for (const p of STYLE_PROPS) copies[i].style.setProperty(p, computed.getPropertyValue(p));
  });
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', width);
  clone.setAttribute('height', height);
  clone.setAttribute('viewBox', `0 0 ${width} ${height}`);
  const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  for (const [k, v] of Object.entries({ width: '100%', height: '100%', fill: background })) bg.setAttribute(k, v);
  clone.insertBefore(bg, clone.firstChild);
  return { svg: new XMLSerializer().serializeToString(clone), width, height };
}

/** Rasterize an SVG string to a PNG Blob (scale 2 gives a sharper image). */
export async function svgToPngBlob({ svg, width, height }, scale = 2) {
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);
    ctx.drawImage(img, 0, 0, width, height);
    return await new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('PNG export failed'))), 'image/png'));
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function downloadBlob(blob, filename) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

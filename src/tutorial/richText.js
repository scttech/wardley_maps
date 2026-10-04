/** Fill `el` with text where `backticked` parts become <code>. Uses text nodes only, never innerHTML. */
export function setRichText(el, text) {
  el.replaceChildren(...text.split('`').map((part, i) => {
    if (i % 2 === 0) return document.createTextNode(part);
    const code = document.createElement('code');
    code.textContent = part;
    return code;
  }));
}

/** Join map-definition lines (strings or arrays of strings) into the text a tutorial step shows. */
export const src = (...lines) => `${lines.flat().join('\n')}\n`;

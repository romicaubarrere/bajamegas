export const escapeXML = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
export function fromText(text, markdown = false) {
  const blocks = [];
  for (const part of text.replace(/\r\n?/g, '\n').split(/\n\s*\n/)) {
    if (!part.trim()) continue;
    if (markdown) for (const line of part.split('\n')) {
      const h = line.match(/^(#{1,6})\s+(.+)/);
      blocks.push(h ? {text:h[2],level:h[1].length} : {text:line.replace(/^\s*[-*+]\s+/, '• '),level:0});
    } else blocks.push({text:part.trim(),level:0});
  }
  return blocks;
}
export const plainText = blocks => blocks.map(b=>b.text).join('\n\n');
export const markdownText = blocks => blocks.map(b=>(b.level ? '#'.repeat(b.level)+' ' : '')+b.text).join('\n\n');
export const bodyHTML = blocks => blocks.map(b=>{const tag=b.level?'h'+b.level:'p';return `<${tag}>${escapeXML(b.text).replace(/\n/g,'<br/>')}</${tag}>`;}).join('\n');
export const documentHTML = (blocks,title) => `<!doctype html><html lang="es"><head><meta charset="utf-8"/><title>${escapeXML(title)}</title></head><body>${bodyHTML(blocks)}</body></html>`;
export function zipPath(base, relative) {
  const segments=(base+'/'+relative.split('#')[0]).split('/');const result=[];
  for(const part of segments){if(part==='..')result.pop();else if(part && part!=='.')result.push(part);}
  return decodeURIComponent(result.join('/'));
}

export function pageRegions(width,height,layout='auto') {
  const double=layout==='double'||(layout==='auto'&&width/height>1.2);
  return double?[{x:0,y:0,width:width/2,height},{x:width/2,y:0,width:width/2,height}]:[{x:0,y:0,width,height}];
}
export function cleanBookText(text) {
  return text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'').replace(/([\p{L}])[ \t]*[-‐\u00ad]\s*\n\s*(?=[\p{Ll}])/gu,'$1').replace(/([\p{L}])[ \t]*\u00ad[ \t]*(?=[\p{L}])/gu,'$1').replace(/\u00ad/g,'').replace(/([^\n])\n(?!\s*\n)/g,'$1 ').replace(/[ \t]+/g,' ').replace(/ *\n */g,'\n').trim();
}
export function positionedLines(items,region) {
  const tokens=items.filter(t=>t.text.trim()&&t.x+t.width/2>=region.x&&t.x+t.width/2<region.x+region.width).sort((a,b)=>a.y-b.y||a.x-b.x);
  const lines=[];
  for(const token of tokens){
    let line=lines.slice(-3).find(l=>Math.abs(l.y-token.y)<=Math.max(2,token.height*.4));
    if(!line){line={y:token.y,height:token.height,x:token.x,tokens:[]};lines.push(line);}
    line.tokens.push(token);line.height=Math.max(line.height,token.height);line.x=Math.min(line.x,token.x);
  }
  return lines.sort((a,b)=>a.y-b.y).map(l=>({...l,text:l.tokens.sort((a,b)=>a.x-b.x).map(t=>t.text).join(' ').replace(/\s+/g,' ').trim()}));
}
export function bookBlocks(sides) {
  const frequencies=new Map();
  const key=t=>t.toLowerCase().replace(/[\d\s.,;:—–-]+/g,' ').trim();
  for(const side of sides){const seen=new Set();for(const line of side.lines){if(line.y<side.height*.16||line.y>side.height*.92){const k=key(line.text);if(k&&line.text.length<100)seen.add(k);}}for(const k of seen)frequencies.set(k,(frequencies.get(k)||0)+1);}
  const blocks=[];
  for(const side of sides){
    const lines=side.lines.filter(l=>{
      const margin=l.y<side.height*.16||l.y>side.height*.92;
      if(margin&&/^\s*(?:\d+|[ivxlcdm]+)\s*$/i.test(l.text))return false;
      return !(margin&&l.text.length<100&&(frequencies.get(key(l.text))||0)>=Math.max(3,Math.min(8,sides.length*.1)));
    });
    let paragraph='',previous=null;
    const flush=()=>{const text=cleanBookText(paragraph);if(text){const previousBlock=blocks[blocks.length-1];if(previousBlock&&/[\p{L}][-‐]$/u.test(previousBlock.text)&&/^[\p{Ll}]/u.test(text))previousBlock.text=previousBlock.text.slice(0,-1)+text;else blocks.push({text,level:0});}paragraph='';};
    for(const line of lines){
      if(previous&&(line.y-previous.y>Math.max(previous.height,line.height)*1.9||line.height>previous.height*1.35||previous.height>line.height*1.35))flush();
      paragraph+=(paragraph?'\n':'')+line.text;previous=line;
    }
    flush();
  }
  return blocks;
}

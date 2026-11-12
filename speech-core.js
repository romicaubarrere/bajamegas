export function timestamp(seconds,separator=','){
 const ms=Math.max(0,Math.round((Number(seconds)||0)*1000));
 return String(Math.floor(ms/3600000)).padStart(2,'0')+':'+String(Math.floor(ms/60000)%60).padStart(2,'0')+':'+String(Math.floor(ms/1000)%60).padStart(2,'0')+separator+String(ms%1000).padStart(3,'0');
}
export function transcriptSegments(output,duration){
 const chunks=output.chunks?.length?output.chunks:[{text:output.text,timestamp:[0,duration]}];
 return chunks.map(c=>{const start=Math.max(0,Math.min(duration,Number(c.timestamp?.[0])||0));const end=Math.min(duration,Math.max(start+.02,c.timestamp?.[1]==null?duration:Number(c.timestamp[1])));return {start,end,text:String(c.text||'').trim()};}).filter(c=>c.text&&c.end>c.start);
}
export function subtitles(segments,format){
 const vtt=format==='vtt';return (vtt?'WEBVTT\n\n':'')+segments.filter(s=>s.text.trim()).map((s,i)=>(vtt?'':(i+1)+'\n')+timestamp(s.start,vtt?'.':',')+' --> '+timestamp(s.end,vtt?'.':',')+'\n'+s.text.trim().replace(/-->/g,'→')).join('\n\n')+'\n';
}

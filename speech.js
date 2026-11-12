import {timestamp,transcriptSegments,subtitles} from './speech-core.js';
const $=id=>document.getElementById(id);
let busy=false,worker=null,controller=null,rejectWorker=null,segments=[],file=null;
const status=text=>$('speechStatus').textContent=text;
function clear(){segments=[];$('speechText').value='';$('speechSegments').replaceChildren();$('speechResult').hidden=true;}
function controls(){for(const id of ['speechFile','speechLanguage'])$(id).disabled=busy;$('speechGo').disabled=busy||!file;$('speechCancel').hidden=!busy;}
$('speechFile').addEventListener('change',()=>{file=$('speechFile').files[0]||null;clear();$('speechName').textContent=file?file.name+' · '+(file.size/1024/1024).toFixed(2)+' MB':'Hasta 100 MB y 30 minutos.';status('');controls();});
$('speechLanguage').addEventListener('change',()=>{clear();status('Idioma cambiado. Volvé a transcribir el archivo.');});
async function decode(file,signal){
 const AudioCtx=window.AudioContext||window.webkitAudioContext;
 if(!AudioCtx||!window.OfflineAudioContext)throw new Error('Este navegador no permite procesar audio. Probá en Chrome, Edge o Safari actualizado.');
 const context=new AudioCtx();let decoded;
 try{decoded=await context.decodeAudioData(await file.arrayBuffer());}catch{throw new Error('No se pudo abrir el audio. Si es un video, probá exportarlo como MP3 o WAV; el formato debe ser compatible con tu navegador.');}finally{await context.close();}
 signal.throwIfAborted();if(decoded.duration>1800)throw new Error('El archivo supera los 30 minutos. Usá un fragmento más corto.');
 if(!decoded.length)throw new Error('El archivo no contiene audio.');
 const duration=decoded.duration,offline=new OfflineAudioContext(1,Math.ceil(duration*16000),16000),source=offline.createBufferSource();source.buffer=decoded;source.connect(offline.destination);source.start();const rendered=await offline.startRendering();signal.throwIfAborted();const audio=rendered.getChannelData(0);let energy=0;for(let i=0;i<audio.length;i++)energy+=audio[i]*audio[i];if(Math.sqrt(energy/audio.length)<.00001)throw new Error('El audio está en silencio. Elegí un archivo con voz.');return {audio,duration};
}
function recognize(audio,language){
 return new Promise((resolve,reject)=>{
  rejectWorker=reject;worker=new Worker(new URL('./speech-worker.js',import.meta.url),{type:'module'});
  worker.onmessage=({data})=>{if(data.type==='status')status(data.text);else if(data.type==='result')resolve(data.result);else if(data.type==='error')reject(new Error(data.message));};
  worker.onerror=()=>reject(new Error('No se pudo cargar el motor de voz. Revisá tu conexión y probá en un navegador actualizado.'));
  worker.postMessage({audio,language},[audio.buffer]);
 });
}
$('speechCancel').onclick=()=>{controller?.abort();worker?.terminate();rejectWorker?.(new DOMException('Cancelado','AbortError'));status('Cancelando transcripción…');};
$('speechGo').onclick=async()=>{
 if(busy||!file)return;if(file.size>100*1024*1024){status('Elegí un archivo de hasta 100 MB.');return;}
 busy=true;controller=new AbortController();const signal=controller.signal;clear();controls();status('Abriendo y preparando el audio…');
 try{
  const {audio,duration}=await decode(file,signal);signal.throwIfAborted();const output=await recognize(audio,$('speechLanguage').value);signal.throwIfAborted();segments=transcriptSegments(output,duration);
  if(!output.text?.trim()||!segments.length)throw new Error('No se reconoció voz. Probá con un audio más claro o seleccioná otro idioma.');
  $('speechText').value=output.text.trim();
  segments.forEach((segment,i)=>{
   const box=document.createElement('div');box.className='segment';const label=document.createElement('label');label.htmlFor='speechSegment'+i;label.textContent=timestamp(segment.start,'.')+' → '+timestamp(segment.end,'.');const text=document.createElement('textarea');text.id=label.htmlFor;text.rows=2;text.value=segment.text;text.addEventListener('input',()=>segment.text=text.value);box.append(label,text);$('speechSegments').appendChild(box);
  });
  $('speechResult').hidden=false;status('Listo · '+Math.ceil(duration)+' segundos de audio. Revisá y corregí el texto antes de usarlo.');
 }catch(e){status(signal.aborted?'Transcripción cancelada. Podés volver a intentarlo.':'No se pudo completar: '+(e.message||'error de transcripción.'));}
 finally{worker?.terminate();worker=null;rejectWorker=null;busy=false;controls();}
};
function download(text,extension,type){const blob=new Blob([text],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=(file?.name.replace(/\.[^.]+$/,'')||'transcripcion')+'.'+extension;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}
$('speechTXT').onclick=()=>download($('speechText').value,'txt','text/plain;charset=utf-8');
$('speechSRT').onclick=()=>download(subtitles(segments,'srt'),'srt','application/x-subrip;charset=utf-8');
$('speechVTT').onclick=()=>download(subtitles(segments,'vtt'),'vtt','text/vtt;charset=utf-8');
$('speechCopy').onclick=async()=>{try{await navigator.clipboard.writeText($('speechText').value);status('Texto copiado.');}catch{status('No se pudo copiar. Seleccioná el texto y copialo desde tu dispositivo.');}};

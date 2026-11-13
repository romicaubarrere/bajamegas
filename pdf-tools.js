import {script} from './documents.js?v=usability-1';
import {mergePDFs,pageSelection,imagePlacement} from './pdf-tools-core.js';
const $=id=>document.getElementById(id);
const MAX=200*1024*1024;
const tick=()=>new Promise(r=>setTimeout(r,0));
async function pdfLib(){await script('https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js');return window.PDFLib;}
async function zipLib(){await script('https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js');return window.JSZip;}
async function imagesPDF(files,mode,signal,progress){
 const {PDFDocument}=await pdfLib(),pdf=await PDFDocument.create();
 for(let i=0;i<files.length;i++){
  signal.throwIfAborted();progress('Agregando imagen '+(i+1)+' de '+files.length+'…');
  // Browser decoding applies phone-photo orientation and supports WebP too.
  const bitmap=await createImageBitmap(files[i]);const canvas=document.createElement('canvas');
  try{
   const scale=Math.min(1,4096/Math.max(bitmap.width,bitmap.height));
   canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
   const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
   const blob=await new Promise(r=>canvas.toBlob(r,'image/jpeg',.94));if(!blob)throw new Error('No se pudo procesar la imagen '+files[i].name+'.');
   const image=await pdf.embedJpg(await blob.arrayBuffer()),placement=imagePlacement(image.width,image.height,mode);
   const page=pdf.addPage(placement.page);page.drawImage(image,placement);
  }finally{bitmap.close();canvas.width=canvas.height=0;}
  await tick();
 }
 signal.throwIfAborted();return new Blob([await pdf.save()],{type:'application/pdf'});
}
async function rasterPDF(file,signal,progress){
 const pdfjs=await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs');
 pdfjs.GlobalWorkerOptions.workerSrc='https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs';
 const task=pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer()),isEvalSupported:false});
 try{
  const pdf=await task.promise;signal.throwIfAborted();const pages=pageSelection($('rasterRange').value,pdf.numPages);
  if(pages.length>100)throw new Error('Elegí hasta 100 páginas por vez. Este PDF tiene '+pdf.numPages+' páginas.');
  const JSZip=await zipLib(),zip=new JSZip(),format=$('rasterFormat').value;let total=0;
  for(let i=0;i<pages.length;i++){
   signal.throwIfAborted();progress('Creando imagen '+(i+1)+' de '+pages.length+' · página '+pages[i]+'…');
   const page=await pdf.getPage(pages[i]);const base=page.getViewport({scale:Number($('rasterQuality').value)});
   const scale=Math.min(1,4096/Math.max(base.width,base.height),Math.sqrt(16000000/(base.width*base.height)));
   const viewport=page.getViewport({scale:Number($('rasterQuality').value)*scale}),canvas=document.createElement('canvas');
   try{
    canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);
    await page.render({canvasContext:canvas.getContext('2d'),viewport,background:'rgb(255,255,255)'}).promise;
    signal.throwIfAborted();const blob=await new Promise(r=>canvas.toBlob(r,'image/'+format,.9));
    if(!blob)throw new Error('No se pudo crear la imagen.');
    total+=blob.size;if(total>120*1024*1024)throw new Error('Las imágenes superan 120 MB. Elegí menos páginas o resolución normal.');
    zip.file('pagina-'+String(pages[i]).padStart(4,'0')+(format==='jpeg'?'.jpg':'.png'),await blob.arrayBuffer());
   }finally{canvas.width=canvas.height=0;page.cleanup();}
   await tick();
  }
  signal.throwIfAborted();progress('Armando ZIP…');const blob=await zip.generateAsync({type:'blob',compression:'STORE'});signal.throwIfAborted();return blob;
 }finally{await task.destroy();}
}
for(const mode of ['merge','images','raster']){
 let files=[],busy=false,controller=null,url=null;
 const input=$(mode+'File'),go=$(mode+'Go'),cancel=$(mode+'Cancel'),download=$(mode+'Download'),list=$(mode+'List');
 const status=text=>$(mode+'Status').textContent=text;
 function clear(){if(url)URL.revokeObjectURL(url);url=null;download.hidden=true;download.removeAttribute('href');}
 function render(){
  list.replaceChildren();files.forEach((file,index)=>{
   const li=document.createElement('li');li.className='file-item';const label=document.createElement('span');label.textContent=(index+1)+'. '+file.name+' · '+(file.size/1024/1024).toFixed(2)+' MB';li.appendChild(label);
   const actions=document.createElement('div');actions.className='actions';
   for(const [text,name,action,disabled] of [
    ['↑','Subir '+file.name,()=>{[files[index-1],files[index]]=[files[index],files[index-1]];},index===0],
    ['↓','Bajar '+file.name,()=>{[files[index+1],files[index]]=[files[index],files[index+1]];},index===files.length-1],
    ['Quitar','Quitar '+file.name,()=>files.splice(index,1),false]]){
    if(mode==='raster'&&text!=='Quitar')continue;
    const button=document.createElement('button');button.className='btn';button.textContent=text;button.setAttribute('aria-label',name);button.disabled=busy||disabled;
    button.onclick=()=>{action();clear();render();};actions.appendChild(button);
   }
   li.appendChild(actions);list.appendChild(li);
  });go.disabled=busy||files.length<(mode==='merge'?2:1);
 }
 function add(incoming){
  if(busy)return;clear();const chosen=[...incoming];
  const valid=chosen.every(f=>mode==='images'?/\.(jpe?g|png|webp)$/i.test(f.name):/\.pdf$/i.test(f.name));
  if(!valid){status(mode==='images'?'Elegí imágenes JPG, PNG o WebP.':'Elegí archivos PDF.');return;}
  const next=mode==='raster'?chosen.slice(0,1):[...files,...chosen];
  if(next.reduce((n,f)=>n+f.size,0)>MAX){status('Los archivos superan 200 MB en total. Elegí menos archivos.');return;}
  files=next;status(files.length+' archivo(s) seleccionado(s).');render();
 }
 input.addEventListener('change',()=>{add(input.files);input.value='';});
 for(const control of $('panel-'+mode).querySelectorAll('select,input[type=text]'))control.addEventListener('input',()=>{if(!busy){clear();status('Opciones cambiadas. Volvé a convertir para actualizar el archivo.');}});
 const drop=input.closest('label');
 for(const event of ['dragenter','dragover'])drop.addEventListener(event,e=>{e.preventDefault();if(!busy)drop.classList.add('over');});
 for(const event of ['dragleave','drop'])drop.addEventListener(event,e=>{e.preventDefault();drop.classList.remove('over');if(event==='drop')add(e.dataTransfer.files);});
 cancel.onclick=()=>{controller?.abort();cancel.disabled=true;status('Cancelando…');};
 go.onclick=async()=>{
  if(busy||go.disabled)return;busy=true;clear();controller=new AbortController();input.disabled=true;cancel.hidden=false;cancel.disabled=false;render();
  const controls=[...$('panel-'+mode).querySelectorAll('select,input[type=text]')];controls.forEach(x=>x.disabled=true);
  status('Preparando archivos…');
  try{
   let blob,name;
   if(mode==='merge'){const {PDFDocument}=await pdfLib();blob=new Blob([await mergePDFs(files,PDFDocument,{signal:controller.signal,onProgress:(n,total)=>status('Uniendo PDF '+n+' de '+total+'…')})],{type:'application/pdf'});name='documentos-unidos.pdf';}
   else if(mode==='images'){blob=await imagesPDF(files,$('imagePage').value,controller.signal,status);name='imagenes.pdf';}
   else{blob=await rasterPDF(files[0],controller.signal,status);name=files[0].name.replace(/\.pdf$/i,'')+'-imagenes.zip';}
   controller.signal.throwIfAborted();url=URL.createObjectURL(blob);download.href=url;download.download=name;download.textContent='Descargar '+(mode==='raster'?'ZIP':'PDF');download.hidden=false;status('Listo · '+(blob.size/1024/1024).toFixed(2)+' MB. Descargá tu archivo.');
  }catch(error){status(controller.signal.aborted?'Proceso cancelado. Podés volver a intentarlo.':/password|encrypted/i.test(error.name)?'Este PDF tiene contraseña. Desbloquealo antes de usarlo.':error.message||'No se pudo procesar el archivo.');}
  finally{busy=false;input.disabled=false;cancel.hidden=true;controls.forEach(x=>x.disabled=false);render();}
 };
}

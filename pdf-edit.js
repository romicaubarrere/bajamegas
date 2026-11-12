import {script} from './documents.js';
import {pageSelection} from './pdf-tools-core.js';
import {orderedPages,editPDF,compressionResult} from './pdf-edit-core.js';
const $=id=>document.getElementById(id),MAX=200*1024*1024;
async function pdfLib(){await script('https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js');return window.PDFLib;}
async function pdfJS(){const lib=await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs');lib.GlobalWorkerOptions.workerSrc='https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs';return lib;}
const tick=()=>new Promise(r=>setTimeout(r,0));
const errorText=e=>/password|encrypted/i.test(e.name)?'Este PDF tiene contraseña. Desbloquealo antes de usarlo.':e.message||'No se pudo abrir el archivo. Puede estar dañado.';
let source=null,file=null,order=[],offset=0,loading=0,busy=false,abort=null,resultURL=null,previewToken=0;
const status=text=>$('editStatus').textContent=text;
function clear(){if(resultURL)URL.revokeObjectURL(resultURL);resultURL=null;$('editDownload').hidden=true;$('editDownload').removeAttribute('href');}
function controls(){
 for(const id of ['editFile','editMode','editRange','editRotation','editOrder'])$(id).disabled=busy;
 for(const id of ['editGo','editApplyOrder','editReverse','editReset'])$(id).disabled=busy||!source;
 $('editCancel').hidden=!busy;
}
function renderOrder(){
 $('editPages').replaceChildren();const end=Math.min(offset+30,order.length);
 for(let i=offset;i<end;i++){
  const row=document.createElement('li');row.className='file-item';const label=document.createElement('span');label.textContent='Lugar '+(i+1)+' → página original '+order[i];row.appendChild(label);const actions=document.createElement('div');actions.className='actions';
  for(const [text,name,disabled,action] of [
   ['↑','Subir página '+order[i],i===0,()=>{[order[i-1],order[i]]=[order[i],order[i-1]];syncOrder();}],
   ['↓','Bajar página '+order[i],i===order.length-1,()=>{[order[i+1],order[i]]=[order[i],order[i+1]];syncOrder();}],
   ['Ver','Ver página '+order[i],false,()=>preview(order[i])]]){
   const btn=document.createElement('button');btn.className='btn';btn.textContent=text;btn.setAttribute('aria-label',name);btn.disabled=busy||disabled;btn.onclick=action;actions.appendChild(btn);
  }
  row.appendChild(actions);$('editPages').appendChild(row);
 }
 $('editPageInfo').textContent=order.length?(offset+1)+'–'+end+' de '+order.length:'';
 $('editPrev').disabled=busy||offset===0;$('editNext').disabled=busy||end>=order.length;
}
function syncOrder(){clear();$('editOrder').value=order.join(', ');renderOrder();status('Orden actualizado. Creá el PDF para descargarlo.');}
function mode(){const value=$('editMode').value;$('editRangeWrap').hidden=value==='reorder';$('editRotationWrap').hidden=value!=='rotate';$('editOrderWrap').hidden=value!=='reorder';$('editRangeHelp').textContent=value==='rotate'?'Solo giran las páginas indicadas; se conservan todas las demás.':'Se crea un PDF nuevo con estas páginas, en su orden original.';$('editGo').textContent={extract:'Extraer páginas',rotate:'Rotar páginas',reorder:'Guardar nuevo orden'}[value];clear();status('');renderOrder();}
async function preview(number){
 const token=++previewToken,current=file;status('Cargando vista de la página '+number+'…');let task;
 try{const lib=await pdfJS();task=lib.getDocument({data:new Uint8Array(await current.arrayBuffer()),isEvalSupported:false});const pdf=await task.promise;if(token!==previewToken)return;const page=await pdf.getPage(number),base=page.getViewport({scale:1}),viewport=page.getViewport({scale:Math.min(1.5,850/Math.max(base.width,base.height))});const canvas=document.createElement('canvas');canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);await page.render({canvasContext:canvas.getContext('2d'),viewport}).promise;if(token!==previewToken)return;const target=$('editPreview');target.width=canvas.width;target.height=canvas.height;target.getContext('2d').drawImage(canvas,0,0);$('editPreviewName').textContent='Página original '+number;$('editPreviewWrap').hidden=false;status('Vista previa lista.');}
 catch(e){if(token===previewToken)status(errorText(e));}finally{if(task)await task.destroy();}
}
$('editFile').addEventListener('change',async()=>{
 const current=++loading;previewToken++;source=null;file=$('editFile').files[0]||null;clear();$('editPreviewWrap').hidden=true;order=[];offset=0;controls();renderOrder();$('editName').textContent=file?.name||'Todavía no elegiste un PDF.';if(!file)return;
 if(!/\.pdf$/i.test(file.name)||file.size>MAX){status('Elegí un PDF de hasta 200 MB.');return;}
 status('Leyendo PDF…');
 try{const {PDFDocument}=await pdfLib(),doc=await PDFDocument.load(await file.arrayBuffer());if(current!==loading)return;source=doc;order=doc.getPageIndices().map(i=>i+1);$('editOrder').value=order.join(', ');$('editName').textContent=file.name+' · '+order.length+' páginas';status('PDF listo. Elegí cómo querés editarlo.');}
 catch(e){if(current===loading)status(errorText(e));}finally{if(current===loading){controls();renderOrder();}}
});
$('editMode').addEventListener('change',mode);
for(const id of ['editRange','editRotation'])$(id).addEventListener('input',()=>{clear();status('Opciones cambiadas. Creá el PDF para actualizar el resultado.');});
$('editOrder').addEventListener('input',()=>{clear();status('Aplicá el orden escrito o creá el PDF para guardarlo.');});
$('editApplyOrder').onclick=()=>{try{order=orderedPages($('editOrder').value,source.getPageCount());offset=0;syncOrder();}catch(e){status(e.message);}};
$('editReverse').onclick=()=>{order.reverse();offset=0;syncOrder();};
$('editReset').onclick=()=>{order=source.getPageIndices().map(i=>i+1);offset=0;syncOrder();};
$('editPrev').onclick=()=>{offset=Math.max(0,offset-30);renderOrder();};$('editNext').onclick=()=>{offset+=30;renderOrder();};
$('editCancel').onclick=()=>{abort?.abort();status('Cancelando…');};
$('editGo').onclick=async()=>{
 if(!source||busy)return;let pages,finalOrder;const value=$('editMode').value;
 try{pages=value==='reorder'?[]:pageSelection($('editRange').value,source.getPageCount());finalOrder=value==='reorder'?orderedPages($('editOrder').value,source.getPageCount()):order;}catch(e){status(e.message);return;}
 busy=true;abort=new AbortController();previewToken++;clear();controls();renderOrder();
 try{const {PDFDocument}=await pdfLib();const bytes=await editPDF(source,PDFDocument,{mode:value,pages,order:finalOrder,rotation:Number($('editRotation').value),signal:abort.signal,onProgress:(n,total)=>status('Preparando página '+n+' de '+total+'…')});abort.signal.throwIfAborted();resultURL=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}));$('editDownload').href=resultURL;$('editDownload').download=file.name.replace(/\.pdf$/i,'')+'-'+{extract:'paginas',rotate:'rotado',reorder:'reordenado'}[value]+'.pdf';$('editDownload').hidden=false;status('Listo · '+(bytes.length/1024/1024).toFixed(2)+' MB. El PDF original no se modifica.');}
 catch(e){status(abort.signal.aborted?'Edición cancelada.':errorText(e));}finally{busy=false;controls();renderOrder();}
};
mode();
// Compression keeps the original when the generated copy would be larger.
let compressedURL=null,compressBusy=false,compressionAbort=null;
const compressStatus=text=>$('compressStatus').textContent=text;
function clearCompressed(){if(compressedURL)URL.revokeObjectURL(compressedURL);compressedURL=null;$('compressDownload').hidden=true;$('compressDownload').removeAttribute('href');}
function compressionMode(){clearCompressed();const lossless=$('compressMode').value==='lossless';$('compressWarning').hidden=lossless;$('compressHelp').textContent=lossless?'Reorganiza la estructura del archivo. Puede ahorrar poco si ya está optimizado. No se garantiza una reducción.':'Recomendada para escaneos o PDF con muchas fotos. Puede perder nitidez; revisá la copia antes de compartirla.';compressStatus('');}
$('compressMode').addEventListener('change',compressionMode);
$('compressFile').addEventListener('change',()=>{clearCompressed();const f=$('compressFile').files[0];$('compressName').textContent=f?f.name+' · '+(f.size/1024/1024).toFixed(2)+' MB':'Todavía no elegiste un PDF.';$('compressGo').disabled=!f;compressStatus('');});
$('compressCancel').onclick=()=>{compressionAbort?.abort();compressStatus('Cancelando…');};
$('compressGo').onclick=async()=>{
 const selected=$('compressFile').files[0];if(!selected||compressBusy)return;
 if(!/\.pdf$/i.test(selected.name)||selected.size>MAX){compressStatus('Elegí un PDF de hasta 200 MB.');return;}
 compressBusy=true;compressionAbort=new AbortController();const signal=compressionAbort.signal;clearCompressed();for(const id of ['compressGo','compressFile','compressMode'])$(id).disabled=true;$('compressCancel').hidden=false;compressStatus('Preparando compresión…');let task;
 try{
  const {PDFDocument}=await pdfLib();let bytes;
  if($('compressMode').value==='lossless'){const pdf=await PDFDocument.load(await selected.arrayBuffer());signal.throwIfAborted();bytes=await pdf.save({useObjectStreams:true,addDefaultPage:false});}
  else{
   const lib=await pdfJS();task=lib.getDocument({data:new Uint8Array(await selected.arrayBuffer()),isEvalSupported:false});const source=await task.promise;
   if(source.numPages>100)throw new Error('Este modo admite hasta 100 páginas. Usá Optimizar para el PDF completo o extraé un rango primero.');
   const pdf=await PDFDocument.create(),small=$('compressMode').value==='small';let imageBytes=0;
   for(let i=1;i<=source.numPages;i++){
    signal.throwIfAborted();compressStatus('Comprimiendo página '+i+' de '+source.numPages+'…');const page=await source.getPage(i),base=page.getViewport({scale:1});const scale=Math.min((small?85:120)/72,3000/Math.max(base.width,base.height));const viewport=page.getViewport({scale}),canvas=document.createElement('canvas');
    try{canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);await page.render({canvasContext:canvas.getContext('2d'),viewport,background:'rgb(255,255,255)'}).promise;signal.throwIfAborted();const blob=await new Promise(r=>canvas.toBlob(r,'image/jpeg',small?.55:.76));if(!blob)throw new Error('No se pudo crear la página comprimida.');imageBytes+=blob.size;if(imageBytes>120*1024*1024)throw new Error('El resultado supera 120 MB de imágenes. Probá Más liviano o procesá menos páginas.');const img=await pdf.embedJpg(await blob.arrayBuffer());const target=pdf.addPage([base.width,base.height]);target.drawImage(img,{x:0,y:0,width:base.width,height:base.height});}
    finally{canvas.width=canvas.height=0;page.cleanup();}await tick();
   }
   bytes=await pdf.save({useObjectStreams:true});
  }
  signal.throwIfAborted();const reduction=compressionResult(selected.size,bytes.length),blob=reduction.smaller?new Blob([bytes],{type:'application/pdf'}):selected;
  compressedURL=URL.createObjectURL(blob);$('compressDownload').href=compressedURL;$('compressDownload').download=selected.name.replace(/\.pdf$/i,'')+(reduction.smaller?'-comprimido':'-original')+'.pdf';$('compressDownload').textContent=reduction.smaller?'Descargar PDF comprimido':'Descargar original';$('compressDownload').hidden=false;
  compressStatus(reduction.smaller?'Listo: '+(selected.size/1024/1024).toFixed(2)+' → '+(blob.size/1024/1024).toFixed(2)+' MB · '+reduction.percent.toFixed(1)+'% menos. Revisá el resultado.':'Esta configuración no redujo el tamaño. Conservamos el original para que no descargues uno más pesado. Probá otro tipo de compresión.');
 }catch(e){compressStatus(signal.aborted?'Compresión cancelada.':errorText(e));}finally{if(task)await task.destroy();compressBusy=false;for(const id of ['compressGo','compressFile','compressMode'])$(id).disabled=false;$('compressCancel').hidden=true;}
};

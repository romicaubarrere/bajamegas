import {script} from './documents.js';
import {pageRanges,splitPdf} from './pdf-split-core.js';
const $=id=>document.getElementById(id);
let source=null, selected=null, generation=0, processing=false;
const parts=[];
const status=text=>{$('splitStatus').textContent=text;};
function clearParts(){parts.forEach(p=>URL.revokeObjectURL(p.url));parts.length=0;$('splitResults').replaceChildren();}
function plan(){
  try{if(!source)return;$('splitPlan').textContent=source.getPageCount()+' páginas → '+pageRanges(source.getPageCount(),Number($('splitSize').value)).length+' archivo(s).';$('splitGo').disabled=processing;}
  catch(e){$('splitPlan').textContent=e.message;$('splitGo').disabled=true;}
}
async function selectFile(file){
  const id=++generation;source=null;selected=null;processing=false;clearParts();$('splitCancel').hidden=true;$('splitGo').disabled=true;$('splitSize').disabled=false;$('splitPlan').textContent='';
  $('splitName').textContent=file?file.name:'Todavía no elegiste un PDF.';if(!file)return;
  if(!/\.pdf$/i.test(file.name)){status('Elegí un archivo PDF.');return;}
  if(file.size>200*1024*1024){status('El PDF supera los 200 MB. Usá un archivo más chico para no agotar la memoria del navegador.');return;}
  status('Leyendo PDF…');
  try{
    await script('https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js');
    const pdf=await window.PDFLib.PDFDocument.load(await file.arrayBuffer());
    if(id!==generation)return;
    source=pdf;selected=file;plan();status('PDF listo. Elegí cuántas páginas querés en cada parte.');
  }catch(error){if(id!==generation)return;status(error.name==='EncryptedPDFError'?'Este PDF tiene contraseña. Desbloquealo antes de dividirlo.':'No se pudo abrir este PDF. Puede estar dañado o protegido con contraseña.');}
}
$('splitFile').addEventListener('change',()=>{selectFile($('splitFile').files[0]);$('splitFile').value='';});
$('splitSize').addEventListener('input',plan);
$('splitCancel').addEventListener('click',()=>{
  generation++;processing=false;$('splitCancel').hidden=true;$('splitSize').disabled=false;plan();status('División cancelada. Las partes ya creadas siguen disponibles.');
});
$('splitGo').addEventListener('click',async()=>{
  if(!source||processing)return;
  const perPart=Number($('splitSize').value);try{pageRanges(source.getPageCount(),perPart);}catch(e){status(e.message);return;}
  const id=++generation,original=selected,pdf=source;processing=true;clearParts();$('splitGo').disabled=true;$('splitSize').disabled=true;$('splitCancel').hidden=false;
  status('Dividiendo PDF…');
  try{
    for await(const part of splitPdf(pdf,perPart,window.PDFLib.PDFDocument,()=>id!==generation)){
      const name=original.name.replace(/\.pdf$/i,'')+'-parte-'+String(part.index+1).padStart(2,'0')+'-paginas-'+(part.start+1)+'-'+part.end+'.pdf';
      const file=new File([part.bytes],name,{type:'application/pdf'}),url=URL.createObjectURL(file);parts.push({url,file});
      const row=document.createElement('li');row.className='stack';row.style.cssText='padding:16px;border:1px solid var(--line);border-radius:12px;gap:8px';
      const label=document.createElement('strong');label.textContent='Parte '+(part.index+1)+': páginas '+(part.start+1)+'–'+part.end+' · '+(file.size/1024/1024).toFixed(2)+' MB';row.appendChild(label);
      const actions=document.createElement('div');actions.className='actions';
      const download=document.createElement('button');download.className='btn primary';download.textContent='Descargar parte '+(part.index+1);
      download.onclick=()=>{const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();};actions.appendChild(download);
      const convert=document.createElement('button');convert.className='btn';convert.textContent='Convertir esta parte';convert.disabled=file.size>200*1024*1024;
      convert.onclick=()=>{const dt=new DataTransfer();dt.items.add(file);$('docFile').files=dt.files;$('docFile').dispatchEvent(new Event('change'));$('tab-document').click();$('panel-document').scrollIntoView({behavior:'smooth'});};actions.appendChild(convert);row.appendChild(actions);
      if(convert.disabled){const note=document.createElement('p');note.className='warn';note.textContent='Esta parte supera los 200 MB del conversor. Dividí de nuevo con menos páginas por parte.';row.appendChild(note);}
      $('splitResults').appendChild(row);status('Parte '+(part.index+1)+' de '+part.total+' lista.');
      await new Promise(r=>setTimeout(r,0));
    }
    if(id===generation)status('Listo: '+parts.length+' PDF(s) independientes. Descargá cada parte o pasala directamente al conversor.');
  }catch(error){if(id===generation)status('No se pudo completar la división. Podés usar las partes creadas o probar con menos páginas.');}
  finally{if(id===generation){processing=false;$('splitSize').disabled=false;$('splitCancel').hidden=true;plan();}}
});
document.addEventListener('bajamegas:split',e=>{$('tab-split').click();selectFile(e.detail);});

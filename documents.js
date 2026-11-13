import {escapeXML as xml, fromText, plainText, markdownText, bodyHTML, documentHTML, zipPath} from './doc-core.js';
const $=id=>document.getElementById(id);
const scripts=new Map();
function script(url) {
  if (!scripts.has(url)) scripts.set(url,new Promise((resolve,reject)=>{
    const s=document.createElement('script');s.src=url;
    s.onload=resolve;s.onerror=()=>{scripts.delete(url);s.remove();reject(new Error('No se pudo cargar el conversor. Revisá tu conexión y volvé a intentar.'));};document.head.appendChild(s);
  }));
  return scripts.get(url);
}
const zipLib=async()=>{await script('https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js');return window.JSZip;};
const parseXML=text=>{const doc=new DOMParser().parseFromString(text,'application/xml');if(doc.querySelector('parsererror'))throw new Error('El documento tiene una estructura inválida.');return doc;};
const localNodes=(doc,name)=>[...doc.getElementsByTagNameNS('*',name)];
function htmlBlocks(text) {
  const doc=new DOMParser().parseFromString(text,'text/html');
  doc.querySelectorAll('script,style,iframe,object,svg,nav').forEach(n=>n.remove());
  const elements=[...doc.body.querySelectorAll('h1,h2,h3,h4,h5,h6,p,li,pre,td,th')].filter(n=>!n.querySelector('h1,h2,h3,h4,h5,h6,p,li,pre,td,th'));
  return elements.length?elements.map(n=>({text:n.textContent.trim(),level:/^H[1-6]$/.test(n.tagName)?Number(n.tagName[1]):0})).filter(b=>b.text):fromText(doc.body.textContent);
}
async function openZip(file) {
  const JSZip=await zipLib();const zip=await JSZip.loadAsync(await file.arrayBuffer());
  // Reject oversized expanded archives before decompression.
  const total=Object.values(zip.files).reduce((sum,f)=>sum+(f._data?.uncompressedSize||0),0);
  if(total>80*1024*1024)throw new Error('El documento expandido es demasiado grande. Probá con uno más chico.');
  if(zip.file('META-INF/encryption.xml'))throw new Error('Este EPUB contiene recursos cifrados. Usá una copia sin protección DRM.');
  return zip;
}
async function readDocument(file, status, options = {}) {
  const ext=file.name.split('.').pop().toLowerCase();
  if(['txt','md','markdown'].includes(ext))return fromText(await file.text(),ext!=='txt');
  if(['html','htm'].includes(ext))return htmlBlocks(await file.text());
  if(ext==='docx') {
    const zip=await openZip(file);const entry=zip.file('word/document.xml');
    if(!entry)throw new Error('El archivo no es un documento Word válido.');
    const doc=parseXML(await entry.async('string'));
    return localNodes(doc,'p').map(p=>{
      const style=localNodes(p,'pStyle')[0]?.getAttributeNS('http://schemas.openxmlformats.org/wordprocessingml/2006/main','val')||'';
      return {text:localNodes(p,'t').map(t=>t.textContent).join(''),level:Number(style.match(/(?:Heading|T[tí]tulo)([1-6])/i)?.[1]||0)};
    }).filter(b=>b.text.trim());
  }
  if(ext==='epub') {
    const zip=await openZip(file);const container=zip.file('META-INF/container.xml');
    if(!container)throw new Error('El archivo no es un EPUB válido.');
    const root=localNodes(parseXML(await container.async('string')),'rootfile')[0]?.getAttribute('full-path');
    const opf=zip.file(root||'');if(!opf)throw new Error('No se encontró el contenido del EPUB.');
    const doc=parseXML(await opf.async('string'));const base=root.includes('/')?root.slice(0,root.lastIndexOf('/')):'';
    const manifest=new Map(localNodes(doc,'item').map(i=>[i.getAttribute('id'),i.getAttribute('href')]));
    const blocks=[];
    for(const item of localNodes(doc,'itemref')) {
      const href=manifest.get(item.getAttribute('idref'));if(!href)continue;
      const chapter=zip.file(zipPath(base,href));if(chapter)blocks.push(...htmlBlocks(await chapter.async('string')));
    }
    return blocks;
  }
  if(ext==='pdf') {
    const pdfjs=await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs');
    pdfjs.GlobalWorkerOptions.workerSrc='https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs';
    const task=pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer()),isEvalSupported:false});
    let pdf;
    try {
      pdf=await task.promise;
      let scanned=options.scanned;
      if(!scanned){
        const metadata=await pdf.getMetadata().catch(()=>({info:{}}));
        scanned=/Paper Capture|ClearScan|OCR/i.test(metadata.info?.Producer||'');
        if(!scanned){
          let text='';
          for(let number=1;number<=Math.min(2,pdf.numPages);number++){
            const sample=await pdf.getPage(number),content=await sample.getTextContent();
            text+=content.items.filter(item=>'str' in item).map(item=>item.str).join('').trim();sample.cleanup();
          }
          scanned=!text;
        }
      }
      if(scanned){options.onScanned?.();const {readScannedBook}=await import('./book-ocr.js');return await readScannedBook(pdf,pdfjs,status,options,script);}
      const blocks=[];
      for(let i=1;i<=pdf.numPages;i++) {
        if(options.signal?.aborted)throw new DOMException('Cancelado','AbortError');
        status('Leyendo tanda '+Math.ceil(i/500)+' de '+Math.ceil(pdf.numPages/500)+' · página '+i+' de '+pdf.numPages+'… El resultado será un solo archivo.');
        const page=await pdf.getPage(i), content=await page.getTextContent();
        let text='';for(const item of content.items)if('str' in item)text+=item.str+(item.hasEOL?'\n':' ');
        if(text.trim())blocks.push({text:text.replace(/[ \t]+/g,' ').trim(),level:0});page.cleanup();
        if(i%500===0)await new Promise(resolve=>setTimeout(resolve,0));
      }
      return blocks;
    } catch(error) {
      if(error.name==='PasswordException')throw new Error('Este PDF tiene contraseña. Desbloquealo antes de convertirlo.');
      throw error;
    } finally {await task.destroy();}
  }
  throw new Error('Elegí un PDF, EPUB, MD, DOCX, TXT o HTML. Para Google Docs, descargá primero el archivo como .docx. Los .doc antiguos no son compatibles.');
}
async function writeDocument(blocks,format,title) {
  if(format==='txt')return new Blob([plainText(blocks)],{type:'text/plain;charset=utf-8'});
  if(format==='md')return new Blob([markdownText(blocks)],{type:'text/markdown;charset=utf-8'});
  if(format==='html')return new Blob([documentHTML(blocks,title)],{type:'text/html;charset=utf-8'});
  if(format==='pdf') {
    await script('https://cdn.jsdelivr.net/npm/pdfmake@0.2.20/build/pdfmake.min.js');
    await script('https://cdn.jsdelivr.net/npm/pdfmake@0.2.20/build/vfs_fonts.js');
    const def={info:{title},pageSize:'A4',pageMargins:[42,42,42,42],defaultStyle:{font:'Roboto',fontSize:11},content:blocks.map(b=>({text:b.text,fontSize:b.level?24-b.level*2:11,bold:!!b.level,margin:[0,b.level?12:0,0,8]}))};
    return new Promise((resolve,reject)=>{try{window.pdfMake.createPdf(def).getBlob(resolve);}catch(e){reject(e);}});
  }
  const JSZip=await zipLib(), zip=new JSZip();
  if(format==='docx') {
    zip.file('[Content_Types].xml','<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
    zip.file('_rels/.rels','<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
    zip.file('word/document.xml','<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>'+blocks.map(b=>'<w:p><w:r>'+(b.level?'<w:rPr><w:b/><w:sz w:val="'+(48-b.level*4)+'"/></w:rPr>':'')+b.text.split('\n').map(line=>'<w:t xml:space="preserve">'+xml(line)+'</w:t>').join('<w:br/>')+'</w:r></w:p>').join('')+'<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="850" w:right="850" w:bottom="850" w:left="850"/></w:sectPr></w:body></w:document>');
    return zip.generateAsync({type:'blob',mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',compression:'DEFLATE'});
  }
  const id='urn:uuid:'+(crypto.randomUUID?.() || 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=crypto.getRandomValues(new Uint8Array(1))[0]%16;return (c==='x'?r:(r&3)|8).toString(16);})), modified=new Date().toISOString().replace(/\.\d+Z$/,'Z');
  zip.file('mimetype','application/epub+zip',{compression:'STORE'});
  zip.file('META-INF/container.xml','<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="EPUB/package.opf" media-type="application/oebps-package+xml"/></rootfiles></container>');
  zip.file('EPUB/package.opf',`<?xml version="1.0" encoding="utf-8"?><package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="book-id"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:identifier id="book-id">${id}</dc:identifier><dc:title>${xml(title)}</dc:title><dc:language>es</dc:language><meta property="dcterms:modified">${modified}</meta></metadata><manifest><item id="content" href="content.xhtml" media-type="application/xhtml+xml"/><item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/></manifest><spine><itemref idref="content"/></spine></package>`);
  zip.file('EPUB/content.xhtml',`<?xml version="1.0" encoding="utf-8"?><html xmlns="http://www.w3.org/1999/xhtml" lang="es"><head><title>${xml(title)}</title></head><body>${bodyHTML(blocks)}</body></html>`);
  zip.file('EPUB/nav.xhtml',`<?xml version="1.0" encoding="utf-8"?><html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops"><head><title>Índice</title></head><body><nav epub:type="toc"><h1>Índice</h1><ol><li><a href="content.xhtml">${xml(title)}</a></li></ol></nav></body></html>`);
  return zip.generateAsync({type:'blob',mimeType:'application/epub+zip',compression:'DEFLATE'});
}
let selected=null, resultURL=null, version=0, busy=false, conversion=null;
const message=text=>{$('docStatus').textContent=text;};
function clearResult(){$('docConvert').hidden=false;if(resultURL)URL.revokeObjectURL(resultURL);resultURL=null;$('docDownload').hidden=true;$('docPreviewWrap').hidden=true;}
$('docFile').addEventListener('change',()=>{
  version++;selected=$('docFile').files[0]||null;clearResult();
  $('docName').hidden=!selected;$('docName').textContent=selected?selected.name+' · '+(selected.size/1024/1024).toFixed(2)+' MB':'Todavía no elegiste un documento.';
  let error='';if(selected){const max=/\.pdf$/i.test(selected.name)?200:40;if(!/\.(pdf|epub|md|markdown|docx|txt|html|htm)$/i.test(selected.name))error='Formato no compatible. Elegí PDF, EPUB, DOCX, MD, TXT o HTML.';else if(selected.size>max*1024*1024)error='El archivo supera los '+max+' MB. Elegí uno más chico.';}if(error)selected=null;$('docConvert').disabled=!selected;$('docKindle').disabled=!selected;$('docNextStep').textContent=selected?'Archivo listo. Elegí el formato y convertí.':'Primero elegí un archivo compatible.';message(error);
});
function formatLabel(){$('docConvert').textContent='Convertir a '+$('docFormat').value.toUpperCase();}formatLabel();$('docFormat').addEventListener('change',()=>{version++;clearResult();formatLabel();message('');});
$('docConvert').addEventListener('click',async()=>{
  if(!selected||busy)return;
  const maxMB=/\.pdf$/i.test(selected.name)?200:40;
  if(selected.size>maxMB*1024*1024){message('Elegí un documento de hasta '+maxMB+' MB.');return;}
  const current=++version, source=selected, format=$('docFormat').value;
  busy=true;clearResult();$('panel-document').setAttribute('aria-busy','true');$('docConvert').textContent='Convirtiendo…';$('docNextStep').textContent='Mantené esta pestaña abierta hasta terminar.';$('docConvert').disabled=true;$('docKindle').disabled=true;$('docFile').disabled=true;$('docFormat').disabled=true;
  conversion=new AbortController();$('docCancel').hidden=false;
  for(const id of ['docScan','docLayout','docLanguage','docForceOCR'])$(id).disabled=true;
  message('Preparando conversión…');
  try {
    let report=null;
    const blocks=await readDocument(source,message,{scanned:$('docScan').checked,layout:$('docLayout').value,language:$('docLanguage').value,forceOCR:$('docForceOCR').checked,signal:conversion.signal,onReport:value=>report=value,onScanned:()=>{$('docAdvanced').open=true;$('docScan').checked=true;$('docScanOptions').hidden=false;}});
    if(conversion.signal.aborted)throw new DOMException('Cancelado','AbortError');
    if(!blocks.length)throw new Error('No se encontró texto. Si es un PDF escaneado o una imagen, necesitás OCR antes de convertirlo.');
    message('Creando '+format.toUpperCase()+'…');
    const title=source.name.replace(/\.[^.]+$/,'')||'documento';
    const blob=await writeDocument(blocks,format,title);if(current!==version)return;
    resultURL=URL.createObjectURL(blob);$('docDownload').textContent='Descargar '+format.toUpperCase();$('docDownload').dataset.filename=title+'-convertido.'+format;$('docDownload').hidden=false;$('docConvert').hidden=true;$('docNextStep').textContent='Tu archivo está listo para descargar.';
    $('docPreview').textContent=plainText(blocks).slice(0,2500);$('docPreviewWrap').hidden=false;
    message('Listo: '+format.toUpperCase()+' · '+(blob.size/1024).toFixed(1)+' KB. Un solo archivo con todo el texto. Revisá la vista previa antes de descargar.'+(report?.warning||''));
  } catch(error){$('docNextStep').textContent='Podés volver a intentar la conversión.';message(conversion?.signal.aborted?'Conversión cancelada. Podés volver a intentarlo.':error.message||'No se pudo convertir este documento. Probá con otro archivo.');}
  finally{$('panel-document').removeAttribute('aria-busy');formatLabel();conversion=null;$('docCancel').hidden=true;for(const id of ['docScan','docLayout','docLanguage','docForceOCR'])$(id).disabled=false;busy=false;$('docConvert').disabled=!selected;$('docKindle').disabled=!selected;$('docFile').disabled=false;$('docFormat').disabled=false;}
});
$('docDownload').addEventListener('click',()=>{if(!resultURL)return;const a=document.createElement('a');a.href=resultURL;a.download=$('docDownload').dataset.filename;document.body.appendChild(a);a.click();a.remove();});

export {readDocument,writeDocument,script};

$('docKindle').addEventListener('click',()=>{if(!selected||busy)return;$('docFormat').value='epub';$('docFormat').dispatchEvent(new Event('change'));$('docConvert').click();});

$('docScan').addEventListener('change',()=>{$('docScanOptions').hidden=!$('docScan').checked;clearResult();});
$('docCancel').addEventListener('click',()=>{conversion?.abort();message('Cancelando…');});

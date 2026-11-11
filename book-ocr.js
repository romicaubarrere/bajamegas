import {pageRegions,positionedLines,bookBlocks,cleanBookText} from './book-core.js';
const cancelled=signal=>{if(signal?.aborted)throw new DOMException('Cancelado','AbortError');};
function abortable(promise,signal){
 if(!signal)return promise;
 return new Promise((resolve,reject)=>{
  const abort=()=>{signal.removeEventListener('abort',abort);reject(new DOMException('Cancelado','AbortError'));};
  signal.addEventListener('abort',abort,{once:true});
  promise.then(value=>{signal.removeEventListener('abort',abort);resolve(value);},error=>{signal.removeEventListener('abort',abort);reject(error);});
  if(signal.aborted)abort();
 });
}
export async function readScannedBook(pdf,pdfjs,status,options,loadScript) {
  const {signal,layout='auto',language='spa',forceOCR=false}=options;
  let worker=null, activeRender=null,sideLabel='';
  const sides=[];let recognized=0,ordered=0,confidenceSum=0;
  const stop=()=>{activeRender?.cancel();worker?.terminate().catch(()=>{});};
  signal?.addEventListener('abort',stop,{once:true});
  async function ocr(canvas){
    cancelled(signal);
    if(!worker){
      status('Cargando OCR en '+(language==='spa'?'español':'inglés')+'… La primera carga puede demorar.');
      await loadScript('https://cdn.jsdelivr.net/npm/tesseract.js@6.0.1/dist/tesseract.min.js');cancelled(signal);
      const creating=window.Tesseract.createWorker(language,1,{
        workerPath:'https://cdn.jsdelivr.net/npm/tesseract.js@6.0.1/dist/worker.min.js',
        corePath:'https://cdn.jsdelivr.net/npm/tesseract.js-core@6.0.0',
        logger:message=>{if(message.status==='recognizing text')status(sideLabel+' · OCR '+Math.round(message.progress*100)+'%');}
      });
      try{worker=await abortable(creating,signal);}catch(error){creating.then(late=>late.terminate()).catch(()=>{});throw error;}
    }
    cancelled(signal);const result=await abortable(worker.recognize(canvas,{}, {blocks:true}),signal);cancelled(signal);
    recognized++;confidenceSum+=result.data.confidence||0;
    const lines=[];
    for(const block of result.data.blocks||[])for(const paragraph of block.paragraphs||[])for(const line of paragraph.lines||[]){
      lines.push({text:line.text.trim(),y:line.bbox.y0,height:Math.max(1,line.bbox.y1-line.bbox.y0),x:line.bbox.x0});
    }
    if(!lines.length){
      const text=cleanBookText(result.data.text);return {text,height:canvas.height,lines:[]};
    }
    return {lines,height:canvas.height};
  }
  try{
    const start=options.firstPage||1,end=Math.min(options.lastPage||pdf.numPages,pdf.numPages);
    for(let number=start;number<=end;number++){
      cancelled(signal);const page=await pdf.getPage(number),viewport=page.getViewport({scale:1});
      const content=await page.getTextContent();
      const items=content.items.filter(i=>'str' in i).map(item=>{
        const tx=pdfjs.Util.transform(viewport.transform,item.transform);
        return {text:item.str,x:tx[4],y:tx[5],width:item.width,height:Math.max(1,Math.hypot(tx[2],tx[3]))};
      });
      const regions=pageRegions(viewport.width,viewport.height,layout);
      let fullCanvas=null;
      try{
        for(const [half,region] of regions.entries()){
          cancelled(signal);sideLabel='Hoja '+number+' de '+pdf.numPages+(regions.length===2?(half===0?' · izquierda':' · derecha'):'');
          status(sideLabel+' · ordenando texto…');
          const lines=positionedLines(items,region),text=lines.map(l=>l.text).join(' ');
          const letters=(text.match(/[\p{L}\p{N}]/gu)||[]).length;
          const broken=(text.match(/[\ufffd]/g)||[]).length;
          if(!forceOCR&&letters>=60&&broken/Math.max(1,text.length)<0.03){sides.push({lines,height:region.height});ordered++;continue;}
          // Render one sheet at a time; reuse its image for left and right OCR.
          const scale=Math.min(2.5,3200/Math.max(viewport.width,viewport.height));
          if(!fullCanvas){
            const rendered=page.getViewport({scale});fullCanvas=document.createElement('canvas');fullCanvas.width=Math.ceil(rendered.width);fullCanvas.height=Math.ceil(rendered.height);
            activeRender=page.render({canvasContext:fullCanvas.getContext('2d'),viewport:rendered});await activeRender.promise;activeRender=null;
          }
          // Ignore a narrow scanner border so stains and binding marks do not become letters.
          const insetX=region.width*.025,insetY=region.height*.018;
          const crop=document.createElement('canvas');crop.width=Math.max(1,Math.floor((region.width-2*insetX)*scale));crop.height=Math.max(1,Math.floor((region.height-2*insetY)*scale));
          crop.getContext('2d').drawImage(fullCanvas,(region.x+insetX)*scale,insetY*scale,(region.width-2*insetX)*scale,(region.height-2*insetY)*scale,0,0,crop.width,crop.height);
          try{
            const result=await ocr(crop);if(result.text)sides.push({height:crop.height,lines:[{text:result.text,y:crop.height/2,height:12}]});else sides.push(result);
          }finally{crop.width=1;crop.height=1;}
        }
      }finally{if(fullCanvas){fullCanvas.width=1;fullCanvas.height=1;}page.cleanup();}
      await new Promise(resolve=>setTimeout(resolve,0));
    }
    cancelled(signal);
    const blocks=bookBlocks(sides);
    if(!blocks.length)throw new Error('No se pudo reconocer texto. Revisá la orientación del PDF o probá el otro idioma.');
    const warning=recognized&&confidenceSum/recognized<65?' El OCR detectó baja confianza: revisá el texto, puede tener errores.':'';
    options.onReport?.({recognized,ordered,warning});
    return blocks;
  }finally{
    signal?.removeEventListener('abort',stop);
    if(worker)await worker.terminate().catch(()=>{});
  }
}

export function pageSelection(text,total){
 if(!Number.isInteger(total)||total<1)throw new Error('El PDF no tiene páginas.');
 if(!text.trim())return Array.from({length:total},(_,i)=>i+1);
 const pages=new Set();
 for(const part of text.split(',')){
  const m=part.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);
  if(!m)throw new Error('Usá páginas como 1-5, 8, 12.');
  const a=Number(m[1]),b=Number(m[2]||a);
  if(a<1||b<a||b>total)throw new Error('El rango debe estar entre 1 y '+total+'.');
  for(let n=a;n<=b;n++)pages.add(n);
 }
 return [...pages].sort((a,b)=>a-b);
}
export function imagePlacement(width,height,mode){
 if(!(width>0&&height>0))throw new Error('La imagen no tiene dimensiones válidas.');
 const page=mode==='original'?[width,height]:width>height?[841.89,595.28]:[595.28,841.89];
 const margin=mode==='original'?0:24;
 const ratio=Math.min((page[0]-2*margin)/width,(page[1]-2*margin)/height);
 return {page,x:(page[0]-width*ratio)/2,y:(page[1]-height*ratio)/2,width:width*ratio,height:height*ratio};
}
export async function mergePDFs(files,PDFDocument,{signal,onProgress=()=>{}}={}){
 const result=await PDFDocument.create();
 for(let i=0;i<files.length;i++){
  signal?.throwIfAborted();onProgress(i+1,files.length);
  const source=await PDFDocument.load(await files[i].arrayBuffer());
  const indices=source.getPageIndices();
  for(let n=0;n<indices.length;n+=25){signal?.throwIfAborted();const pages=await result.copyPages(source,indices.slice(n,n+25));pages.forEach(p=>result.addPage(p));await new Promise(r=>setTimeout(r,0));}
 }
 signal?.throwIfAborted();return result.save();
}

export function orderedPages(text,total){
 if(!text.trim())throw new Error('Indicá el orden final de las páginas.');
 const result=[];
 for(const token of text.split(',')){
  const m=token.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);
  if(!m)throw new Error('Usá un orden como 3, 1-2, 4-10.');
  const start=Number(m[1]),end=Number(m[2]||start);
  if(start<1||end<1||start>total||end>total)throw new Error('Las páginas van de 1 a '+total+'.');
  const step=end>=start?1:-1;
  for(let p=start;;p+=step){result.push(p);if(p===end)break;}
 }
 if(result.length!==total||new Set(result).size!==total)throw new Error('Incluí todas las páginas una sola vez. Para quitar páginas, usá Extraer páginas.');
 return result;
}
export async function editPDF(source,PDFDocument,{mode,pages,order,rotation=90,signal,onProgress=()=>{}}){
 const target=await PDFDocument.create();
 const indices=mode==='extract'?pages.map(p=>p-1):mode==='reorder'?order.map(p=>p-1):source.getPageIndices();
 const selected=new Set(pages);
 for(let i=0;i<indices.length;i+=25){
  signal?.throwIfAborted();const batch=indices.slice(i,i+25),copies=await target.copyPages(source,batch);
  for(let j=0;j<copies.length;j++){
   const page=copies[j];
   if(mode==='rotate'&&selected.has(batch[j]+1))page.setRotation({type:'degrees',angle:(page.getRotation().angle+rotation)%360});
   target.addPage(page);
  }
  onProgress(Math.min(i+25,indices.length),indices.length);await new Promise(r=>setTimeout(r,0));
 }
 signal?.throwIfAborted();return target.save({useObjectStreams:true});
}
export function compressionResult(original,candidate){
 const saved=original-candidate;
 return {smaller:saved>0,saved:Math.max(0,saved),percent:Math.max(0,saved/original*100)};
}

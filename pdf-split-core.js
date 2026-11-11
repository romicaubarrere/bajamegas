export function pageRanges(pageCount, perPart) {
  if (!Number.isInteger(perPart) || perPart < 1 || perPart > 500) throw new Error('Elegí entre 1 y 500 páginas por parte.');
  if (!Number.isInteger(pageCount) || pageCount < 1) throw new Error('El PDF no tiene páginas.');
  return Array.from({length:Math.ceil(pageCount/perPart)},(_,i)=>({start:i*perPart,end:Math.min((i+1)*perPart,pageCount)}));
}
export async function* splitPdf(source, perPart, PDFDocument, isCancelled=()=>false) {
  const ranges=pageRanges(source.getPageCount(),perPart);
  for(const [index,range] of ranges.entries()) {
    if(isCancelled())return;
    const output=await PDFDocument.create();
    const pages=await output.copyPages(source,Array.from({length:range.end-range.start},(_,i)=>range.start+i));
    pages.forEach(page=>output.addPage(page));
    const bytes=await output.save();
    if(isCancelled())return;
    yield {...range,index,total:ranges.length,bytes};
  }
}

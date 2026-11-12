export const tools=[
 {id:'document',name:'Convertir documentos',category:'convert',group:'Convertir',detail:'PDF, EPUB, Word, Markdown, TXT y HTML',keywords:'convertir conversion formato docx libro'},
 {id:'merge',name:'Unir PDF',category:'pdf',group:'PDF',detail:'Varios PDF en un solo archivo',keywords:'juntar combinar fusionar'},
 {id:'split',name:'Dividir PDF',category:'pdf',group:'PDF',detail:'Separar en archivos independientes',keywords:'cortar partir separar'},
 {id:'edit',name:'Editar páginas',category:'pdf',group:'PDF',detail:'Extraer, rotar y reordenar páginas',keywords:'girar extraer ordenar invertir sacar'},
 {id:'compress',name:'Comprimir PDF',category:'pdf',group:'PDF',detail:'Reducir el peso del PDF',keywords:'achicar tamaño liviano optimizar'},
 {id:'images',name:'Imágenes a PDF',category:'pdf',group:'PDF',detail:'Fotos en un documento',keywords:'jpg jpeg png webp fotos'},
 {id:'raster',name:'PDF a imágenes',category:'pdf',group:'PDF',detail:'Cada página en JPG o PNG',keywords:'exportar fotos zip'},
 {id:'speech',name:'Transcribir',category:'media',group:'Audio y video',detail:'Audio o video a texto y subtítulos',keywords:'transcripcion voz mp3 wav srt vtt'},
 {id:'video',name:'Comprimir video',category:'media',group:'Audio y video',detail:'Elegir cuánto pesa el video',keywords:'achicar mp4 mov webm tamaño'},
 {id:'kobo',name:'Enviar al Kobo',category:'reader',group:'Kobo',detail:'Guía para enviar desde el celular',keywords:'transferir lector epub bookdrop'}
];
export const normalize=text=>String(text).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export function searchTools(query){const words=normalize(query).trim().split(/\s+/).filter(Boolean);return tools.filter(tool=>words.every(word=>normalize(tool.name+' '+tool.group+' '+tool.detail+' '+tool.keywords).includes(word)));}
export function validFavorites(value){return Array.isArray(value)?[...new Set(value.filter(id=>tools.some(t=>t.id===id)))]:['document','speech','merge'];}

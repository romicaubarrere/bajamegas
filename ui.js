import {tools,searchTools,validFavorites} from './navigation-core.js';
const $=id=>document.getElementById(id),dialog=$('toolDialog');
let selected=tools[0],favorites=[];
try{const saved=localStorage.getItem('bajamegas-favorites');if(saved)favorites=validFavorites(JSON.parse(saved));}catch{}
function activate(tool,update=true){
 selected=tool;for(const item of tools){const panel=$($('tab-'+item.id).getAttribute('aria-controls'));panel.hidden=item.id!==tool.id;}
 document.querySelector('footer').hidden=tool.id!=='video';$('openSearch').setAttribute('aria-label','Cambiar herramienta. Actual: '+tool.name);
 if(update){const hash=tool.id==='document'?'#convertir':tool.id==='kobo'?'#enviar-kobo':'#'+tool.id;if(location.hash!==hash)history.pushState(null,'',hash);}
}
for(const tool of tools)$('tab-'+tool.id).onclick=()=>activate(tool);
function fromHash(){const key=location.hash.slice(1),id=key==='convertir'?'document':key==='enviar-kobo'?'kobo':key;activate(tools.find(t=>t.id===id)||tools[0],false);}
fromHash();addEventListener('hashchange',fromHash);addEventListener('popstate',fromHash);
function search(){
 const query=$('toolSearch').value,found=searchTools(query);$('searchResults').replaceChildren();$('searchCount').textContent=found.length?found.length+(found.length===1?' herramienta':' herramientas'):'No encontramos esa herramienta. Probá con “PDF” o “audio”.';
 const sections=query.trim()?[['Resultados',found]]:[['Favoritos',found.filter(t=>favorites.includes(t.id))],...['Convertir','PDF','Audio y video','Kobo'].map(group=>[group,found.filter(t=>t.group===group&&!favorites.includes(t.id))])];
 for(const [title,items] of sections){if(!items.length)continue;const heading=document.createElement('h3');heading.className='menu-group';heading.textContent=title;$('searchResults').appendChild(heading);
  for(const tool of items){
   const row=document.createElement('div');row.className='search-row';const button=document.createElement('button');button.className='search-result';button.setAttribute('aria-current',String(tool.id===selected.id));const text=document.createElement('span'),name=document.createElement('strong'),detail=document.createElement('small');name.textContent=tool.name;detail.textContent=tool.detail;text.append(name,detail);button.appendChild(text);
   if(tool.id===selected.id){const mark=document.createElement('span');mark.textContent='Actual';mark.className='current-mark';button.appendChild(mark);}
   button.onclick=()=>{activate(tool);dialog.close();const panel=$($('tab-'+tool.id).getAttribute('aria-controls')),heading=panel.querySelector('h2');heading.tabIndex=-1;heading.focus({preventScroll:true});panel.scrollIntoView({block:'start',behavior:'instant'});};
   const star=document.createElement('button');star.className='star-button';star.id='star-'+tool.id;const active=favorites.includes(tool.id);star.textContent=active?'★':'☆';star.setAttribute('aria-pressed',String(active));star.setAttribute('aria-label',(active?'Quitar de favoritos: ':'Guardar favorito: ')+tool.name);star.onclick=()=>{favorites=active?favorites.filter(id=>id!==tool.id):[...favorites,tool.id];try{localStorage.setItem('bajamegas-favorites',JSON.stringify(favorites));}catch{}search();$('star-'+tool.id).focus();};
   row.append(button,star);$('searchResults').appendChild(row);
  }
 }
}
function open(){if(dialog.open)return;$('toolSearch').value='';search();dialog.showModal();$('toolSearch').focus();}
$('openSearch').onclick=open;$('closeSearch').onclick=()=>dialog.close();$('toolSearch').oninput=search;
dialog.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();dialog.close();}});
$('toolSearch').onkeydown=e=>{if(e.key==='ArrowDown'){e.preventDefault();$('searchResults').querySelector('.search-result')?.focus();}if(e.key==='Enter'){const found=searchTools($('toolSearch').value);if(found.length===1)$('searchResults').querySelector('.search-result').click();}};
addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();open();}});
// Make each upload area usable by keyboard, with a visible focus target.
for(const label of document.querySelectorAll('label[for]')){const input=$(label.htmlFor);if(input?.type!=='file')continue;label.classList.add('upload-box');input.hidden=true;input.tabIndex=-1;input.setAttribute('aria-hidden','true');label.tabIndex=0;label.setAttribute('role','button');label.addEventListener('keydown',e=>{if(e.target===label&&(e.key==='Enter'||e.key===' ')){e.preventDefault();if(!input.disabled)input.click();}});new MutationObserver(()=>{label.setAttribute('aria-disabled',String(input.disabled));label.tabIndex=input.disabled?-1:0;}).observe(input,{attributes:true,attributeFilter:['disabled']});}
for(const id of ['docFile','splitFile','speechFile','editFile','compressFile']){const input=$(id),label=input.closest('label');if(!label)continue;for(const event of ['dragover','dragleave','drop'])label.addEventListener(event,e=>{e.preventDefault();label.classList.toggle('over',event==='dragover'&&!input.disabled);if(event==='drop'&&!input.disabled&&e.dataTransfer.files.length){const dt=new DataTransfer();dt.items.add(e.dataTransfer.files[0]);input.files=dt.files;input.dispatchEvent(new Event('change'));}});}
const toggle=$('themeToggle');function theme(value){document.documentElement.dataset.theme=value;toggle.textContent=value==='dark'?'☀ Claro':'☾ Oscuro';toggle.setAttribute('aria-label',value==='dark'?'Cambiar a tema claro':'Cambiar a tema oscuro');toggle.setAttribute('aria-pressed',String(value==='dark'));}
theme(document.documentElement.dataset.theme||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'));toggle.onclick=()=>{const next=document.documentElement.dataset.theme==='dark'?'light':'dark';theme(next);try{localStorage.setItem('bajamegas-theme',next);}catch{}};

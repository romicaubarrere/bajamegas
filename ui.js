import {tools,searchTools,validFavorites} from './navigation-core.js';
const $=id=>document.getElementById(id),tabs=[...document.querySelectorAll('[role=tab]')],categories=[...document.querySelectorAll('[data-category]')];
let selected=tools[0],lastUsed={},favorites=['document','speech','merge'];
try{const stored=localStorage.getItem('bajamegas-favorites');if(stored!==null)favorites=validFavorites(JSON.parse(stored));}catch{}
function favoriteUI(){
 $('favorites').replaceChildren();
 for(const id of favorites.slice(0,3)){
  const tool=tools.find(t=>t.id===id),button=document.createElement('button');button.className='favorite-shortcut';button.textContent=tool.name;button.setAttribute('aria-current',String(id===selected.id));button.onclick=()=>activate($('tab-'+id));$('favorites').appendChild(button);
 }
 if(!favorites.length){const hint=document.createElement('span');hint.className='note';hint.textContent='Marcá tus herramientas con ☆';$('favorites').appendChild(hint);}
 const active=favorites.includes(selected.id);$('favoriteToggle').textContent=active?'★ En favoritos':'☆ Guardar favorito';$('favoriteToggle').setAttribute('aria-pressed',String(active));$('favoriteToggle').setAttribute('aria-label',(active?'Quitar de favoritos: ':'Guardar en favoritos: ')+selected.name);
}
function activate(tab,update=true){
 selected=tools.find(t=>'tab-'+t.id===tab.id)||tools[0];lastUsed[selected.category]=selected.id;
 for(const item of tabs){const active=item===tab;item.setAttribute('aria-selected',String(active));item.tabIndex=active?0:-1;$(item.getAttribute('aria-controls')).hidden=!active;}
 categories.forEach(btn=>btn.setAttribute('aria-pressed',String(btn.dataset.category===selected.category)));
 $('toolSelect').replaceChildren();
 for(const tool of tools.filter(t=>t.category===selected.category)){const option=document.createElement('option');option.value=tool.id;option.textContent=tool.name;option.selected=tool.id===selected.id;$('toolSelect').appendChild(option);}
 $('currentTool').textContent=selected.group+' / '+selected.name;document.querySelector('footer').hidden=selected.id!=='video';favoriteUI();
 if(update)history.replaceState(null,'',selected.id==='document'?'#convertir':selected.id==='kobo'?'#enviar-kobo':'#'+selected.id);
}
for(const tab of tabs){tab.addEventListener('click',()=>activate(tab));tab.addEventListener('keydown',e=>{let i=tabs.indexOf(tab);if(['ArrowRight','ArrowDown'].includes(e.key))i=(i+1)%tabs.length;else if(['ArrowLeft','ArrowUp'].includes(e.key))i=(i-1+tabs.length)%tabs.length;else if(e.key==='Home')i=0;else if(e.key==='End')i=tabs.length-1;else return;e.preventDefault();activate(tabs[i]);tabs[i].focus();});}
for(const btn of categories)btn.onclick=()=>{const tool=tools.find(t=>t.id===lastUsed[btn.dataset.category])||tools.find(t=>t.category===btn.dataset.category);activate($('tab-'+tool.id));};
$('toolSelect').onchange=()=>activate($('tab-'+$('toolSelect').value));
$('favoriteToggle').onclick=()=>{favorites=favorites.includes(selected.id)?favorites.filter(id=>id!==selected.id):[selected.id,...favorites];try{localStorage.setItem('bajamegas-favorites',JSON.stringify(favorites));}catch{}favoriteUI();};
function fromHash(){const key=location.hash.slice(1);activate($(key==='enviar-kobo'?'tab-kobo':key==='convertir'?'tab-document':'tab-'+key)||$('tab-document'),false);}
fromHash();addEventListener('hashchange',fromHash);
const dialog=$('toolDialog');
function search(){
 const found=searchTools($('toolSearch').value);$('searchResults').replaceChildren();$('searchCount').textContent=found.length?found.length+' herramienta(s) disponible(s).':'No encontramos esa herramienta. Probá con PDF, audio o convertir.';
 for(const tool of found){const button=document.createElement('button');button.className='search-result';const text=document.createElement('span'),name=document.createElement('strong'),detail=document.createElement('small');name.textContent=tool.name;detail.textContent=tool.group+' · '+tool.detail;text.append(name,detail);button.appendChild(text);if(favorites.includes(tool.id)){const star=document.createElement('span');star.className='search-star';star.textContent='★';star.setAttribute('aria-label','Favorito');button.appendChild(star);}button.onclick=()=>{activate($('tab-'+tool.id));dialog.close();const heading=$( $('tab-'+tool.id).getAttribute('aria-controls')).querySelector('h2')||$('currentTool');heading.tabIndex=-1;heading.focus();};$('searchResults').appendChild(button);}
}
function openSearch(){if(dialog.open)return;$('toolSearch').value='';search();dialog.showModal();$('toolSearch').focus();}
$('openSearch').onclick=openSearch;$('allTools').onclick=openSearch;$('closeSearch').onclick=()=>dialog.close();$('toolSearch').oninput=search;
$('toolSearch').onkeydown=e=>{if(e.key==='ArrowDown'){e.preventDefault();$('searchResults').querySelector('button')?.focus();}};
addEventListener('keydown',e=>{const editing=e.target.matches('input,textarea,select,[contenteditable=true]');if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'||e.key==='/'&&!editing&&!dialog.open){e.preventDefault();openSearch();}});
const toggle=$('themeToggle');
function theme(value){document.documentElement.dataset.theme=value;toggle.textContent=value==='dark'?'☀ Tema claro':'☾ Tema oscuro';toggle.setAttribute('aria-label',value==='dark'?'Cambiar a tema claro':'Cambiar a tema oscuro');toggle.setAttribute('aria-pressed',String(value==='dark'));}
theme(document.documentElement.dataset.theme||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'));
toggle.addEventListener('click',()=>{const next=document.documentElement.dataset.theme==='dark'?'light':'dark';theme(next);try{localStorage.setItem('bajamegas-theme',next);}catch{}});

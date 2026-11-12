const $=id=>document.getElementById(id);
const tabs=[...document.querySelectorAll('[role=tab]')];
function activate(tab,update=true){
 for(const item of tabs){const active=item===tab;item.setAttribute('aria-selected',String(active));item.tabIndex=active?0:-1;$(item.getAttribute('aria-controls')).hidden=!active;}
 document.querySelector('footer').hidden=tab.id!=='tab-video';
 if(update)history.replaceState(null,'',tab.id==='tab-document'?'#convertir':tab.id==='tab-kobo'?'#enviar-kobo':'#'+tab.id.slice(4));
}
for(const tab of tabs){tab.addEventListener('click',()=>activate(tab));tab.addEventListener('keydown',e=>{let i=tabs.indexOf(tab);if(e.key==='ArrowRight')i=(i+1)%tabs.length;else if(e.key==='ArrowLeft')i=(i-1+tabs.length)%tabs.length;else if(e.key==='Home')i=0;else if(e.key==='End')i=tabs.length-1;else return;e.preventDefault();activate(tabs[i]);tabs[i].focus();});}
function fromHash(){const key=location.hash.slice(1);activate($(key==='enviar-kobo'?'tab-kobo':key==='convertir'?'tab-document':'tab-'+key)||$('tab-document'),false);}
fromHash();addEventListener('hashchange',fromHash);
const toggle=$('themeToggle');
function theme(value){document.documentElement.dataset.theme=value;toggle.textContent=value==='dark'?'☀ Tema claro':'☾ Tema oscuro';toggle.setAttribute('aria-label',value==='dark'?'Cambiar a tema claro':'Cambiar a tema oscuro');toggle.setAttribute('aria-pressed',String(value==='dark'));}
theme(document.documentElement.dataset.theme||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'));
toggle.addEventListener('click',()=>{const next=document.documentElement.dataset.theme==='dark'?'light':'dark';theme(next);try{localStorage.setItem('bajamegas-theme',next);}catch{}});

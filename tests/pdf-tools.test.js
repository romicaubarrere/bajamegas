import test from 'node:test';
import assert from 'node:assert/strict';
import {pageSelection,imagePlacement} from '../pdf-tools-core.js';
test('selecciona rangos sin duplicar páginas y conserva el orden del documento',()=>{
 assert.deepEqual(pageSelection('4, 1-3, 2',6),[1,2,3,4]);
 assert.deepEqual(pageSelection('',3),[1,2,3]);
 for(const value of ['0','3-2','1-9','abc','1,'])assert.throws(()=>pageSelection(value,6));
});
test('ajusta fotos verticales y horizontales a A4 sin recortar',()=>{
 for(const [w,h] of [[400,1200],[1800,600]]){
  const p=imagePlacement(w,h,'a4');assert.ok(p.x>=23.99&&p.y>=23.99);assert.ok(p.width<=p.page[0]&&p.height<=p.page[1]);assert.ok(Math.abs(p.width/p.height-w/h)<1e-9);
 }
 assert.deepEqual(imagePlacement(200,300,'original'),{page:[200,300],x:0,y:0,width:200,height:300});
});

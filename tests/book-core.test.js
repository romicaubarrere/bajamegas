import test from 'node:test';import assert from 'node:assert/strict';
import {pageRegions,positionedLines,cleanBookText,bookBlocks} from '../book-core.js';
test('separa las hojas apaisadas sin invertir izquierda y derecha',()=>{
 assert.deepEqual(pageRegions(840,600).map(r=>r.x),[0,420]);assert.equal(pageRegions(600,840).length,1);assert.equal(pageRegions(840,600,'single').length,1);
 const items=[{text:'derecha',x:500,y:10,width:40,height:10},{text:'izquierda',x:30,y:10,width:50,height:10}];
 assert.equal(positionedLines(items,pageRegions(840,600)[0])[0].text,'izquierda');
});
test('une palabras cortadas y conserva separación de párrafos',()=>{
 assert.equal(cleanBookText('revolu-\nción industrial\ny social.\n\nOtro párrafo.'),'revolución industrial y social.\n\nOtro párrafo.');
});
test('elimina encabezados repetidos y numeración sin quitar texto del cuerpo',()=>{
 const sides=Array.from({length:4},(_,i)=>({height:600,lines:[{text:'LA ERA DEL IMPERIO',y:20,height:10},{text:String(i+1),y:25,height:10},{text:'Texto '+i,y:200,height:10}]}));
 assert.deepEqual(bookBlocks(sides).map(b=>b.text),['Texto 0','Texto 1','Texto 2','Texto 3']);
});

test('limpia guiones blandos y une una palabra cortada entre páginas',()=>{
 assert.equal(cleanBookText('re \u00ad\nforzaba'), 'reforzaba');
 const sides=[{height:600,lines:[{text:'mundo especial-',y:300,height:10}]},{height:600,lines:[{text:'mente complejo.',y:300,height:10}]}];
 assert.deepEqual(bookBlocks(sides).map(b=>b.text),['mundo especialmente complejo.']);
});

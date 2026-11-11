import test from 'node:test';
import assert from 'node:assert/strict';
import {pageRanges} from '../pdf-split-core.js';
test('501, 1000 y 1201 páginas se dividen sin omisiones ni duplicados',()=>{
  for(const total of [1,500,501,1000,1201]){
    const ranges=pageRanges(total,500);const pages=ranges.flatMap(r=>Array.from({length:r.end-r.start},(_,i)=>r.start+i));
    assert.deepEqual(pages,Array.from({length:total},(_,i)=>i));assert.ok(ranges.every(r=>r.end-r.start<=500));
  }
});
test('permite partes más chicas y rechaza valores inválidos',()=>{
 assert.deepEqual(pageRanges(7,3),[{start:0,end:3},{start:3,end:6},{start:6,end:7}]);
 for(const invalid of [0,-1,501,1.5,NaN,Infinity])assert.throws(()=>pageRanges(501,invalid));
});

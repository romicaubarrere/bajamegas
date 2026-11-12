import test from 'node:test';
import assert from 'node:assert/strict';
import {orderedPages,compressionResult} from '../pdf-edit-core.js';
import {timestamp,transcriptSegments,subtitles} from '../speech-core.js';
test('el orden de páginas admite rangos, inversión y exige una permutación completa',()=>{
 assert.deepEqual(orderedPages('3, 1-2, 4',4),[3,1,2,4]);assert.deepEqual(orderedPages('4-1',4),[4,3,2,1]);
 for(const s of ['1,1,3','1,2','0,1,2','1-4','hola'])assert.throws(()=>orderedPages(s,3));
});
test('la compresión nunca informa ahorro cuando el archivo crece',()=>{
 assert.deepEqual(compressionResult(1000,600),{smaller:true,saved:400,percent:40});assert.deepEqual(compressionResult(1000,1200),{smaller:false,saved:0,percent:0});
});
test('subtítulos con tiempos correctos, milisegundos y fin desconocido',()=>{
 assert.equal(timestamp(3661.125),'01:01:01,125');assert.equal(timestamp(59.9996),'00:01:00,000');
 const segments=transcriptSegments({text:'Hola',chunks:[{text:' Hola ',timestamp:[0,null]}]},3.5);assert.deepEqual(segments,[{text:'Hola',start:0,end:3.5}]);
 assert.equal(subtitles(segments,'srt'),'1\n00:00:00,000 --> 00:00:03,500\nHola\n');assert.ok(subtitles(segments,'vtt').startsWith('WEBVTT\n\n00:00:00.000 --> 00:00:03.500'));
 assert.equal(transcriptSegments({text:'   '},5).length,0);
});

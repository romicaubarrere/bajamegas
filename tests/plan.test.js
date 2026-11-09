import test from 'node:test';
import assert from 'node:assert/strict';
import { MB, createPlan, fractionTarget } from '../plan.js';

test('respeta el presupuesto de tamaño y deja margen para audio y contenedor', () => {
  const p = createPlan({w:1920,h:1080,dur:120},20);
  assert.ok((p.vbps + 96000) * 120 / 8 <= 20 * MB * 0.9 + 1);
  assert.equal(p.tooSmall,false);
});
test('reduce videos verticales y horizontales sin agrandarlos', () => {
  assert.deepEqual([createPlan({w:1080,h:1920,dur:60},10,'720').w,createPlan({w:1080,h:1920,dur:60},10,'720').h],[720,1280]);
  const p = createPlan({w:640,h:360,dur:15},20,'1080');
  assert.deepEqual([p.w,p.h],[640,360]);
});
test('rechaza tamaños vacíos, negativos, no finitos y metadatos inválidos', () => {
  for (const target of ['',0,-1,0.49,Infinity,NaN]) assert.throws(()=>createPlan({w:1920,h:1080,dur:60},target));
  for (const dur of [0,Infinity,NaN,-1]) assert.throws(()=>createPlan({w:1920,h:1080,dur},20));
  assert.throws(()=>createPlan({w:0,h:1080,dur:10},20));
});
test('avisa si el objetivo no alcanza y produce dimensiones pares', () => {
  const p = createPlan({w:1921,h:1081,dur:3600},0.5);
  assert.equal(p.tooSmall,true);
  assert.equal(p.vbps,150000);
  assert.equal(p.w%2,0); assert.equal(p.h%2,0);
});
test('la mitad y un cuarto conservan decimales en archivos chicos', () => {
  assert.equal(fractionTarget(3*MB,0.5),1.5);
  assert.equal(fractionTarget(10*MB,0.25),2.5);
  assert.equal(fractionTarget(0.2*MB,0.5),0.5);
});

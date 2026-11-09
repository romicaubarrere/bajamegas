import test from 'node:test';
import assert from 'node:assert/strict';
import {fromText,documentHTML,markdownText,zipPath} from '../doc-core.js';
test('preserva tildes y títulos al pasar Markdown a otros formatos',()=>{
 const blocks=fromText('# Título\n\nHola, ñ & <script>alert(1)</script>.',true);
 assert.equal(blocks[0].level,1);assert.match(markdownText(blocks),/^# Título/);
 const html=documentHTML(blocks,'Libro <1>');assert.ok(!html.includes('<script>'));assert.match(html,/&lt;script&gt;/);assert.match(html,/<h1>Título/);
});
test('respeta rutas relativas de capítulos EPUB',()=>{
 assert.equal(zipPath('EPUB/chapters','../Text/cap%201.xhtml#inicio'),'EPUB/Text/cap 1.xhtml');
});

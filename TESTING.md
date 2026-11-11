# Pruebas realizadas

Fecha: 9 de noviembre de 2026.

## Automatizadas

`npm test`: 5 pruebas aprobadas.

- Presupuesto de bits con margen para audio y contenedor.
- Videos verticales y horizontales, sin aumentar la resolución original.
- Rechazo de tamaños vacíos, negativos o no finitos y metadatos inválidos.
- Aviso cuando el objetivo es demasiado bajo y dimensiones pares.
- Cálculo de mitad y cuarto con decimales.

`npm run check`: sintaxis de JavaScript válida.

## Navegador Chrome

- Carga real de un MP4 horizontal de 6 segundos, 1280 × 720 y audio AAC.
- Tamaño negativo: Comprimir queda deshabilitado.
- Cancelación inmediata y nuevo intento sin recargar: correcto.
- Compresión y descarga: original 10,8 MiB; salida 596.885 bytes (0,57 MiB), 852 × 480, WebM VP9/Opus.
- Inspección del archivo descargado con ffprobe y FFmpeg: 159 cuadros de video, duración reproducida de unos 6 segundos y audio presente con señal audible.

- Video vertical sin audio, 360 × 640: compresión completada, de 1,47 MiB a 0,31 MiB.
- Archivo de texto: rechazo con un mensaje claro.

El tamaño y la velocidad varían según el video y el dispositivo. No se probaron Safari ni dispositivos móviles físicos.

## Conversor de documentos

7 pruebas Node aprobadas. En Chrome, se generaron PDF, EPUB, DOCX, MD, TXT y HTML a partir de un texto con títulos, tildes, ñ y símbolos XML; cada salida se volvió a leer y se comparó el texto extraído. Todas pasaron. Se verificó también el formulario de selección, el cambio de formato y la vista previa. La captura automatizada de descargas del navegador no produjo un evento en este entorno, por lo que no se verificó la llegada al disco mediante ese mecanismo.

## Divisor de PDF

9 pruebas Node aprobadas. Prueba de integración con PDF-lib 1.17.1: PDF de 1.201 páginas numeradas dividido en 500 + 500 + 201 páginas. Se reabrieron las tres partes con pypdf y se verificaron el texto numerado y las dimensiones de las 1.201 páginas, sin omisiones ni duplicados. Cancelación comprobada después de la primera parte.

Prueba de interfaz en Chrome: PDF de 501 páginas → dos partes (500 + 1). Descarga de la segunda parte completada; «Convertir esta parte» seleccionó el fragmento en el conversor y lo convirtió a TXT sin activar el límite de 500 páginas.

## PDF largo a un único EPUB

Prueba de integración en Chrome: PDF de 1.201 páginas con texto numerado → un único EPUB. Se volvió a leer el EPUB y se verificaron los 1.201 textos en el orden original, sin páginas de texto omitidas o duplicadas. El límite de 500 páginas se sustituyó por lectura secuencial en tandas y el límite de tamaño PDF pasó a 200 MiB.

Interfaz Kindle: seleccionar PDF de 1.201 páginas → un clic en «Pasar a EPUB para Kindle» → un único botón «Descargar EPUB». Descarga única completada en Chrome.

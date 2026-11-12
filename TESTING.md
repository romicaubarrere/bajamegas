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

## Libros escaneados y OCR

13 pruebas Node aprobadas: detección de hoja doble, orden de columnas, encabezados, numeración, guiones blandos y unión de palabras entre páginas, además de las pruebas existentes.

Pruebas en Chrome con Tesseract en español:

- Hoja doble de un PDF escaneado real: orden de lectura izquierda → derecha con el texto existente.
- OCR forzado de ambas mitades de esa hoja: 6.671 caracteres reconocidos; revisada una muestra de texto.
- PDF sintético compuesto únicamente por una imagen: OCR automático de las dos mitades, sin capa de texto.
- Cancelación durante el reconocimiento: operación abortada y worker finalizado.
- Libro completo de 204 hojas: 395 mitades/hojas con texto existente y 9 procesadas por OCR; 1.224.921 caracteres y 1.952 párrafos en un único EPUB. La detección automática funcionó sin marcar manualmente el modo escaneado.
- Descarga de ese EPUB completada. Se validaron mimetype sin compresión, XML de contenedor, OPF, contenido XHTML e índice.

No se garantiza transcripción perfecta ni se comparó el texto completo palabra por palabra con el impreso. El resultado incluyó aviso de confianza OCR baja.


## Revisión UX y herramientas PDF (12/11/2026)

- `npm run check`: correcto. `npm test`: 15 pruebas aprobadas.
- Unión con pdf-lib real: documentos de 2 y 1 páginas conservan dimensiones y orden; abortar antes de procesar rechaza con AbortError.
- Navegador: selección múltiple, reordenamiento y descarga del PDF unido. El archivo descargado tiene 3 páginas con anchos 310, 210 y 220, en el orden cambiado desde la interfaz.
- Navegador: PNG a PDF A4; archivo descargado válido de una página.
- Navegador: PDF de dos páginas a ZIP JPG; ZIP descargado con pagina-0001.jpg y pagina-0002.jpg, ambas imágenes válidas.
- Tema oscuro: permanece al recargar; conversor abre por defecto y formato de salida visible.
- Rangos inválidos, duplicados y ajuste proporcional sin recorte cubiertos por las nuevas pruebas automáticas.


## Transcripción y PDF (12/11/2026)

- 18 pruebas automáticas y revisión de sintaxis aprobadas.
- En navegador: WAV sintético en inglés, 7 segundos, reconoce el contenido esperado. Descarga SRT verificada con marcas de tiempo y texto. MP4 con la misma pista también se reconoce correctamente.
- En navegador y sobre los archivos descargados: extracción de páginas 1 y 3; rotación de página 2 sumando 180° a sus 90° originales; reordenamiento con flechas a 2, 1, 3. Anchos y rotaciones verificados con pdf-lib.
- Compresión equilibrada de PDF con fotografía: 4.202.241 a 477.142 bytes (88,6% menos), una página conservada de 500 × 700 puntos. Esta reducción es del fixture, no una promesa para otros PDF.
- Pruebas de orden completo, rangos inválidos, cancelación de edición, comparación de tamaños y formato SRT/VTT.
- Límites: no se verificó precisión en conversaciones largas, ruido, múltiples hablantes ni rendimiento en celulares. La transcripción requiere revisar el resultado.

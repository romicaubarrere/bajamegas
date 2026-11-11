# Bajamegas

Compresor de videos gratuito que procesa los archivos en el navegador, sin subirlos a un servidor.

## Uso

Elegí un video, indicá el tamaño objetivo en MB y descargá la versión comprimida. Podés cambiar la resolución o usar los botones «La mitad» y «Un cuarto».

- El tamaño objetivo es aproximado; se reserva margen para audio y contenedor.
- La compresión ocurre en tiempo real. Mantené la pestaña abierta y visible.
- El resultado se guarda en MP4 con H.264/AAC cuando el navegador lo soporta, o WebM como alternativa. La compatibilidad al compartir depende de la aplicación de destino.
- La entrada debe poder reproducirse en el navegador. Algunos videos HEVC requieren Safari o una conversión previa.
- Los videos no se envían a servidores. La página carga tipografías de Google Fonts.

## GitHub Pages

Publicá desde `main`, carpeta `/ (root)`, en **Settings → Pages → Deploy from a branch**. No necesita compilación, dependencias ni backend.

Para probar localmente, serví esta carpeta con cualquier servidor HTTP estático. Abrir `index.html` directamente con `file://` no carga los módulos JavaScript.

## Verificación

Requiere Node.js 20 o posterior, sin instalar paquetes:

```
npm test
npm run check
```

Las pruebas cubren presupuesto de tamaño, orientación, resolución, límites de calidad y entradas inválidas. Ver `TESTING.md` para las pruebas realizadas en navegador.

## Conversor de documentos

La pestaña «Convertir documentos» acepta PDF con texto, EPUB sin DRM, MD, DOCX, TXT y HTML, y exporta a esos seis formatos. Procesa texto y títulos básicos; no conserva imágenes, tablas, notas ni el diseño de página. Los PDF escaneados pueden procesarse con el OCR integrado. Google Docs debe exportarse primero a DOCX; los DOC binarios antiguos no se admiten. Límite: PDF hasta 200 MiB; otros documentos hasta 40 MiB y ZIP expandidos hasta 80 MiB. Los PDF largos se leen secuencialmente en tandas de 500 páginas, acumulando el texto en orden para generar un único archivo de salida; no hay límite de 500 páginas para la conversión.

Las bibliotecas se cargan desde jsDelivr con versiones fijas (JSZip 3.10.1, PDF.js 4.10.38 y pdfmake 0.2.20 con Roboto). Requiere conexión para esa carga; el archivo del usuario permanece en el navegador.

## Dividir PDF

La pestaña «Dividir PDF» admite originales de hasta 200 MiB y genera archivos independientes de 1 a 500 páginas por parte. Conserva el contenido visual de las páginas y permite descargar cada parte o seleccionarla directamente en el conversor, donde se admiten PDF hasta 200 MiB por archivo. No tiene el límite de 500 páginas para el original. Requiere un PDF sin contraseña y carga PDF-lib 1.17.1 desde jsDelivr. La división no es OCR ni reduce el peso de cada página.

### Libro completo para Kindle

Elegir el PDF completo y tocar «Pasar a EPUB para Kindle» basta para generar una única descarga. La lectura secuencial se organiza en tandas de 500 páginas; el texto de todas las tandas se ensambla en un solo EPUB. No se generan archivos intermedios para el usuario ni hace falta dividir el PDF antes.

## Libros escaneados y OCR

El modo Kindle detecta PDF producidos por ClearScan/Paper Capture y documentos sin texto en las dos primeras hojas; también puede activarse manualmente. Usa PDF.js para respetar la rotación, divide visualmente hojas apaisadas en mitades y ordena izquierda antes de derecha. Si hay texto utilizable, lo ordena por coordenadas; si falta o está muy dañado, rasteriza la página y aplica Tesseract.js 6.0.1 con Tesseract.js-core 6.0.0. El usuario puede forzar OCR de todas las páginas en español o inglés.

Se procesa una hoja por vez, reutilizando un único worker OCR y liberando los canvas, con progreso y cancelación. El texto se limpia mediante reglas para guiones de fin de línea, saltos y encabezados repetidos, y termina en un único archivo. El OCR es aproximado y no hace corrección editorial; notas al pie, tablas y diseños complejos pueden perder estructura. Se recorta un margen pequeño de la imagen antes del OCR para reducir ruido del escáner. Las bibliotecas y modelos requieren conexión, pero el PDF no se envía a un servidor.

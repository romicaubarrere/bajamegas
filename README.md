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

La pestaña «Convertir documentos» acepta PDF con texto, EPUB sin DRM, MD, DOCX, TXT y HTML, y exporta a esos seis formatos. Procesa texto y títulos básicos; no conserva imágenes, tablas, notas ni el diseño de página. Los PDF escaneados requieren OCR externo. Google Docs debe exportarse primero a DOCX; los DOC binarios antiguos no se admiten. Límite: PDF hasta 200 MiB; otros documentos hasta 40 MiB y ZIP expandidos hasta 80 MiB. Los PDF largos se leen secuencialmente en tandas de 500 páginas, acumulando el texto en orden para generar un único archivo de salida; no hay límite de 500 páginas para la conversión.

Las bibliotecas se cargan desde jsDelivr con versiones fijas (JSZip 3.10.1, PDF.js 4.10.38 y pdfmake 0.2.20 con Roboto). Requiere conexión para esa carga; el archivo del usuario permanece en el navegador.

## Dividir PDF

La pestaña «Dividir PDF» admite originales de hasta 200 MiB y genera archivos independientes de 1 a 500 páginas por parte. Conserva el contenido visual de las páginas y permite descargar cada parte o seleccionarla directamente en el conversor, donde se admiten PDF hasta 200 MiB por archivo. No tiene el límite de 500 páginas para el original. Requiere un PDF sin contraseña y carga PDF-lib 1.17.1 desde jsDelivr. La división no es OCR ni reduce el peso de cada página.

### Libro completo para Kindle

Elegir el PDF completo y tocar «Pasar a EPUB para Kindle» basta para generar una única descarga. La lectura secuencial se organiza en tandas de 500 páginas; el texto de todas las tandas se ensambla en un solo EPUB. No se generan archivos intermedios para el usuario ni hace falta dividir el PDF antes.

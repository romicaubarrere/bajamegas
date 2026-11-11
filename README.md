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

La pestaña «Convertir documentos» acepta PDF con texto, EPUB sin DRM, MD, DOCX, TXT y HTML, y exporta a esos seis formatos. Procesa texto y títulos básicos; no conserva imágenes, tablas, notas ni el diseño de página. Los PDF escaneados requieren OCR externo. Google Docs debe exportarse primero a DOCX; los DOC binarios antiguos no se admiten. Límite: 40 MiB, archivos ZIP expandidos hasta 80 MiB y PDF hasta 500 páginas.

Las bibliotecas se cargan desde jsDelivr con versiones fijas (JSZip 3.10.1, PDF.js 4.10.38 y pdfmake 0.2.20 con Roboto). Requiere conexión para esa carga; el archivo del usuario permanece en el navegador.

## Dividir PDF

La pestaña «Dividir PDF» admite originales de hasta 200 MiB y genera archivos independientes de 1 a 500 páginas por parte. Conserva el contenido visual de las páginas y permite descargar cada parte o seleccionarla directamente en el conversor, donde continúa el límite de 40 MiB por archivo. No tiene el límite de 500 páginas para el original. Requiere un PDF sin contraseña y carga PDF-lib 1.17.1 desde jsDelivr. La división no es OCR ni reduce el peso de cada página.

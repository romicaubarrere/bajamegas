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

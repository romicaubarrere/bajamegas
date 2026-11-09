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

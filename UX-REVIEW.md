# Revisión de usabilidad de Bajamegas

## Alcance

Revisión heurística de los diez flujos y comprobación de la interfaz en Chrome, incluyendo una vista de 390 × 844 píxeles. Se revisaron navegación, jerarquía visual, consistencia, prevención de errores, visibilidad del estado, uso por teclado y tamaños táctiles. No es un estudio con participantes ni una certificación WCAG. No sustituye la prueba en un iPhone real.

## Hallazgos y cambios

| Prioridad | Hallazgo | Criterio | Cambio aplicado |
| --- | --- | --- | --- |
| Alta | Categorías, favoritos, buscador, selector móvil y menú lateral ofrecían repetidamente las mismas herramientas. | Menor carga cognitiva y una arquitectura de información coherente. | Un único botón Herramientas, en todos los tamaños de pantalla. Un solo menú con búsqueda, categorías y favoritos, sin repetir herramientas dentro de él. |
| Alta | La navegación empujaba la tarea principal hacia abajo en celular. | Priorizar la tarea y reducir desplazamiento inicial. | Cabecera compacta y eliminación de filas de navegación. La pantalla abre directamente el conversor. |
| Alta | El nombre del archivo y el control nativo aparecían truncados; algunos textos dependían del idioma del navegador. | Claridad y consistencia. | Área completa para elegir archivo, accesible por teclado. El nombre seleccionado se muestra por separado y admite varias líneas. |
| Alta | Convertir, cancelar y descargar quedaban separados por las opciones de OCR. | Visibilidad de la acción siguiente. | Mismo bloque de acciones; la descarga reemplaza a convertir al terminar. El botón incluye el formato de destino y una indicación explica el estado inicial y el siguiente paso. |
| Alta | Los formatos incorrectos se detectaban recién al procesar. | Prevención y recuperación de errores. | Validación inmediata de formato y tamaño en el conversor. Mensajes con indicación de qué archivo elegir; posibilidad de reintentar. |
| Media | Opciones de escaneo y notas extensas competían con los controles principales. | Divulgación progresiva. | OCR y compatibilidad en detalles desplegables. La detección automática abre las opciones de OCR cuando se necesita. |
| Media | Controles pequeños y campos por debajo de 16 px podían dificultar el uso táctil y activar zoom de iOS. | Legibilidad y accesibilidad. | Altura mínima de 44 px en controles principales, estrellas de 48 px, campos a 16 px y foco visible. |
| Media | El botón Atrás no recuperaba la herramienta anterior. | Control y libertad. | Historial por herramienta, conservando los archivos y resultados en memoria al cambiar entre ellas. |
| Media | El formato elegido no quedaba reflejado en la acción principal. | Correspondencia entre intención y resultado. | Botón Convertir a EPUB/PDF/TXT/etc. La preferencia de tema sigue guardada. |
| Media | Cambiar de herramienta requería volver al inicio de páginas largas. | Acceso estable a la navegación. | Único acceso a Herramientas permanece visible al desplazarse; no duplica filtros. |

## Verificación

- Búsqueda «rotar», selección de Editar páginas y regreso con Atrás.
- Menú móvil: 10 herramientas, una aparición por herramienta, categorías como encabezados y favoritos dentro del mismo menú.
- Conversión de un Markdown de prueba a EPUB y TXT; descarga y estado de resultado.
- Archivo `.doc` rechazado al elegirlo, con mensaje y acción de conversión deshabilitada.
- Vista de 390 px revisada visualmente; menú desplegado y tarea inicial sin controles recortados.
- Sintaxis de los módulos y 18 pruebas automáticas existentes.

## Límites y mejoras siguientes

- Validar con tareas reales en Safari de iPhone y con VoiceOver. La comprobación actual usa Chrome y un marco de 390 px.
- Medir tiempos de OCR/transcripción en celulares. El procesamiento local puede ser lento y el navegador puede suspenderlo en segundo plano; por ahora se avisa que la pestaña debe permanecer abierta.
- La conversión de documentos conserva texto básico, no el diseño ni las imágenes; esta limitación sigue visible. Los modos fuertes de compresión rasterizan las páginas y mantienen su advertencia.
- Probar la encontrabilidad del menú con personas que no conocen la herramienta. No se añadieron métricas ni se recopilan archivos para esta revisión.

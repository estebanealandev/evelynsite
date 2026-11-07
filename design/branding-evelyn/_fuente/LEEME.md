# Generador de la identidad

`marcas.mjs` contiene el dibujo; `datos.mjs`, los textos y la evaluación; `render/escena.js`, las escenas 3D.

```bash
npm ci --ignore-scripts
npm run generar
```

Necesita Google Chrome, el sitio en `http://localhost:4321` y una GPU compatible con Vulkan para los mockups. Las capturas sustituyen logotipo y paleta solo en memoria.

Las fuentes de `fuentes/` tienen licencia SIL OFL 1.1, con su texto al lado.

Las capturas de la portada se hicieron con el sitio aún en navy. El sitio ya usa la propuesta A en la rama `identidad/doble`: para repetirlas hay que arrancar el sitio desde una rama anterior.

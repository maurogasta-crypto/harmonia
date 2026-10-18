# Gestos — el instrumento que se toca con las manos

Una página de Harmonía que usa la cámara frontal para convertir el movimiento
de las manos en notas. Corre entero en el navegador: no le habla a ningún
servidor.

| | |
|---|---|
| La página | `/gestos.html` |
| Código del cliente | `public/gestos/` |
| Banco de pruebas | `pruebas/gestos.mjs` — `npm run prueba` |

---

## 1. Qué es, y qué no

**Es** un instrumento, y desde el 18-oct-2026 un theremin con colores: una
mano da la altura —continua, con todo el cromatismo y lo que hay entre dos
semitonos— y la otra el volumen. Hasta esa fecha la derecha caía en franjas de
una escala y la izquierda sostenía un acorde (ver § 2, «Lo que cambió»).

**No es** parte de la aplicación React. `gestos.html` vive en `public/`, así
que Vite **lo copia tal cual**, sin compilar. Se abre sola, sin `npm install`,
y se puede editar desde el teléfono como cualquier archivo del repositorio.
Esa fue la decisión de fondo: el resto de Harmonía es un monolito de 3268
líneas en `src/App.jsx`, y meter la cámara ahí adentro habría atado dos cosas
que no tienen por qué moverse juntas.

El costo de esa decisión, dicho de frente: **la paleta de colores tonales está
copiada**, no importada. Vive en `src/App.jsx` (fuente canónica) y en
`public/gestos/musica.js` (copia). Si cambia una, hay que cambiar la otra a
mano. Es el mismo caso que el `PROTOCOLO-SECRETOS.md` del repo `datos`
describe para los identificadores públicos repetidos: no es un descuido, es
lo que se paga por no tener build en esta página, y por eso está anotado.

---

## 2. Cómo se toca

### La mano de la nota (la izquierda, o la derecha si se elige)

| Gesto | Qué hace |
|---|---|
| Subirla o bajarla | Sube o baja la nota **sin cortes**. El fondo es un degradé de abajo (grave) hacia arriba (agudo) con el color tonal de cada semitono en su lugar; las líneas marcadas son las notas de la escala, las tenues el resto de los semitonos. Moverla de costado no cambia la nota. |
| Apretar pulgar e índice | Vibrato: cuanto más apretado, más tiembla. |

### La otra mano — el volumen

| Gesto | Qué hace |
|---|---|
| Subirla | Más fuerte. Abajo del 85 % del cuadro, silencio; arriba del 20 %, el máximo. |
| Cerrar el puño | Calla en el acto. La barra del costado se pone naranja. |

**Sin las dos manos a la vista no suena.** Si se pierde la de la nota, seguir
en la última altura sería una nota que nadie está tocando.

### Lo que cambió el 18-oct-2026, y por qué

Lo pidió Mauro: «la mano izquierda o derecha hace la nota y la otra mano hace
el volumen, y el pasaje en la pantalla debería ser continuo y no cortado por
nota, para tener todo el cromatismo».

- **La escala ya no corta: guía.** Marca las líneas fuertes y es adonde tira
  el **imán** (`imanar` de `musica.js`): en 0 es glissando puro, en 1 vuelve a
  ser el teclado por notas de antes. Así lo de antes sigue estando, a un
  deslizador de distancia.
- **El pellizco dejó de hacer sonar.** Ahora suena la otra mano; el pellizco
  quedó para el vibrato.
- **El acorde de la mano izquierda se fue**, porque esa mano es la del
  volumen. Volvería con un tercer gesto, no quitándole el volumen.
- **3.3 (gestos-manos 1.5): qué mano es cuál lo decide el LADO de la
  pantalla**, no la etiqueta «Left/Right» del modelo, que con la cámara
  frontal se equivoca: la primera prueba de la APK salió con la nota en la
  mano derecha. La pantalla es un espejo, así que la que se ve a la izquierda
  es la izquierda (`repartirPorLado`). «Manos cambiadas» da vuelta ese reparto.
- **3.2, el mismo día, después de que Mauro lo tocara:** la izquierda es la
  nota por defecto y la derecha el volumen (la elección guardada antes se
  ignora: se había guardado «derecha» sin que nadie la eligiera). **Acercar la
  mano no cambia nada**: movía el brillo, y un filtro que se abre se oye como
  más volumen. **El tono se desliza**: hasta la 3.1 se fijaba en 10 ms y se
  quedaba quieto hasta el cuadro siguiente, una escalera que a 15–30 cuadros
  por segundo se oía como teclas; ahora va en rampa durante lo que tardó el
  cuadro («como ir corriéndose en un violín»). Y la cámara: 480×360 hasta 60
  cuadros, el bucle con `requestVideoFrameCallback`, y la lectura en vivo dice
  cuánto tarda el modelo («reconoce N ms») y la bitácora si corre en GPU o CPU.
- **Las dos manos van de arriba a abajo** (3.1, el mismo día). La 3.0 leía
  la nota de izquierda a derecha; Mauro: «la mano derecha tiene que subir y
  bajar el tono, ambas subiendo y bajando las manos». El brillo pasó a la
  cercanía.
- **Cada import lleva `?v=`** (3.1). Mauro probó la 3.0 y la mano seguía
  saltando por nota: era la 2.1, todavía en la caché del teléfono, que Pages
  guarda diez minutos por archivo. Al cambiar un módulo sube el `?v=` en
  todos los imports y en `gestos.html` (el banco exige que sean iguales), y el
  sello del instrumento se ve al pie de la página.
- **La altura se mueve aunque no suene**: al abrir el volumen entra en la nota
  a la que se apuntó, sin glissando desde la última.
- **El suavizado llegaba 123 ms tarde, y era un error.** El filtro de una euro
  tenía `beta` 0,02 con la velocidad medida en pantallas por segundo, así que
  nunca se abría: un pasabajos fijo de 1,2 Hz. Con `beta` 3 llega a los 25 ms
  con el mismo temblor en reposo (1,6 cents). Con notas en franjas no se
  notaba —la franja tapaba el retraso—; con altura continua es lo primero que
  se siente.

### La nota se lee del nudillo del medio, no de la punta del índice

El nudillo casi no se mueve cuando los dedos se abren y se cierran, así que la
altura no se corre al apretar el pellizco para el vibrato.

### Si las manos salen cambiadas

Desde la 3.3 no deberían: la mano que se ve a la izquierda de la pantalla es
la izquierda. **«Manos cambiadas»** da vuelta ese reparto (hasta el 18-oct se
llamaba «Cambiar mano», y daba vuelta lo que adivinaba el modelo). MediaPipe etiqueta las manos como si la imagen
estuviera espejada; con la cámara frontal y el cuadro sin espejar, sale al
revés. Por eso es un botón y no una constante: se comprueba mirando la
pantalla, no leyendo la documentación.

---

## 3. Las cinco piezas, y por qué están separadas

```
public/gestos/
  musica.js       escalas, colores, MIDI → Hz.   No sabe que existe una cámara.
  audio.js        Web Audio.                     No sabe que existe una mano.
  manos.js        cámara + MediaPipe.            No sabe que existe el sonido.
  instrumento.js  el único que los conoce a todos: gesto → nota.
  pagina.js       cableado de los controles de gestos.html.
```

Se puede cambiar el motor de audio sin tocar la cámara, y probar la cámara sin
que suene nada. Lo que sale de `manos.js` no son 21 puntos por mano: son cinco
números con sentido musical (dónde está, qué tan cerca, si pellizca, si cierra
el puño). `audio.js` le ofrece al instrumento una voz continua —`altura` con
decimales y `nivel`— y conserva `notaOn`/`notaOff`, que usa la práctica. El resto de la aplicación no debería saber qué es un *landmark*.

### Dos decisiones técnicas que vale la pena no deshacer

**Los osciladores se crean una sola vez y quedan sonando siempre, en
silencio.** Tocar una nota mueve una ganancia y una frecuencia; no crea nodos.
Crear osciladores por nota es la causa más común de latencia irregular y de
clics en el celular — justo lo que un instrumento no se puede permitir, porque
para cuando el sonido llega la mano ya se movió.

**El suavizado es un filtro de una euro, no un promedio.** Cuanto más rápido se
mueve la mano, menos se la suaviza. Un promedio fijo o tiembla en reposo o
llega tarde al ataque; esto no hace ni una cosa ni la otra — **siempre que
`beta` esté en la escala de la velocidad**, que va en pantallas por segundo.
Con 0,02 no se abría nunca (§ 2); el banco mide el retraso.

**MediaPipe se carga al encender la cámara, no al abrir la página.** Con un
`import` estático arriba de todo, un CDN que no contesta —un ascensor, un tren,
una red que filtra— dejaba la página entera muerta y en blanco: ni los ajustes,
ni la clave de la sala, ni un mensaje que dijera por qué. Se descubrió cargando
la página compilada en un navegador de verdad, no leyendo el código. Ahora lo
que falla es el botón de encendido, y lo dice con todas las letras; y el modelo
se pide **antes** que la cámara, así que si el CDN no está, la luz de la cámara
ni siquiera llega a encenderse.

---

## 4. Puesta en marcha

No hay nada que configurar: el instrumento no tiene variables de entorno, ni
función de servidor, ni cuenta de terceros. Alcanza con que la página esté
publicada.

### Dónde puede vivir esta página

**No necesita el build.** `gestos.html` y `public/gestos/*.js` son HTML y módulos
ES servidos tal cual: no importan nada de `src/`, no usan JSX, no dependen de
`npm`. Vite los copia, no los compila. Eso significa que **la página se puede
publicar en cualquier hosting estático con https**, no sólo donde viva Harmonía.

Requisitos reales, que son tres:

1. **https.** `getUserMedia` no existe en http salvo en `localhost`. Cualquier
   GitHub Pages o Vercel lo da solo.
2. **Internet en la primera carga**, para dos CDN: el bundle y el `wasm` de
   MediaPipe (`cdn.jsdelivr.net`) y el modelo de manos
   (`storage.googleapis.com`). Se bajan al **encender la cámara**, no al abrir
   la página — así, si no llegan, falla el encendido y lo dice, en vez de dejar
   la página en blanco.
3. **Un toque.** El navegador no deja sonar audio ni abrir la cámara sin un
   gesto del usuario. Por eso existe el botón «Encender la cámara».

Desde el 2026-09-10 las rutas de `gestos.html` son **relativas** (`./gestos/…`),
así que la página anda igual en la raíz de un dominio y en un GitHub Pages de
proyecto (`usuario.github.io/repo/`). Con rutas absolutas, lo segundo daba 404 y
la página quedaba muda.

> Esto importa por `harmonia:H1`: no se sabe con qué cuenta de Vercel se
> despliega este repositorio, y Mauro es colaborador, no dueño, así que no puede
> averiguarlo. **Para probar el instrumento no hace falta resolver eso**: alcanza
> con publicar estos archivos en un repositorio propio con Pages — que es
> justamente la «incubadora» que decidió el 2026-09-10.

### Probar en la computadora

`npm run dev` sirve la página en `http://localhost:5173/gestos.html` y la
cámara anda: los navegadores aceptan `localhost` sin https. Desde el teléfono
hace falta https, o sea el despliegue de Vercel.

### En el teléfono

Abrir `https://…/gestos.html` → **Encender la cámara**. Hace falta dar permiso
de cámara y un toque para que el navegador deje sonar el audio; los dos son
del navegador, no de la página. Lo que pase con la cámara y el audio se
escribe en «La bitácora».

---

## 5. Lo que todavía no está

- **Ya no enciende luces.** Lo hizo un día. Se retiró el 2026-09-09
  (`harmonia:H3`): el control de luces quedó en **remate**, con Firebase Auth,
  y dos puentes a Tuya en el ecosistema era el mismo trabajo hecho dos veces,
  peor de este lado. Si vuelve, vuelve con autenticación de verdad.
- **¿Una aplicación nativa, por la latencia?** Mauro lo planteó el
  18-oct-2026. El retraso que se siente es la suma de tres cosas: la cámara
  (un cuadro cada 33 ms a 30 por segundo), el reconocimiento de MediaPipe
  (unos 10–30 ms en un teléfono con GPU) y la salida de audio, que en Chrome
  para Android anda en 40–100 ms según el teléfono. La lectura en vivo muestra
  ahora esa última («audio N ms»). Una APK con MediaPipe nativo y AAudio/Oboe
  puede bajar el audio a 10–20 ms en un teléfono que lo soporte bien, y pedir
  la cámara a 60 cuadros: del orden de 50–80 ms menos. **Antes se arregló lo
  que sobraba de este lado** —el suavizado, que solo se comía 100 ms—; si con
  eso todavía se siente tarde, lo que sigue es la APK, en un repositorio
  aparte y con la misma lógica de `musica.js` traducida.
  **Se sintió tarde, y la APK existe desde el 18-oct-2026**: está en `android/`
  de `maurogasta-crypto/gestos` (no acá, porque Harmonía publica por Vercel y
  la APK necesita su propio workflow). `Musica.kt` e `Instrumento.kt` son
  traducciones de `musica.js` e `instrumento.js`: si cambia uno, cambia el
  otro en la misma tanda.
- **Pocos gestos.** El pellizco y el puño. Cruzar una zona de la
  pantalla y los gestos de dos manos combinados quedaron para después.
- **La melodía es monofónica.** Una nota por vez, con ligado. Un acorde con la
  mano derecha necesitaría varias voces, y el pellizco ya no alcanzaría como
  disparador.
- **No hay MIDI.** `Web MIDI API` permitiría manejar un sintetizador de
  verdad en vez del motor interno.
- **Sin registro de lo que se toca.** No graba nada, ni en el teléfono ni
  afuera.

---

## 6. Al tocar este código

- **Los módulos no se conocen entre sí.** Si una función se necesita en dos,
  sube a `musica.js` o se pasa como parámetro; no se copia.
- **Nada de credenciales del lado del cliente**, nunca, por ninguna razón. Hoy
  es fácil: no hay ninguna credencial en el proyecto. Si vuelve a haber una
  función de servidor, la página manda un alias y la función traduce.
- **Se corre el banco de pruebas antes de subir**: `npm run prueba`. Cubre la
  teoría musical del instrumento, y desde el 18-oct-2026 el instrumento entero
contra un lienzo y un motor de mentira, el retraso del suavizado y que los
`?v=` coincidan, y el reparto de las manos por lado — 21 casos. Lo que necesita cámara o Web Audio
  no se prueba ahí: se prueba con la mano.
- **Que el JavaScript parsee antes de entregar** (`node --check`): un error de
  sintaxis en un módulo ES deja la página en blanco, sin nada que explique por
  qué.
- **Si cambia la paleta de `src/App.jsx`, cambia también la de
  `public/gestos/musica.js`.** Son copias a propósito, y no hay nada que avise.
- **`musica.js` ya no lo usa sólo el instrumento.** Desde el 15-sep-2026,
  `public/codigo/` importa de acá la paleta y la cromática, en vez de hacer una
  tercera copia (ver `EL-CODIGO.md`). O sea que este archivo pasó a ser el
  núcleo compartido del lado de `public/`: **lo que se saque o se renombre acá
  rompe también esa página.** Los dos bancos de pruebas lo cubren, y `npm run
  prueba` corre los dos.

---

*Primera versión: 2026-09-09. Sin el puente a Tuya desde el 2026-09-09.*

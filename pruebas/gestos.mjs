// ─────────────────────────────────────────────────────────────────────────────
// pruebas/gestos.mjs — Banco de pruebas del instrumento de gestos
//
//   node pruebas/gestos.mjs
//
// Sin dependencias y sin navegador: corre la lógica que se puede correr — la
// teoría musical del instrumento, y desde el 18-oct-2026 el instrumento
// entero contra un lienzo y un motor de mentira. Lo que necesita cámara o Web Audio no se
// prueba acá, se prueba con la mano.
// ─────────────────────────────────────────────────────────────────────────────

import assert from "node:assert/strict";

let pasadas = 0, fallidas = 0;
async function prueba(nombre, fn) {
  try { await fn(); pasadas++; console.log(`  ✓ ${nombre}`); }
  catch (e) { fallidas++; console.log(`  ✗ ${nombre}\n      ${e.message}`); }
}
const titulo = (t) => console.log(`\n${t}`);

// ═══ Teoría musical ══════════════════════════════════════════════════════════
const M = await import("../public/gestos/musica.js");

titulo("musica.js — la rejilla y las notas");

await prueba("DO central es MIDI 60", () => {
  assert.equal(M.midiDe("C", 4), 60);
  assert.equal(M.nombreDe(60), "C");
  assert.equal(M.octavaDe(60), 4);
});

await prueba("LA 440 cae en 440 Hz, y la afinación es un parámetro", () => {
  assert.equal(Math.round(M.frecuenciaDe(69)), 440);
  assert.equal(Math.round(M.frecuenciaDe(69, 432)), 432);
  // Una octava arriba es exactamente el doble, no «casi».
  assert.equal(M.frecuenciaDe(81) / M.frecuenciaDe(69), 2);
});

await prueba("la rejilla cubre las octavas pedidas y cierra en la tónica", () => {
  const r = M.rejilla({ tonica: "A", octava: 3, escala: "pentaMenor", octavas: 2 });
  assert.equal(r.length, 5 * 2 + 1, "5 notas por octava, dos octavas, más el cierre");
  assert.equal(r[0], M.midiDe("A", 3));
  assert.equal(r[r.length - 1], M.midiDe("A", 3) + 24);
  // Estrictamente creciente: si dos zonas dan la misma nota, o si baja, el
  // teclado deja de ser un teclado.
  for (let i = 1; i < r.length; i++) assert.ok(r[i] > r[i - 1], `no crece en ${i}`);
});

await prueba("todas las escalas producen rejillas crecientes", () => {
  for (const clave of Object.keys(M.ESCALAS)) {
    const r = M.rejilla({ tonica: "C", octava: 3, escala: clave, octavas: 2 });
    for (let i = 1; i < r.length; i++) {
      assert.ok(r[i] > r[i - 1], `${clave} no crece en ${i}`);
    }
  }
});

await prueba("las zonas cubren la pantalla entera, sin huecos ni desbordes", () => {
  const n = 11;
  assert.equal(M.zonaDe(0, n).indice, 0);
  assert.equal(M.zonaDe(0.999, n).indice, n - 1);
  // El borde exacto no puede salirse del arreglo: la mano llega a x=1.
  assert.equal(M.zonaDe(1, n).indice, n - 1);
  assert.equal(M.zonaDe(-0.2, n).indice, 0);
  // Cada zona tiene el mismo ancho y son contiguas.
  const vistos = new Set();
  for (let i = 0; i < 400; i++) vistos.add(M.zonaDe(i / 400, n).indice);
  assert.equal(vistos.size, n, "alguna zona quedó sin poder alcanzarse");
});

await prueba("el acorde de un grado sube, y el de arriba pasa a la octava siguiente", () => {
  const a = M.acordeDeGrado("mayor", "C", 3, 0);
  assert.deepEqual(a, [M.midiDe("C",3), M.midiDe("E",3), M.midiDe("G",3)]);
  const ultimo = M.acordeDeGrado("mayor", "C", 3, 6);   // séptimo grado
  for (let i = 1; i < ultimo.length; i++) assert.ok(ultimo[i] > ultimo[i-1], "el acorde no está ordenado");
});

await prueba("cada nota tiene color, incluidas las alteradas", () => {
  for (let m = 60; m < 72; m++) {
    assert.notEqual(M.colorDe(m), "#888", `${M.nombreDe(m)} sin color`);
  }
});

await prueba("la etiqueta latina no se olvida de la octava", () => {
  assert.equal(M.etiquetaDe(60, false), "C4");
  assert.equal(M.etiquetaDe(60, true), "DO4");
});


// ═══ El diapasón continuo (gestos-musica 1.1, instrumento 3.0) ══════════════
titulo("el diapasón continuo — una mano la altura, la otra el volumen");

await prueba("la altura es continua: entre dos semitonos hay cents, no un salto", () => {
  const base = 57, semis = 24;
  const a = M.alturaDe(0.5, base, semis);
  assert.equal(a, base + 12, "el centro de la pantalla es la octava del medio");
  // Un paso chico de la mano es un paso chico de altura, en cualquier lugar.
  for (let i = 0; i < 100; i++) {
    const x = M.MARGEN + (i / 100) * (1 - 2 * M.MARGEN);
    const d = M.alturaDe(x + 0.001, base, semis) - M.alturaDe(x, base, semis);
    assert.ok(d > 0 && d < 0.05, `salto de ${d} semitonos en x=${x}`);
  }
});

await prueba("los bordes llegan a las dos puntas del registro y no se pasan", () => {
  assert.equal(M.alturaDe(0, 57, 24), 57);
  assert.equal(M.alturaDe(M.MARGEN, 57, 24), 57);
  assert.equal(M.alturaDe(1 - M.MARGEN, 57, 24), 81);
  assert.equal(M.alturaDe(1.2, 57, 24), 81);
});

await prueba("posicionDe es la inversa exacta de alturaDe: la línea está donde suena", () => {
  for (let m = 57; m <= 81; m += 0.25) {
    const x = M.posicionDe(m, 57, 24);
    assert.ok(Math.abs(M.alturaDe(x, 57, 24) - m) < 1e-9, `MIDI ${m}`);
  }
});

await prueba("el imán: en 0 no toca nada, en 1 cae en la nota, en el medio acerca", () => {
  const notas = M.rejilla({ tonica: "A", octava: 3, escala: "pentaMenor", octavas: 2 });
  assert.equal(M.imanar(58.3, notas, 0), 58.3);
  assert.equal(M.imanar(58.3, notas, 1), 57);
  const medio = M.imanar(58.3, notas, 0.5);
  assert.ok(medio > 57 && medio < 58.3, `quedó en ${medio}`);
  // Nunca se aleja: sea cual sea la fuerza, queda más cerca de alguna nota.
  for (let m = 57; m <= 81; m += 0.1) {
    const d0 = Math.min(...notas.map(n => Math.abs(n - m)));
    const d1 = Math.min(...notas.map(n => Math.abs(n - M.imanar(m, notas, 0.6))));
    assert.ok(d1 <= d0 + 1e-9, `MIDI ${m} se alejó`);
  }
});

await prueba("una altura se nombra por la nota más cercana y sus cents, ±50", () => {
  assert.deepEqual(M.afinacionDe(69), { nota: 69, cents: 0 });
  assert.deepEqual(M.afinacionDe(69.12), { nota: 69, cents: 12 });
  assert.deepEqual(M.afinacionDe(68.7), { nota: 69, cents: -30 });
  for (let m = 60; m < 72; m += 0.07) assert.ok(Math.abs(M.afinacionDe(m).cents) <= 50);
  // Y la frecuencia acepta los decimales: medio semitono es la raíz doceava de 2, a medias.
  assert.ok(Math.abs(M.frecuenciaDe(69.5) - 440 * Math.pow(2, 0.5 / 12)) < 1e-9);
});

const I = await import("../public/gestos/instrumento.js");

await prueba("el volumen: arriba fuerte, abajo calla, y nunca sube al bajar la mano", () => {
  assert.equal(I.nivelDeAltura(0.1), 1);
  assert.equal(I.nivelDeAltura(0.95), 0);
  assert.equal(I.nivelDeAltura(0.86), 0, "abajo del piso hay silencio de verdad");
  let antes = 2;
  for (let y = 0; y <= 1; y += 0.01) {
    const n = I.nivelDeAltura(y);
    assert.ok(n <= antes, `sube en y=${y}`); antes = n;
  }
});

// El instrumento entero, contra un lienzo y un motor de mentira: no suena ni
// dibuja, pero dice qué le pidió a cada uno — y atrapa un NaN antes que la mano.
function falsos() {
  const pedidos = { altura: [], nivel: [] };
  const motor = {
    altura: (m, dura) => { pedidos.altura.push(m); (pedidos.dura ||= []).push(dura); },
    nivel: (v) => pedidos.nivel.push(v),
    brillo: (v) => (pedidos.brillo ||= []).push(v), vibrato() {}, silencio() {},
  };
  const ctx = new Proxy({}, { get: (o, k) => k in o ? o[k] : (k === "createLinearGradient" ? () => ({ addColorStop() {} }) : () => {}), set: (o, k, v) => { o[k] = v; return true; } });
  const canvas = { width: 640, height: 480, getContext: () => ctx };
  return { pedidos, motor, canvas };
}
const mano = (x, y, extra = {}) => ({ x, y, pellizco: 1, puno: false, cercania: 0.5, trazo: null, ...extra });

await prueba("con las dos manos suena; sin la del volumen o con el puño, calla", () => {
  const { pedidos, motor, canvas } = falsos();
  let estado = null;
  const ins = I.crearInstrumento({ canvas, motor, ajustes: { manoNota: "derecha" }, alEstado: (e) => { estado = e; } });
  ins.cuadro({ derecha: mano(0.5, 0.5), izquierda: mano(0.3, 0.2) }, { fps: 30 });
  assert.ok(estado.sonando, "no suena con las dos manos");
  assert.equal(pedidos.altura.at(-1), 57 + 12);
  assert.ok(Number.isFinite(pedidos.nivel.at(-1)));
  ins.cuadro({ derecha: mano(0.5, 0.5), izquierda: null }, { fps: 30 });
  assert.equal(pedidos.nivel.at(-1), 0);
  ins.cuadro({ derecha: mano(0.5, 0.5), izquierda: mano(0.3, 0.2, { puno: true }) }, { fps: 30 });
  assert.equal(pedidos.nivel.at(-1), 0);
  ins.cuadro({ derecha: null, izquierda: mano(0.3, 0.2) }, { fps: 30 });
  assert.equal(pedidos.nivel.at(-1), 0, "sin la mano de la altura no puede seguir sonando");
});

await prueba("«la nota con la izquierda» da vuelta los papeles, y la etiqueta lleva los cents", () => {
  const { pedidos, motor, canvas } = falsos();
  let estado = null;
  const ins = I.crearInstrumento({ canvas, motor, ajustes: { manoNota: "izquierda" }, alEstado: (e) => { estado = e; } });
  const y = 1 - (0.06 + (12.3 / 24) * 0.88);  // 12,3 semitonos arriba de LA3
  ins.cuadro({ izquierda: mano(0.3, y), derecha: mano(0.8, 0.2) }, { fps: 30 });
  assert.ok(Math.abs(pedidos.altura.at(-1) - 69.3) < 1e-9);
  assert.equal(estado.etiqueta, "A4 +30¢");
  assert.ok(estado.sonando);
});

await prueba("el suavizado de la mano llega a tiempo: menos de 40 ms en un glissando", async () => {
  const { crearSuavizador } = await import("../public/gestos/manos.js");
  // Es el filtro que usa el rastreador (beta 3). Con el beta de antes, 0,02,
  // esta misma cuenta daba 123 ms: un pasabajos fijo disfrazado de una euro.
  const f = crearSuavizador({ beta: 3 });
  let t = 0, atraso = 0, n = 0;
  for (let i = 0; i < 60; i++) {
    t += 33.3;
    const real = i * 0.0333;                 // una pantalla por segundo
    const visto = f(real, t);
    if (i > 20) { atraso += real - visto; n++; }
  }
  const ms = (atraso / n) * 1000;            // a 1 pantalla/s, la distancia es el tiempo
  assert.ok(ms < 40, `llega ${ms.toFixed(0)} ms tarde`);
});

await prueba("subir la mano de la nota sube la nota, y moverla de costado no la cambia", () => {
  const { pedidos, motor, canvas } = falsos();
  const ins = I.crearInstrumento({ canvas, motor, ajustes: { manoNota: "derecha" } });
  let antes = -Infinity;
  for (let i = 19; i >= 1; i--) {
    const y = i / 20;
    ins.cuadro({ derecha: mano(0.6, y), izquierda: mano(0.2, 0.3) }, { fps: 30 });
    const m = pedidos.altura.at(-1);
    assert.ok(m >= antes, `baja al subir la mano (y=${y.toFixed(2)})`); antes = m;
  }
  assert.equal(pedidos.altura.at(-1), 57 + 24, "arriba de todo es la nota más aguda");
  ins.cuadro({ derecha: mano(0.1, 0.5), izquierda: mano(0.2, 0.3) }, { fps: 30 });
  const a = pedidos.altura.at(-1);
  ins.cuadro({ derecha: mano(0.9, 0.5), izquierda: mano(0.2, 0.3) }, { fps: 30 });
  assert.equal(pedidos.altura.at(-1), a, "el costado no es la nota");
});

await prueba("todos los imports de public/gestos/ llevan el mismo ?v=, y la página también", async () => {
  const { readFileSync, readdirSync } = await import("node:fs");
  const dir = new URL("../public/gestos/", import.meta.url);
  const versiones = new Set();
  for (const f of readdirSync(dir).filter(f => f.endsWith(".js"))) {
    const txt = readFileSync(new URL(f, dir), "utf8");
    for (const m of txt.matchAll(/from "\.\/([a-z]+)\.js(\?v=[^"]*)?"/g)) {
      assert.ok(m[2], `${f} importa ${m[1]}.js sin ?v=: el teléfono mezclaría versiones`);
      versiones.add(m[2]);
    }
  }
  const html = readFileSync(new URL("../public/gestos.html", import.meta.url), "utf8");
  const m = html.match(/gestos\/pagina\.js(\?v=[^"]*)"/);
  assert.ok(m, "gestos.html pide pagina.js sin ?v=");
  versiones.add(m[1]);
  assert.equal(versiones.size, 1, `hay más de un ?v=: ${[...versiones].join(" ")}`);
});

await prueba("por defecto la izquierda es la nota; el tono se desliza lo que tarda un cuadro; acercar no cambia nada", () => {
  const { pedidos, motor, canvas } = falsos();
  const ins = I.crearInstrumento({ canvas, motor });
  assert.equal(ins.ajustes.manoNota, "izquierda");
  let t = 0;
  for (let i = 0; i < 10; i++) {
    t += 66;   // 15 cuadros por segundo: un teléfono lento
    ins.cuadro({ izquierda: mano(0.3, 0.5 - i * 0.02, { cercania: i / 10 }), derecha: mano(0.8, 0.2) }, { fps: 15, t });
  }
  const d = pedidos.dura.at(-1);
  assert.ok(Math.abs(d - 0.066) < 1e-9, `la rampa dura ${d} s y el cuadro tardó 0,066`);
  for (const x of pedidos.dura) assert.ok(x >= 0.015 && x <= 0.09, `rampa de ${x} s`);
  assert.ok(pedidos.brillo.length <= 1, "el brillo se movió con la mano");
});

await prueba("las manos se reparten por el lado de la pantalla, no por lo que adivina el modelo", async () => {
  const { repartirPorLado } = await import("../public/gestos/manos.js");
  const a = { x: 0.7, palmo: 0.2 }, b = { x: 0.2, palmo: 0.2 }, lejos = { x: 0.5, palmo: 0.05 };
  let r = repartirPorLado([a, b]);
  assert.ok(r.izquierda === b && r.derecha === a);
  r = repartirPorLado([a, b], true);
  assert.ok(r.izquierda === a && r.derecha === b, "«Manos cambiadas» no las dio vuelta");
  assert.equal(repartirPorLado([b]).izquierda, b);
  assert.equal(repartirPorLado([a]).derecha, a);
  r = repartirPorLado([lejos, a, b]);
  assert.ok(r.izquierda === b && r.derecha === a, "con tres manos tocan las dos más grandes");
  r = repartirPorLado([]);
  assert.ok(r.izquierda === null && r.derecha === null);
});

console.log(`\n${pasadas} pasadas, ${fallidas} fallidas\n`);
process.exit(fallidas ? 1 : 0);

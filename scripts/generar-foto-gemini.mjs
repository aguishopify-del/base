#!/usr/bin/env node
// Generador de fotos de producto con Gemini 2.5 Flash Image ("nano banana").
// Mismo contrato de línea de comandos que generar-foto.mjs (OpenAI), para no
// tener que tocar el resto del flujo de la fase 3b.
//
// Uso:
//   node generar-foto-gemini.mjs --clave clave-gemini.txt --prompt "..." --salida foto.jpg
//        [--ref original1.jpg] [--ref original2.jpg]
//        [--tamano 1024x1024]
//
// Con --ref, las imágenes de referencia se mandan como parts de imagen junto
// al texto (edición/fidelidad al producto real); sin --ref, genera desde cero.
// Imprime "OK <ruta>" o "ERROR <detalle>". Código de salida 0/1.

import fs from "node:fs";
import path from "node:path";

function arg(name, def = null) {
  const i = process.argv.indexOf("--" + name);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : def;
}
function args(name) {
  const out = [];
  for (let i = 0; i < process.argv.length; i++) {
    if (process.argv[i] === "--" + name && process.argv[i + 1]) out.push(process.argv[i + 1]);
  }
  return out;
}

const claveArchivo = arg("clave");
const prompt = arg("prompt");
const salida = arg("salida");
const refs = args("ref");
const tamano = arg("tamano", "1024x1024");

function fallo(msg) {
  console.error("ERROR " + msg);
  process.exit(1);
}

if (!claveArchivo || !prompt || !salida) {
  fallo("faltan argumentos obligatorios: --clave, --prompt, --salida");
}
if (!fs.existsSync(claveArchivo)) fallo("no existe el archivo de clave: " + claveArchivo);
const apiKey = fs.readFileSync(claveArchivo, "utf8").trim();
if (!apiKey) fallo("el archivo de clave esta vacio");
for (const r of refs) if (!fs.existsSync(r)) fallo("no existe la imagen de referencia: " + r);

const MIME = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp" };

function aspectRatioFromSize(size) {
  const m = /^(\d+)x(\d+)$/.exec(size);
  if (!m) return "1:1";
  const w = parseInt(m[1], 10), h = parseInt(m[2], 10);
  const ratio = w / h;
  const table = [
    ["1:1", 1], ["16:9", 16 / 9], ["9:16", 9 / 16],
    ["4:3", 4 / 3], ["3:4", 3 / 4], ["3:2", 3 / 2], ["2:3", 2 / 3],
  ];
  let best = table[0], bestDiff = Infinity;
  for (const [name, val] of table) {
    const diff = Math.abs(val - ratio);
    if (diff < bestDiff) { bestDiff = diff; best = [name, val]; }
  }
  return best[0];
}

const MODEL = "gemini-2.5-flash-image";

async function main() {
  const parts = [{ text: prompt }];
  for (const r of refs) {
    const mime = MIME[path.extname(r).toLowerCase()] || "image/jpeg";
    const data = fs.readFileSync(r).toString("base64");
    parts.push({ inline_data: { mime_type: mime, data } });
  }

  const body = {
    contents: [{ parts }],
    generationConfig: {
      responseModalities: ["IMAGE"],
      imageConfig: { aspectRatio: aspectRatioFromSize(tamano) },
    },
  };

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
    {
      method: "POST",
      headers: {
        "x-goog-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  let data;
  try {
    data = await res.json();
  } catch {
    fallo("respuesta no valida del servidor (HTTP " + res.status + ")");
  }

  if (!res.ok || data.error) {
    const e = data.error || {};
    const code = e.code || res.status;
    let pista = "";
    if (res.status === 400 && /API key/i.test(e.message || "")) pista = " — clave incorrecta: pedir al usuario que la vuelva a pegar";
    else if (res.status === 403) pista = " — clave sin permiso o API no habilitada para esta clave";
    else if (res.status === 429) pista = " — limite de ritmo/cuota: esperar 30-60 s y reintentar, o revisar cuota en aistudio.google.com";
    else if (res.status === 400) pista = " — revisar parametros o reformular el prompt (puede haber saltado el filtro de seguridad)";
    fallo((e.message || "HTTP " + res.status) + " [" + code + "]" + pista);
  }

  const responseParts = data?.candidates?.[0]?.content?.parts || [];
  const imgPart = responseParts.find((p) => p.inlineData || p.inline_data);
  const inline = imgPart && (imgPart.inlineData || imgPart.inline_data);
  if (!inline?.data) {
    const textPart = responseParts.find((p) => p.text);
    fallo("la respuesta no contiene imagen" + (textPart ? " — el modelo respondio: " + textPart.text.slice(0, 200) : ""));
  }
  fs.mkdirSync(path.dirname(path.resolve(salida)), { recursive: true });
  fs.writeFileSync(salida, Buffer.from(inline.data, "base64"));
  console.log("OK " + salida);
}

main().catch((e) => fallo(e.message || String(e)));

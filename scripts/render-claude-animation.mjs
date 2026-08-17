import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const [inputArg, outputArg, ffmpegArg, limitArg] = process.argv.slice(2);
if (!inputArg || !outputArg || !ffmpegArg) {
  throw new Error("Uso: node render-claude-animation.mjs <entrada.html> <salida.mp4> <ffmpeg.exe> [fotogramas]");
}

const input = resolve(inputArg);
const output = resolve(outputArg);
const ffmpeg = resolve(ffmpegArg);
const requested = limitArg || "6924";
const frameSequence = requested.includes(",")
  ? requested.split(",").map((value) => Math.max(0, Number(value.trim())))
  : Array.from({ length: Math.max(1, Number(requested)) }, (_, index) => index);
const frameCount = frameSequence.length;
const chromeExe = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const tempDir = await mkdtemp(resolve(tmpdir(), "nuvia-render-"));
// Use a per-process port so independent renders can run in parallel without
// attaching to another chapter's browser session.
const debugPort = 10000 + (process.pid % 20000);

const chrome = spawn(chromeExe, [
  "--headless=new",
  `--remote-debugging-port=${debugPort}`,
  `--user-data-dir=${resolve(tempDir, "chrome-profile")}`,
  "--disable-gpu-vsync",
  "--disable-background-timer-throttling",
  "--disable-renderer-backgrounding",
  "--hide-scrollbars",
  "--no-first-run",
  "--no-default-browser-check",
  "--window-size=1920,1080",
  pathToFileURL(input).href,
], { stdio: ["ignore", "ignore", "pipe"] });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let endpoint;
for (let i = 0; i < 100 && !endpoint; i++) {
  try {
    const pages = await fetch(`http://127.0.0.1:${debugPort}/json/list`).then((r) => r.json());
    endpoint = pages.find((p) => p.type === "page")?.webSocketDebuggerUrl;
  } catch {}
  if (!endpoint) await sleep(100);
}
if (!endpoint) throw new Error("Chrome no abrió el puerto de depuración.");

const ws = new WebSocket(endpoint);
await new Promise((ok, fail) => {
  ws.addEventListener("open", ok, { once: true });
  ws.addEventListener("error", fail, { once: true });
});
let nextId = 1;
const pending = new Map();
ws.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (!message.id) return;
  const waiter = pending.get(message.id);
  if (!waiter) return;
  pending.delete(message.id);
  if (message.error) waiter.reject(new Error(JSON.stringify(message.error)));
  else waiter.resolve(message.result);
});
const cdp = (method, params = {}) => new Promise((resolvePromise, reject) => {
  const id = nextId++;
  pending.set(id, { resolve: resolvePromise, reject });
  ws.send(JSON.stringify({ id, method, params }));
});

await cdp("Emulation.setDeviceMetricsOverride", { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false });
for (let i = 0; i < 200; i++) {
  const ready = await cdp("Runtime.evaluate", { expression: "Boolean(window.__nuvia?.still)", returnByValue: true });
  if (ready.result.value) break;
  if (i === 199) throw new Error("La animación no expuso su controlador.");
  await sleep(100);
}
await cdp("Runtime.evaluate", {
  expression: "document.fonts.ready.then(() => window.__nuvia.still(0))",
  awaitPromise: true,
});
await cdp("Runtime.evaluate", { expression: "new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))", awaitPromise: true });

const encoder = spawn(ffmpeg, [
  "-y", "-hide_banner", "-loglevel", "warning",
  "-f", "image2pipe", "-framerate", "30", "-i", "pipe:0",
  "-an", "-c:v", "libx264", "-preset", "medium", "-crf", "16",
  "-pix_fmt", "yuv420p", "-r", "30", "-movflags", "+faststart", output,
], { stdio: ["pipe", "ignore", "pipe"] });
let ffmpegErrors = "";
encoder.stderr.on("data", (d) => { ffmpegErrors += d.toString(); });

const started = Date.now();
for (let index = 0; index < frameCount; index++) {
  const frame = frameSequence[index];
  await cdp("Runtime.evaluate", {
    expression: `window.__nuvia.still(${frame}); new Promise(r=>requestAnimationFrame(r))`,
    awaitPromise: true,
  });
  const shot = await cdp("Page.captureScreenshot", { format: "png", fromSurface: true, optimizeForSpeed: true });
  const image = Buffer.from(shot.data, "base64");
  if (!encoder.stdin.write(image)) await new Promise((r) => encoder.stdin.once("drain", r));
  if (index % 300 === 0 || index === frameCount - 1) {
    const elapsed = (Date.now() - started) / 1000;
    const fps = (index + 1) / Math.max(elapsed, 0.001);
    process.stdout.write(`F${String(frame).padStart(4, "0")} · ${index + 1}/${frameCount} · ${fps.toFixed(1)} fps de captura\n`);
  }
}
encoder.stdin.end();
const encoderCode = await new Promise((r) => encoder.once("close", r));
ws.close();
chrome.kill();
await new Promise((r) => chrome.once("close", r));
for (let attempt = 0; attempt < 10; attempt++) {
  try {
    await rm(tempDir, { recursive: true, force: true });
    break;
  } catch (error) {
    if (attempt === 9) process.stderr.write(`Aviso: no se pudo limpiar ${tempDir}: ${error.message}\n`);
    else await sleep(250);
  }
}
if (encoderCode !== 0) throw new Error(`FFmpeg terminó con código ${encoderCode}: ${ffmpegErrors}`);
process.stdout.write(`Render terminado: ${output}\n`);

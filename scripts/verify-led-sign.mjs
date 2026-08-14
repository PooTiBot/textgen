import { Buffer } from "node:buffer";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { build } from "vite";

async function readFont(relativePath) {
  const data = await readFile(resolve(relativePath));
  return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
}

const [russoBuffer, comfortaaBuffer, pacificoBuffer] = await Promise.all([
  readFont("public/fonts/catalog/russo-one/RussoOne-Regular.ttf"),
  readFont("public/fonts/catalog/comfortaa/Comfortaa-Variable.ttf"),
  readFont("public/fonts/catalog/pacifico/Pacifico-Regular.ttf"),
]);
const buildResult = await build({
  configFile: false,
  logLevel: "silent",
  build: {
    write: false,
    target: "esnext",
    lib: { entry: resolve("scripts/led-sign-geometry-check-entry.ts"), formats: ["es"] },
    rolldownOptions: { output: { codeSplitting: false } },
  },
});
const output = Array.isArray(buildResult) ? buildResult[0] : buildResult;
const chunk = output.output.find((item) => item.type === "chunk");
if (!chunk || chunk.type !== "chunk") throw new Error("LED verification bundle was not created.");

const moduleUrl = `data:text/javascript;base64,${Buffer.from(chunk.code).toString("base64")}`;
const verificationModule = await import(moduleUrl);
const result = verificationModule.runLedSignGeometryCheck(russoBuffer, comfortaaBuffer, pacificoBuffer);

console.log(
  `LED channel letters verified: ${result.width.toFixed(2)} × ${result.height.toFixed(2)} × ${result.depth.toFixed(2)} mm, ${result.scenarios} scenarios, ${result.parts} printable parts, long-text auto-fit ${result.longTextSize.toFixed(2)} mm.`,
);

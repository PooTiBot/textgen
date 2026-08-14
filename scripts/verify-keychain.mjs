import { Buffer } from "node:buffer";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { build } from "vite";

async function readFont(relativePath) {
  const data = await readFile(resolve(relativePath));
  return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
}

const [regularFontBuffer, scriptFontBuffer] = await Promise.all([
  readFont("public/fonts/catalog/russo-one/RussoOne-Regular.ttf"),
  readFont("public/fonts/catalog/pacifico/Pacifico-Regular.ttf"),
]);
const buildResult = await build({
  configFile: false,
  logLevel: "silent",
  build: {
    write: false,
    target: "esnext",
    lib: {
      entry: resolve("scripts/keychain-geometry-check-entry.ts"),
      formats: ["es"],
    },
    rolldownOptions: { output: { codeSplitting: false } },
  },
});
const output = Array.isArray(buildResult) ? buildResult[0] : buildResult;
const chunk = output.output.find((item) => item.type === "chunk");
if (!chunk || chunk.type !== "chunk") throw new Error("Keychain verification bundle was not created.");

const moduleUrl = `data:text/javascript;base64,${Buffer.from(chunk.code).toString("base64")}`;
const verificationModule = await import(moduleUrl);
const result = verificationModule.runKeychainGeometryCheck(regularFontBuffer, scriptFontBuffer);

console.log(
  `Keychain geometry verified: ${result.width.toFixed(2)} × ${result.height.toFixed(2)} × ${result.thickness.toFixed(2)} mm, ${result.scenarios} scenarios, long-name auto-fit ${result.effectiveLongNameSize.toFixed(2)} mm.`,
);

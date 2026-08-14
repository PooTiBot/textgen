import { Buffer } from "node:buffer";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { build } from "vite";

const fontFiles = {
  "Russo One": "public/fonts/catalog/russo-one/RussoOne-Regular.ttf",
  Comfortaa: "public/fonts/catalog/comfortaa/Comfortaa-Variable.ttf",
  "Marck Script": "public/fonts/catalog/marck-script/MarckScript-Regular.ttf",
};
const fontBuffers = {};

for (const [name, file] of Object.entries(fontFiles)) {
  const data = await readFile(resolve(file));
  fontBuffers[name] = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
}

const buildResult = await build({
  configFile: false,
  logLevel: "silent",
  build: {
    write: false,
    target: "esnext",
    lib: {
      entry: resolve("scripts/tolerance-geometry-check-entry.ts"),
      formats: ["es"],
    },
    rolldownOptions: {
      output: { codeSplitting: false },
    },
  },
});
const output = Array.isArray(buildResult) ? buildResult[0] : buildResult;
const chunk = output.output.find((item) => item.type === "chunk");

if (!chunk || chunk.type !== "chunk") {
  throw new Error("Tolerance verification bundle was not created.");
}

const moduleUrl = `data:text/javascript;base64,${Buffer.from(chunk.code).toString("base64")}`;
try {
  const verificationModule = await import(moduleUrl);
  const result = verificationModule.runToleranceGeometryCheck(fontBuffers);
  console.log(
    `Tolerance verified: ${result.caseCount} font/text/tolerance cases, ${result.vertexCount} finite vertices.`,
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}

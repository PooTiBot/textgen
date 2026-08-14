import { Buffer } from "node:buffer";
import { resolve } from "node:path";
import { build } from "vite";

const buildResult = await build({
  configFile: false,
  logLevel: "silent",
  build: {
    write: false,
    target: "esnext",
    lib: {
      entry: resolve("scripts/export-geometry-check-entry.ts"),
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
  throw new Error("Export verification bundle was not created.");
}

const moduleUrl = `data:text/javascript;base64,${Buffer.from(chunk.code).toString("base64")}`;
const verificationModule = await import(moduleUrl);
const result = verificationModule.runExportGeometryCheck();

console.log(
  `Export geometry verified: ${result.width.toFixed(2)} × ${result.height.toFixed(2)} × ${result.depth.toFixed(2)} mm, ${result.vertices} vertices, ${result.stlBytes} STL bytes, ${result.parts} separate parts.`,
);

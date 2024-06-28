import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import { defineConfig } from "rollup";

const config = defineConfig({
  input: "src/index.ts",
  output: [
    {
      name: "Json2Ts",
      dir: "lib",
      format: "umd",
    },
    {
      format: "es",
      file: "lib/index.mjs",
    },
  ],
  plugins: [
    typescript({
      // 使用 TypeScript 插件
      tsconfig: "tsconfig.json", // 指定 tsconfig.json 文件
      declaration: true,
      declarationDir: "lib",
      include: ["src/**/*"],
    }),
    resolve(),
    commonjs(),
  ],
});

export default config;

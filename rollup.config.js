import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import resolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";
import { dts } from "rollup-plugin-dts";

/** @type {import('rollup').RollupOptions[]} */
export default [
	{
		input: {
			index: "./src/index.tsx",
		},
		output: {
			dir: "./dist",
			format: "esm",
		},
		external: ["react", "react-dom", "react-dom/client", "react/jsx-runtime"],
		plugins: [resolve(), commonjs(), json(), typescript()],
	},
	{
		input: {
			index: "./src/index.tsx",
		},
		output: {
			dir: "./dist",
			format: "esm",
		},
		external: ["react", "react-dom", "react-dom/client", "react/jsx-runtime"],
		plugins: [resolve(), commonjs(), json(), typescript(), dts()],
	},
	{
		input: "./src/bin/index.ts",
		output: {
			file: "./bin/index.js",
			format: "esm",
		},
		plugins: [
			typescript({
				outDir: "./bin",
			}),
			terser(),
		],
	},
];

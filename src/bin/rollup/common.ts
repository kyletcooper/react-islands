import commonjsPlugin from "@rollup/plugin-commonjs";
import resolvePlugin from "@rollup/plugin-node-resolve";
import replacePlugin from "@rollup/plugin-replace";
import terserPlugin from "@rollup/plugin-terser";
import path from "path";
import { RollupOptions } from "rollup";
import { NormalizedConfigOptions } from "../util/config";
import { virtualizeDependencyPlugin } from "./plugins/virtualizeDependencyPlugin";
import { runRollup, watchRollup } from "./run";

export function createCommonConfig(
	options: NormalizedConfigOptions
): RollupOptions {
	const { output, minify, jsx, common } = options;

	return {
		input: "virtual-entry",
		jsx,
		output: {
			name: "Islands._Common",
			file: path.resolve(output, "common.js"),
			format: "iife",
		},
		plugins: [
			replacePlugin({
				preventAssignment: true,
				"process.env.NODE_ENV": JSON.stringify("production"),
			}),
			virtualizeDependencyPlugin({
				dependencies: common,
				namespace: "Islands._Common",
			}),
			resolvePlugin(),
			commonjsPlugin(),
			minify && terserPlugin(),
		],
	};
}

export function buildCommon(
	options: NormalizedConfigOptions
): Promise<boolean> {
	return runRollup(createCommonConfig(options));
}

export function watchCommon(options: NormalizedConfigOptions) {
	return watchRollup(createCommonConfig(options));
}

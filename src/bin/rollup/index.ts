import commonjsPlugin from "@rollup/plugin-commonjs";
import resolvePlugin from "@rollup/plugin-node-resolve";
import replacePlugin from "@rollup/plugin-replace";
import terserPlugin from "@rollup/plugin-terser";
import typescriptPlugin from "@rollup/plugin-typescript";
import path from "path";
import {
	InputOptions,
	ModuleFormat,
	OutputOptions,
	Plugin,
	rollup,
	RollupBuild,
	RollupOptions,
} from "rollup";
import { typescriptPaths as typescriptPathsPlugin } from "rollup-plugin-typescript-paths";
import * as codeGen from "./generation";
import { BuildOptions, normalizeOptions } from "./options";
import { runScriptAfterBuildPlugin } from "./plugins/runScriptAfterBuildPlugin";
import { virtualizeDependencyPlugin } from "./plugins/virtualizeDependencyPlugin";

export function createRollupConfigs(options: BuildOptions): RollupOptions[] {
	const normalized = normalizeOptions(options);
	const { name, input, output, minify, ssg, jsx, typescript, common } =
		normalized;

	const configs: (RollupOptions | null)[] = [];

	const createRollupConfig = (opts: {
		active?: boolean;
		name?: string;
		subName: string;
		format: ModuleFormat;
		globals?: Record<string, string>;
		prefix?: (name: string) => string;
		suffix?: (name: string) => string;
		plugins?: Plugin[];
	}): RollupOptions | null => {
		const {
			active = true,
			name: mainName = `Islands.${name}`,
			subName,
			format,
			globals = {},
			prefix,
			suffix,
			plugins = [],
		} = opts;

		if (!active) {
			return null;
		}

		return {
			input,
			external: Object.keys(globals),
			jsx,
			output: {
				name: mainName,
				globals,
				format,
				entryFileNames: `[name]/${subName}`,
				dir: output,
				banner: prefix && ((chunk) => prefix(chunk.name)),
				footer: suffix && ((chunk) => suffix(chunk.name)),
			},
			plugins: [
				resolvePlugin({
					extensions: [
						".cjs",
						".mjs",
						".js",
						".json",
						".node",
						".jsx",
						".ts",
						".tsx",
					],
				}),
				commonjsPlugin(),
				replacePlugin({
					preventAssignment: true,
					"process.env.NODE_ENV": JSON.stringify("production"),
				}),
				minify && terserPlugin(),
				typescript &&
					typescriptPlugin({
						jsx,
					}),
				typescript && typescriptPathsPlugin(),
				...plugins,
			],
		};
	};

	configs.push(
		createRollupConfig({
			active: true,
			subName: "client.js",
			format: "iife",
			globals: common,
			suffix: (name) => `\nwindow.Islands['${name}']?.render('${name}')`,
		})
	);

	configs.push(
		createRollupConfig({
			active: ssg,
			subName: "server.cjs",
			format: "cjs",
			suffix: () =>
				codeGen.renderComponentToFile("ssg.html", "module.exports.component"),
			plugins: [
				runScriptAfterBuildPlugin({
					deleteAfterRunning: true,
				}),
			],
		})
	);

	return configs.filter(isRollupOptions);
}

export function createCommonConfig(options: BuildOptions): RollupOptions {
	const normalized = normalizeOptions(options);
	const { output, minify, jsx, common } = normalized;

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

function isRollupOptions(
	config: RollupOptions | null
): config is RollupOptions {
	return config !== null;
}

export async function runRollup(
	inputOptions: InputOptions,
	outputOptions: OutputOptions
) {
	let bundle: RollupBuild | undefined;
	let buildFailed = false;

	try {
		bundle = await rollup(inputOptions);
		await bundle.write(outputOptions);
	} catch (error) {
		buildFailed = true;
		console.error(error);
	}

	if (bundle) {
		await bundle.close();
	}

	return !buildFailed;
}

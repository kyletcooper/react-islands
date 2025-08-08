import commonjsPlugin from "@rollup/plugin-commonjs";
import resolvePlugin from "@rollup/plugin-node-resolve";
import replacePlugin from "@rollup/plugin-replace";
import terserPlugin from "@rollup/plugin-terser";
import typescriptPlugin from "@rollup/plugin-typescript";
import { ModuleFormat, Plugin, RollupOptions } from "rollup";
import { typescriptPaths as typescriptPathsPlugin } from "rollup-plugin-typescript-paths";
import { CodeGen } from "../util/code-gen";
import { IndividualIslandConfigOptions } from "../util/config";
import { runScriptAfterBuildPlugin } from "./plugins/runScriptAfterBuildPlugin";
import { runRollups, watchRollup } from "./run";

function createIslandRollupConfig(
	config: IndividualIslandConfigOptions,
	opts: {
		subName: string;
		format: ModuleFormat;
		globals?: Record<string, string>;
		prefix?: (name: string) => string;
		suffix?: (name: string) => string;
		plugins?: Plugin[];
	}
): RollupOptions {
	const { name, input, output, minify, ssg, jsx, typescript, common, define } =
		config;

	const { subName, format, globals = {}, prefix, suffix, plugins = [] } = opts;

	return {
		input,
		external: Object.keys(globals),
		jsx,
		output: {
			name: `Islands.${name}`,
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
			typescript &&
				typescriptPlugin({
					outputToFilesystem: false,
					noForceEmit: true,
					compilerOptions: {
						outDir: output,
						jsx,
					},
				}),
			typescript && typescriptPathsPlugin(),
			replacePlugin({
				preventAssignment: true,
				values: {
					...define,
					"process.env.NODE_ENV": JSON.stringify("production"),
				},
			}),
			minify && terserPlugin(),
			...plugins,
		],
	};
}

export function createIslandRollupConfigClient(
	config: IndividualIslandConfigOptions
): RollupOptions {
	return createIslandRollupConfig(config, {
		subName: "client.js",
		format: "iife",
		globals: config.common.reduce((globals, packageName) => {
			return {
				...globals,
				[packageName]: `Islands._Common["${CodeGen.packageNameToProperty(
					packageName
				)}"]`,
			};
		}, {}),
		suffix: () =>
			`\nwindow.Islands['${config.name}']?.render('${config.name}')`,
	});
}

export function createIslandRollupConfigServer(
	config: IndividualIslandConfigOptions
): RollupOptions {
	return createIslandRollupConfig(config, {
		subName: "server.cjs",
		format: "cjs",
		suffix: () =>
			CodeGen.renderReactComponentToFile(
				"ssg.html",
				"module.exports.component"
			),
		plugins: [
			runScriptAfterBuildPlugin({
				deleteAfterRunning: true,
			}),
		],
	});
}

export function createIslandRollupConfigs(
	config: IndividualIslandConfigOptions
): RollupOptions[] {
	const configs: RollupOptions[] = [createIslandRollupConfigClient(config)];

	if (config.ssg) {
		configs.push(createIslandRollupConfigServer(config));
	}

	return configs;
}

export function buildIsland(
	options: IndividualIslandConfigOptions
): Promise<boolean> {
	return runRollups(createIslandRollupConfigs(options));
}

export function watchIsland(options: IndividualIslandConfigOptions) {
	return watchRollup(createIslandRollupConfigClient(options));
}

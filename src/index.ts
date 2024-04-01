import {
	Compilation,
	Compiler,
	Configuration,
	WebpackOptionsNormalized,
	webpack,
} from "webpack";
import tmp from "tmp";
import { renderToStaticMarkup } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";

tmp.setGracefulCleanup();

export class ReactIslandsWebpackPlugin {
	createSubCompiler(
		dir: string,
		entry: Record<string, any>,
		options: WebpackOptionsNormalized
	): Compiler {
		const plugins = options.plugins.filter(
			(plugin) => !(plugin instanceof ReactIslandsWebpackPlugin)
		);

		const compilerOptions: Configuration = {
			mode: "development",
			target: "node",
			context: process.cwd(),
			entry,
			output: {
				libraryTarget: "commonjs",
				path: dir,
				filename: "[name].js",
			},
			module: options.module,
			stats: false,
			devtool: false,
			optimization: {
				minimize: false,
			},
			plugins,
		};

		return webpack(compilerOptions);
	}

	async apply(compiler: Compiler) {
		let components: string[] = [];

		const options = compiler.options;

		const entry =
			typeof options.entry === "function"
				? await options.entry()
				: options.entry;

		const { name: dir } = tmp.dirSync();

		const { RawSource } = compiler.webpack.sources;

		compiler.hooks.run.tapAsync(
			"ReactIslandsWebpackPlugin",
			(compiler: Compiler, callback) => {
				components = Object.keys(entry);

				const subCompiler = this.createSubCompiler(dir, entry, options);

				subCompiler.run((err, stats) => {
					if (err) {
						console.error(err);
						throw new Error("ReactIslandsWebpackPlugin: Error during compile.");
					}

					if (stats?.hasErrors()) {
						console.log(stats?.toString());
						throw new Error("ReactIslandsWebpackPlugin: Failed to compile.");
					}

					callback();
					console.log("ReactIslandsWebpackPlugin: Compilation complete.");
				});
			}
		);

		compiler.hooks.thisCompilation.tap(
			"ReactIslandsWebpackPlugin",
			(compilation: Compilation) => {
				for (const name of components) {
					const file = `${dir}/${name}.js`;
					const { default: component } = require(file);

					const markup = renderToStaticMarkup(component());

					compilation.emitAsset(`${name}.html`, new RawSource(markup));
				}
			}
		);
	}
}

export function createIsland(name: string, Component: React.FC) {
	const isBrowser =
		typeof window !== "undefined" && typeof window.document !== "undefined";

	if (isBrowser) {
		document
			.querySelectorAll(`[data-react-component="${name}"]`)
			.forEach((element) => {
				const propsJSON = element.getAttribute("data-react-props") || "{}";
				const props = JSON.parse(propsJSON);
				hydrateRoot(element, Component(props));
			});
	}
}

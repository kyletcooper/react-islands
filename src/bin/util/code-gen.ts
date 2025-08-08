export class CodeGen {
	private lines: string[] = [];

	public import(packageName: string, as?: string) {
		if (!as) {
			as = CodeGen.packageNameToProperty(packageName);
		}

		return this.add(`import * as ${as} from "${packageName}"`);
	}

	public createGlobalObject(scope: string): this {
		return this.add(
			scope
				.split(".")
				.map((s) => s.trim())
				.filter(Boolean)
				.map((_, index, levels) => {
					const path = "window." + levels.slice(0, index + 1).join(".");
					return `${path} = ${path} || {}`;
				})
		);
	}

	public setGlobalObjectProperty(
		scope: string,
		key: string,
		value: string
	): this {
		return this.add(`window.${scope}['${key}'] = ${value}`);
	}

	public static packageNameToProperty(packageName: string): string {
		return packageName
			.replace(/^@/, "")
			.replace(/\//g, "_")
			.replace(/[-_](.)/g, (_, c) => c.toUpperCase())
			.replace(/^[a-z]/, (c) => c.toUpperCase());
	}

	public static renderReactComponentToFile(
		outputFilename: string,
		component: string
	) {
		return `var server = require('react-dom/server');
var fs = require('node:fs/promises');
var path = require('node:path');
const html = server.renderToString( ${component}( {} ) );
const file = path.resolve(__dirname, '${outputFilename}');
fs.writeFile(file, html, { flag: "w+" });`;
	}

	public add(line: string | string[]): this {
		if (Array.isArray(line)) {
			this.lines.push(...line);
		} else {
			this.lines.push(line);
		}

		return this;
	}

	public out(): string {
		return this.lines.join(";\n");
	}
}

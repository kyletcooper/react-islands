export function createGlobalObject(namespace: string): string {
	return namespace
		.split(".")
		.filter(Boolean)
		.map((_, index, levels) => {
			const path = "window." + levels.slice(0, index + 1).join(".");
			return `${path} = ${path} || {}`;
		})
		.join(";\n");
}

export function assignGlobalProperty(
	namespace: string,
	property: string,
	value: string
): string {
	const namespacing = createGlobalObject(namespace);
	return `${namespacing};\nwindow.${namespace}['${property}'] = ${value};\n`;
}

export function importPackage(packageName: string): string {
	return `import * as ${packageNameToProperty(
		packageName
	)} from "${packageName}";\n`;
}

export function importAndGlobalisePackage(
	packageName: string,
	globalName: string
): string {
	let str = "";

	str += importPackage(packageName);
	str += `${globalName} = ${packageNameToProperty(packageName)};\n`;

	return str;
}

export function packageNameToProperty(packageName: string): string {
	return packageName
		.replace(/^@/, "")
		.replace(/\//g, "_")
		.replace(/[-_](.)/g, (_, c) => c.toUpperCase())
		.replace(/^[a-z]/, (c) => c.toUpperCase());
}

export function renderComponentToFile(
	filename: string,
	component: string
): string {
	return `var server = require('react-dom/server');
	var fs = require('node:fs/promises');
	var path = require('node:path');
const html = server.renderToString( module.exports.component( {} ) );
const file = path.resolve(__dirname, '${filename}');
fs.writeFile(file, html, { flag: "w+" });`;
}

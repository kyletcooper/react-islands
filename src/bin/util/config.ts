import { readFileSync } from "fs";

export type ConfigOptions = {
	islands: Record<string, string>;
	output: string;
	minify?: boolean;
	ssg?: boolean;
	jsx?: "react" | "react-jsx" | "preserve" | "preserve-react";
	typescript?: boolean;
	common?: string[];
	define?: Record<string, string>;
};

export type NormalizedConfigOptions = {
	islands: Record<string, string>;
	output: string;
	minify: boolean;
	ssg: boolean;
	jsx: "react" | "react-jsx" | "preserve" | "preserve-react";
	typescript: boolean;
	common: string[];
	define: Record<string, string>;
};

export type IndividualIslandConfigOptions = Omit<
	NormalizedConfigOptions,
	"islands"
> & {
	name: string;
	input: string;
};

export function readConfig(path: string): NormalizedConfigOptions {
	const contents = readFileSync(path, "utf8");
	const json = JSON.parse(contents) as ConfigOptions;

	return normalizeBuildOptions(json);
}

export function normalizeBuildOptions(
	options: ConfigOptions
): NormalizedConfigOptions {
	const normalizeBoolean = (
		value: boolean | undefined | null | void,
		fallback: boolean
	): boolean => {
		if (value === false) {
			return false;
		} else if (value === true) {
			return true;
		} else {
			return fallback;
		}
	};

	return {
		islands: options.islands,
		output: options.output || "./dist/",
		minify: normalizeBoolean(options.minify, true),
		ssg: normalizeBoolean(options.ssg, true),
		jsx: options.jsx || "react-jsx",
		typescript: normalizeBoolean(options.ssg, false),
		common: options.common || [
			"react",
			"react/jsx-runtime",
			"react-dom/client",
			"@wrdagency/react-islands",
		],
		define: options.define || {},
	};
}

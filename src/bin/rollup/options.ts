import { JsxPreset } from "rollup";
import { packageNameToProperty } from "./generation";

export type BuildOptions = {
	name: string;
	input: string;
	output: string;
	minify?: boolean;
	ssg?: boolean;
	jsx?: JsxPreset;
	typescript?: boolean;
	common?: string[] | Record<string, string>;
};

export type NormalizedBuildOptions = {
	name: string;
	input: string;
	output: string;
	minify: boolean;
	ssg: boolean;
	jsx: JsxPreset;
	typescript: boolean;
	common: Record<string, string>;
};

export const normalizeOptions = (
	options: BuildOptions
): NormalizedBuildOptions => {
	return {
		name: options.name,
		input: options.input,
		output: options.output || "./dist/",
		minify: normalizeBoolean(options.minify, true),
		ssg: normalizeBoolean(options.ssg, true),
		jsx: options.jsx || "react-jsx",
		typescript: normalizeBoolean(options.ssg, false),
		common: normalizeCommonOption(
			options.common || [
				"react",
				"react-dom/client",
				"@wrdagency/react-islands",
			]
		),
	};
};

export const normalizeBoolean = (
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

export const normalizeCommonOption = (
	share: BuildOptions["common"] = [""]
): NormalizedBuildOptions["common"] => {
	if (Array.isArray(share)) {
		return share.reduce(
			(record, packageName) => ({
				...record,
				[packageName]: "Islands._Common." + packageNameToProperty(packageName),
			}),
			{}
		);
	} else {
		return share;
	}
};

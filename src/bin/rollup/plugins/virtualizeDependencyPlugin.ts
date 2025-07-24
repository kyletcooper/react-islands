import { Plugin } from "rollup";
import * as codeGen from "../generation";

type Options = {
	dependencies: Record<string, string>;
	namespace?: string;
};

export function virtualizeDependencyPlugin(opts: Options): Plugin {
	const { dependencies, namespace = "" } = opts;

	const VIRTUAL_MODULE_ID = "\0virtual-entry";

	return {
		name: "rollup-plugin-virtualize-dependency",
		resolveId(source) {
			if (source === "virtual-entry") return VIRTUAL_MODULE_ID;
			return null;
		},
		load(id) {
			if (id !== VIRTUAL_MODULE_ID) {
				return null;
			}

			let str = codeGen.createGlobalObject(namespace) + ";\n";

			for (const [dependency, name] of Object.entries(dependencies)) {
				str += codeGen.importAndGlobalisePackage(dependency, name);
			}

			return str;
		},
	};
}

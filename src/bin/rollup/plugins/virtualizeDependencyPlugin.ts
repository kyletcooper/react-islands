import { Plugin } from "rollup";
import { CodeGen } from "../../util/code-gen";

type Options = {
	dependencies: string[];
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

			const code = new CodeGen();
			code.createGlobalObject(namespace);

			for (const packageName of dependencies) {
				const name = CodeGen.packageNameToProperty(packageName);
				code.import(packageName, name);
				code.setGlobalObjectProperty(namespace, name, name);
			}

			return code.out();
		},
	};
}

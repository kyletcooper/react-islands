import fs from "fs";
import path from "path";
import { Plugin } from "rollup";
import { Output } from "../../util/output";

type Options = {
	deleteAfterRunning?: boolean;
};

export function runScriptAfterBuildPlugin(opts: Options): Plugin {
	const { deleteAfterRunning = false } = opts;

	return {
		name: "rollup-plugin-run-script-after-builder",
		writeBundle(outputOptions, bundle) {
			const outputDir = outputOptions.dir
				? outputOptions.dir
				: path.dirname(outputOptions.file || "");

			for (const [fileName, chunkInfo] of Object.entries(bundle)) {
				const filePath = path.resolve(outputDir, fileName);

				if (chunkInfo.type !== "chunk" || !chunkInfo.isEntry) {
					return;
				}

				if (!filePath && !filePath.endsWith("js")) {
					return;
				}

				if (!fs.existsSync(filePath)) {
					return;
				}

				const out = new Output();
				out.command(`node ${filePath}`).then(() => {
					if (deleteAfterRunning) {
						fs.unlinkSync(filePath);
					}
				});
			}
		},
	};
}

import { buildCommon, buildIsland } from "../rollup";
import { Command } from "../util/command";
import { readConfig } from "../util/config";
import { Output } from "../util/output";

export default new Command({
	description: "Build and statically render the islands.",
	args: [
		{
			name: "config",
			type: String,
			alias: "c",
			// @ts-ignore
			description: "The config file to use.",
			defaultValue: "islands.config.json",
		},
	],
	callback: async (args) => {
		const { config: configPath } = args;

		const output = new Output();
		const config = readConfig(configPath);

		// 1. Build common dependencies.
		if (config.common) {
			await output.spinner("Creating common dependencies file", async () => {
				return buildCommon(config);
			});
		}

		// 2. Build each island.
		for (const [name, input] of Object.entries(config.islands)) {
			await output.spinner(`Creating island ${name}`, () => {
				return buildIsland({
					name,
					input,
					...config,
				});
			});
		}
	},
});

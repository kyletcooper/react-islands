import { watchCommon, watchIsland } from "../rollup";
import { Command } from "../util/command";
import { readConfig } from "../util/config";
import { Output } from "../util/output";

export default new Command({
	description: "Watch & build the islands for development",
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
			const watcher = watchCommon(config);
			output.watcher("Common Dependencies", watcher);
		}

		// 2. Setup watcher for each island.
		for (const [name, input] of Object.entries(config.islands)) {
			const watcher = watchIsland({
				name,
				input,
				...config,
			});

			output.watcher(name, watcher);
		}
	},
});

import { readFileSync } from "fs";
import { OutputOptions } from "rollup";
import yoctoSpinner from "yocto-spinner";
import { createCommonConfig, createRollupConfigs, runRollup } from "../rollup";
import { Command } from "../util/command";

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
		const { config } = args;

		const configJson = JSON.parse(readFileSync(config, "utf8"));

		const { islands, ...restConfig } = configJson;

		if (restConfig.common !== false) {
			const spinner = yoctoSpinner({
				text: `Creating common dependencies file...`,
			}).start();

			const commonRollupConfig = createCommonConfig(restConfig);
			const { output, ...input } = commonRollupConfig;
			const success = await runRollup(input, output as OutputOptions);

			if (success) {
				spinner.success(`Succeeded: common dependencies file`);
			} else {
				spinner.warning(`Failed: common dependencies file`);
			}
		}

		for (const [name, input] of Object.entries(islands)) {
			const spinner = yoctoSpinner({
				text: `Creating island ${name}...`,
			}).start();

			const rollupConfigs = createRollupConfigs({
				input,
				name,
				...restConfig,
			});

			let hadFailure = false;

			for (const rollupConfig of rollupConfigs) {
				const { output, ...input } = rollupConfig;
				const success = await runRollup(input, output as OutputOptions);

				if (!success) {
					hadFailure = true;
				}
			}

			rollupConfigs.map(async (options) => {});

			if (hadFailure) {
				spinner.warning(`Failed island: ${name}`);
			} else {
				spinner.success(`Succeeded island: ${name}`);
			}
		}
	},
});

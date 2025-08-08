import {
	OutputOptions,
	rollup,
	RollupBuild,
	RollupOptions,
	RollupWatcher,
	watch,
} from "rollup";

export async function runRollup(options: RollupOptions): Promise<boolean> {
	const { output, ...input } = options;

	let bundle: RollupBuild | undefined;
	let buildFailed = false;

	try {
		bundle = await rollup(input);
		await bundle.write(output as OutputOptions);
	} catch (error) {
		buildFailed = true;
		console.error(error);
	}

	if (bundle) {
		await bundle.close();
	}

	return !buildFailed;
}

export async function runRollups(options: RollupOptions[]): Promise<boolean> {
	let isSuccess = true;

	for (const rollupConfig of options) {
		if (!(await runRollup(rollupConfig))) {
			isSuccess = false;
		}
	}

	return isSuccess;
}

export function watchRollup(options: RollupOptions): RollupWatcher {
	const { output, ...input } = options;

	const watcher = watch({
		...input,
		output,
		watch: {
			clearScreen: false,
		},
	});

	watcher.on("event", (evt) => {
		if (evt.code === "BUNDLE_END" && evt.result) {
			evt.result.close();
		}
	});

	return watcher;
}

export function watchRollups(options: RollupOptions[]): RollupWatcher[] {
	return options.map((rollupConfig) => watchRollup(rollupConfig));
}

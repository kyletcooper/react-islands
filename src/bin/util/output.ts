import { exec } from "child_process";
import { RollupWatcher } from "rollup";
import { promisify } from "util";
import yoctoSpinner from "yocto-spinner";

const execPromise = promisify(exec);

export class Output {
	public line(line: string) {
		console.log(line);
	}

	public async spinner(message: string, callback: () => Promise<boolean>) {
		const spinner = yoctoSpinner({
			text: `${message}...`,
		}).start();

		const success = await callback();

		if (success) {
			spinner.success(`Succeeded: ${message}`);
		} else {
			spinner.warning(`Failed: ${message}`);
		}
	}

	public watcher(name: string, watcher: RollupWatcher) {
		const spinner = yoctoSpinner({
			text: `Rebuilding ${name}...`,
		});

		let timeAtStart = 0;

		watcher.on("event", (evt) => {
			if (evt.code === "START") {
				spinner.clear();
				spinner.start();
				timeAtStart = Date.now();
			} else if (evt.code === "END") {
				const timeElapsed = Date.now() - timeAtStart;
				spinner.success(`Rebuilt: ${name} in ${timeElapsed}ms.`);
			} else if (evt.code === "ERROR") {
				spinner.warning(`Failed: ${name}`);
				console.error(evt.error);
			}
		});
	}

	public async command(command: string) {
		try {
			const { stdout, stderr } = await execPromise(command);

			if (stdout) {
				console.log(stdout);
			}

			if (stderr) {
				console.error(stderr);
			}

			return stdout;
		} catch (e) {
			console.error(e);
			throw e;
		}
	}
}

import { exec } from "child_process";
import { promisify } from "util";

const execPromise = promisify(exec);

export const consoleExecute = async (command: string) => {
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
};

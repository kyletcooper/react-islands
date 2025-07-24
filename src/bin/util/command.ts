import commandLineArgs from "command-line-args";
import commandLineUsage from "command-line-usage";

export class Command {
	public readonly args: commandLineArgs.OptionDefinition[];
	public readonly callback: (args: commandLineArgs.CommandLineOptions) => void;
	public readonly description: string;

	constructor(options: {
		args: commandLineArgs.OptionDefinition[];
		callback: (args: commandLineArgs.CommandLineOptions) => void;
		description: string;
	}) {
		let { args, callback, description } = options;

		args.push({
			name: "help",
			alias: "h",
			type: Boolean,
			// @ts-ignore
			description: "Display this usage guide.",
		});

		this.args = args;
		this.callback = callback;
		this.description = description;
	}

	run(argv: string[]) {
		const { help, ...args } = commandLineArgs(this.args, { argv });

		if (help) {
			console.log(
				commandLineUsage([
					{
						header: "Options",
						optionList: this.args,
					},
				])
			);

			return;
		}

		return this.callback(args);
	}
}

export async function commandset(commands: Record<string, Command>) {
	const {
		command,
		help = false,
		_unknown: argv = [],
	} = commandLineArgs(
		[
			{
				name: "command",
				type: String,
				defaultOption: true,
			},
			{
				name: "help",
				alias: "h",
				type: Boolean,
				// @ts-ignore
				description: "Display this usage guide.",
			},
		],
		{
			stopAtFirstUnknown: true,
		}
	);

	if (!command || !(command in commands)) {
		if (help) {
			const commandsSummary = Object.keys(commands).map((key) => ({
				name: key,
				summary: commands[key].description,
			}));

			const usage = commandLineUsage([
				{
					header: "Synopsis",
					content: "npx react-islands <command> <options>",
				},
				{
					header: "Command List",
					content: commandsSummary,
				},
			]);

			console.log(usage);
		} else {
			console.error(`Command '${command}' not recognized by React Islands.`);
		}

		return;
	}

	return commands[command].run([...argv, help && "--help"].filter(Boolean));
}

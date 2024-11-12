import fs from "node:fs/promises";
import path from "node:path";
import { Island } from "./types";
import { renderToString } from "react-dom/server";

interface PrerenderIslandsOpts {
	islands: Record<string, Island>;
	outDir: string;
}

export async function prerenderIslands(opts: PrerenderIslandsOpts) {
	const { islands, outDir } = opts;

	// Clean or create outDir.
	try {
		await fs.access(outDir);

		for (const file of await fs.readdir(outDir)) {
			await fs.unlink(path.resolve(outDir, file));
		}
	} catch (error) {
		await fs.mkdir(outDir);
	}

	// For each island.
	for (const island of Object.values(islands)) {
		const { component, opts } = island;
		const { name } = opts;
		const Component = component;

		// Render it to [outDir]/[name].html.
		const html = renderToString(<Component />);
		const file = path.resolve(outDir, `${name}.html`);

		console.log(`Rendering component ${name} to ${file}`);
		fs.writeFile(file, html, { flag: "w+" });
	}
}

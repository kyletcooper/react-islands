import { FC } from "react";
import { hydrateIslands, renderIsland, withProps } from "./render";
import { Island, IslandOpts } from "./types";

/**
 * Create a React Island.
 *
 * You can render the island using the Island.render function.
 *
 * @param component React.FC
 * @param opts IslandOpts
 * @returns Island
 */
export function createIsland(component: FC, opts: IslandOpts): Island {
	const mergedOpts: Required<IslandOpts> = {
		multiple: false,
		selector: `[data-hydrate="${opts.name}"]`,
		keepChildren: false,
		...opts,
	};

	const island: Island = {
		type: "island",
		component,
		opts: mergedOpts,
		render(opts) {
			renderIsland(this, opts);
		},
	};

	return island;
}

/**
 * Checks if the current script is running in a pre-render.
 *
 * @returns boolean
 */
export function isServer(): boolean {
	return !(typeof window != "undefined" && window.document);
}

export { hydrateIslands, Island, withProps };

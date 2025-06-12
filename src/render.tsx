import { FC, PropsWithChildren, useEffect, useRef } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { Island, IslandRenderOpts } from "./types";

/**
 * Internal component for rendering raw HTML in a React component.
 */
export function RawHTML({ html }: { html: string }) {
	const ref = useRef<HTMLScriptElement>(null);

	// important to not have ANY deps
	useEffect(() => {
		if (ref.current) {
			ref.current.outerHTML = html;
		}
	}, []);

	return <script ref={ref} />;
}

/**
 * Create a higher-order component with certain fixed.
 *
 * Useful for quickly creating multiple variants of the same component to use as islands.
 *
 * @param component FC<T>
 * @param setProps Partial<T>
 * @returns FC<T>
 */
export function withProps<T>(component: FC<T>, setProps: Partial<T>): FC<T> {
	return (props: T) => {
		return component({ ...props, ...setProps });
	};
}

/**
 * Renders a React Island.
 */
export function renderIsland(
	island: Island,
	renderOpts: IslandRenderOpts = {}
) {
	const { component, opts } = island;
	const { selector, multiple, keepChildren } = opts;

	const nodes = [...document.querySelectorAll(selector)];

	if (!nodes) {
		console.warn(
			`Could not hydrate React Island because DOM node (${selector}) could not be found.`
		);

		return false;
	}

	if (nodes.length > 1 && !multiple) {
		console.warn(
			`Multiple elements matched React Island selector (${selector}) but multiple was not enabled. Choosing first element as root.`
		);
	}

	for (let i = 0; i < nodes.length; i++) {
		if (i > 0 && !multiple) {
			break;
		}

		const element = nodes[i] as HTMLElement;
		let props: PropsWithChildren = {};

		try {
			const json = element.dataset.props || "{}";

			if (json) {
				const parsed = JSON.parse(json);

				if (typeof parsed !== "object" || Array.isArray(parsed)) {
					throw new Error(
						`Parsed JSON is not a valid dictionary object: '${json}'`
					);
				}

				if (parsed) {
					// Ignore null.
					props = parsed;
				}
			}
		} catch (e) {
			console.warn("Could not parse JSON props for React Island.");
			console.error(e);
		}

		if (keepChildren) {
			props.children = <RawHTML html={element.innerHTML} />;
		}

		const Component = withProps(component, props);

		if (renderOpts.hydrate) {
			hydrateRoot(nodes[i], <Component />);
		} else {
			const root = createRoot(nodes[i]);
			root.render(<Component />);
		}
	}
}

/**
 * Render all Islands in a record.
 *
 * Useful if you are importing * from an islands directory.
 *
 * @param islands Record<string, Island>
 */
export function hydrateIslands(islands: Record<string, Island>): void {
	const isDev =
		(process.env.NODE_ENV || "development").trim() === "development";

	for (const island of Object.values(islands)) {
		island.render({ hydrate: !isDev });
	}
}

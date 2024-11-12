import { FC, PropsWithChildren, useEffect, useRef } from "react";
import { Island, IslandOpts, IslandRenderOpts } from "./types";
import { createRoot, hydrateRoot } from "react-dom/client";

export default function createIsland(component: FC, opts: IslandOpts): Island {
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

export function withProps<T>(component: FC<T>, setProps: Partial<T>): FC<T> {
	return (props: T) => {
		return component({ ...props, ...setProps });
	};
}

export function isServer() {
	return !(typeof window != "undefined" && window.document);
}

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

function renderIsland(island: Island, renderOpts: IslandRenderOpts = {}) {
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

import { createRoot } from "react-dom/client";
import { RawHTML, withProps } from "./util";

export interface IslandRenderOptions {
	shouldHydrate: boolean;
	multiple: boolean;
	keepChildren: boolean;
}

export interface IslandOpts extends Partial<IslandRenderOptions> {}

export class Island {
	public readonly component: React.FC;
	public readonly renderOptions: IslandRenderOptions;

	public constructor(component: React.FC, opts: IslandOpts = {}) {
		this.component = component;

		this.renderOptions = {
			shouldHydrate: opts.shouldHydrate ?? true,
			multiple: opts.multiple ?? false,
			keepChildren: opts.keepChildren ?? false,
		};
	}

	private getProps(element: HTMLElement): React.PropsWithChildren {
		const { keepChildren } = this.renderOptions;
		let props: React.PropsWithChildren = {};

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

		return props;
	}

	private getRoots(name: string): HTMLElement[] {
		const selector = `[data-island="${name}"]`;
		const { multiple } = this.renderOptions;
		const nodes = [...document.querySelectorAll(selector)];

		if (!nodes) {
			console.warn(
				`Could not render React Island because DOM node (${selector}) could not be found.`
			);

			return [];
		}

		if (nodes.length > 1 && !multiple) {
			console.warn(
				`Multiple elements matched React Island selector (${selector}) but multiple was not enabled. Choosing first element as root.`
			);

			return [nodes[0] as HTMLElement];
		}

		return nodes as HTMLElement[];
	}

	public render(name: string): void {
		this.getRoots(name).forEach((element) => {
			const props = this.getProps(element);
			const Component = withProps(this.component, props);

			const root = createRoot(element);
			root.render(<Component />);

			return root;
		});
	}
}

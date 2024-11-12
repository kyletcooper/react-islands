export interface IslandOpts {
	name: string;
	selector?: string;
	multiple?: boolean;
	keepChildren?: boolean;
}

export interface IslandRenderOpts {
	hydrate?: boolean;
}

export type Island = {
	type: "island";
	component: React.FC;
	opts: Required<IslandOpts>;
	render: (opts: IslandRenderOpts) => void;
};

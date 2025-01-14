# React Islands

Created by Kyle Cooper at [WRD.agency](https://webresultsdirect.com)

React Islands is a way of introducing pockets of React into otherwise static pages, with an option for build-type rendering to help with layout shift. We developed React Islands as a way of introducing React-based interactivity sprinkled into places on WordPress sites (rendered via PHP).

## Example Setup

Create your island. Here we use an existing component and use our Islands directory to only setup the islands and not for worrying about functionality.

```
// ./islands/my-component.tsx
import MyComponent from "./components";
import { createIsland } from "@wrdagency/react-islands";

export const myComponentIsland = createIsland(MyComponent, {
	name: "my-component",
});
```

```
// ./islands/index.ts
export * from "./my-component";
```

On the client you can then render each of those islands. They'll automatically hook into the DOM where the selector is matched (similar to a portal) to create an island of reactivity.

```
// index.ts
import * as islands from "./islands";

const isDev = (process.env.NODE_ENV || "development").trim() === "development";

for (const island of Object.values(islands)) {
	island.render({ hydrate: !isDev });
}
```

Create a pre-render script. You can configure your build tool to use this as a seperate entrypoint.

```
// prerender.ts

import path from "node:path";
import { fileURLToPath } from "node:url";
import * as islands from "./islands";
import { prerenderIslands } from "@wrdagency/react-islands/server";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outDir = path.resolve(__dirname, "ssg");

prerenderIslands({ islands, outDir });
```

For our example we're using Vite. We'll build our prerendering script.

```
npx vite build --ssr ./src/prerender.tsx --outDir ./dist
```

And then we can run that compiled script. It'll create all of our statically rendered islands and put them into the `outDir` we specified.

```
node ./dist/prerender.js
```

For convenience we'd recommend setting up a script in your `package.json` for this like so:

```
"scripts": {
	"prerender": "npx vite build --ssr ./src/prerender.tsx --outDir ./dist && node ./dist/prerender.js",
},
```

## API

### `createIsland`

`(component: React.FC, options: IslandOpts) => Island`

Creates an island.

#### `IslandOpts`

| Options      | Type     | Default                   | Description                                                                                                                       |
| ------------ | -------- | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| name         | string   | Required                  | The name of the island. Used for the default selector and the filename of pre-rendering.                                          |
| selector     | string?  | [data-hydrate="{{NAME}}"] | The query selector to match for the islands root.                                                                                 |
| multiple     | boolean? | false                     | If enabled, the island will by instantiated for every element that matches the selector, not just the first.                      |
| keepChildren | boolean? | false                     | If enabled, the children props of the island component will be set to the raw HTML of the existing node's children. Experimental. |

### `withProps`

`<T>(component: React.FC<T>, props: Partial<T>) => React.FC<T>`

Creates a version of your React component with props already set. Useful for creating multiple islands with variants of the same component.

### `isServer`

`() => boolean`

Checks if the current environment is the server. Useful for disabled certain features not available during the prerender step.

### `prerenderIslands`

`(options: PrerenderIslandsOpts) => Promise<void>`

| Option  | Type                   | Description                                                                                                                              |
| ------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| islands | Record<string, Island> | The islands the pre-render. The key of the record is not used, it's just useful to accept a record if we're using `import * as Islands`. |
| ourDir  | string                 | Path of the directory to output the static HTML to. This directory will be emptied before pre-rendering begins.                          |

#!/usr/bin/env node
import build from "./commands/build";
import watch from "./commands/watch";
import { commandset } from "./util/command";

commandset({
	build,
	watch,
});

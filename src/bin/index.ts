#!/usr/bin/env node
import build from "./commands/build";
import { commandset } from "./util/command";

commandset({
	build,
});

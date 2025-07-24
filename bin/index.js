#!/usr/bin/env node
import fs, { readFileSync } from 'fs';
import yoctoSpinner from 'yocto-spinner';
import commonjsPlugin from '@rollup/plugin-commonjs';
import resolvePlugin from '@rollup/plugin-node-resolve';
import replacePlugin from '@rollup/plugin-replace';
import terserPlugin from '@rollup/plugin-terser';
import typescriptPlugin from '@rollup/plugin-typescript';
import path from 'path';
import { rollup } from 'rollup';
import { typescriptPaths } from 'rollup-plugin-typescript-paths';
import { exec } from 'child_process';
import { promisify } from 'util';
import commandLineArgs from 'command-line-args';
import commandLineUsage from 'command-line-usage';

function createGlobalObject(namespace) {
    return namespace
        .split(".")
        .filter(Boolean)
        .map((_, index, levels) => {
        const path = "window." + levels.slice(0, index + 1).join(".");
        return `${path} = ${path} || {}`;
    })
        .join(";\n");
}
function importPackage(packageName) {
    return `import * as ${packageNameToProperty(packageName)} from "${packageName}";\n`;
}
function importAndGlobalisePackage(packageName, globalName) {
    let str = "";
    str += importPackage(packageName);
    str += `${globalName} = ${packageNameToProperty(packageName)};\n`;
    return str;
}
function packageNameToProperty(packageName) {
    return packageName
        .replace(/^@/, "")
        .replace(/\//g, "_")
        .replace(/[-_](.)/g, (_, c) => c.toUpperCase())
        .replace(/^[a-z]/, (c) => c.toUpperCase());
}
function renderComponentToFile(filename, component) {
    return `var server = require('react-dom/server');
	var fs = require('node:fs/promises');
	var path = require('node:path');
const html = server.renderToString( module.exports.component( {} ) );
const file = path.resolve(__dirname, '${filename}');
fs.writeFile(file, html, { flag: "w+" });`;
}

const normalizeOptions = (options) => {
    return {
        name: options.name,
        input: options.input,
        output: options.output || "./dist/",
        minify: normalizeBoolean(options.minify, true),
        ssg: normalizeBoolean(options.ssg, true),
        jsx: options.jsx || "react-jsx",
        typescript: normalizeBoolean(options.ssg, false),
        common: normalizeCommonOption(options.common || [
            "react",
            "react-dom/client",
            "@wrdagency/react-islands",
        ]),
    };
};
const normalizeBoolean = (value, fallback) => {
    if (value === false) {
        return false;
    }
    else if (value === true) {
        return true;
    }
    else {
        return fallback;
    }
};
const normalizeCommonOption = (share = [""]) => {
    if (Array.isArray(share)) {
        return share.reduce((record, packageName) => ({
            ...record,
            [packageName]: "Islands._Common." + packageNameToProperty(packageName),
        }), {});
    }
    else {
        return share;
    }
};

const execPromise = promisify(exec);
const consoleExecute = async (command) => {
    try {
        const { stdout, stderr } = await execPromise(command);
        if (stdout) {
            console.log(stdout);
        }
        if (stderr) {
            console.error(stderr);
        }
        return stdout;
    }
    catch (e) {
        console.error(e);
        throw e;
    }
};

function runScriptAfterBuildPlugin(opts) {
    const { deleteAfterRunning = false } = opts;
    return {
        name: "rollup-plugin-run-script-after-builder",
        writeBundle(outputOptions, bundle) {
            const outputDir = outputOptions.dir
                ? outputOptions.dir
                : path.dirname(outputOptions.file || "");
            for (const [fileName, chunkInfo] of Object.entries(bundle)) {
                const filePath = path.resolve(outputDir, fileName);
                if (chunkInfo.type !== "chunk" || !chunkInfo.isEntry) {
                    return;
                }
                if (!filePath && !filePath.endsWith("js")) {
                    return;
                }
                if (!fs.existsSync(filePath)) {
                    return;
                }
                consoleExecute(`node ${filePath}`).then(() => {
                    if (deleteAfterRunning) {
                        fs.unlinkSync(filePath);
                    }
                });
            }
        },
    };
}

function virtualizeDependencyPlugin(opts) {
    const { dependencies, namespace = "" } = opts;
    const VIRTUAL_MODULE_ID = "\0virtual-entry";
    return {
        name: "rollup-plugin-virtualize-dependency",
        resolveId(source) {
            if (source === "virtual-entry")
                return VIRTUAL_MODULE_ID;
            return null;
        },
        load(id) {
            if (id !== VIRTUAL_MODULE_ID) {
                return null;
            }
            let str = createGlobalObject(namespace) + ";\n";
            for (const [dependency, name] of Object.entries(dependencies)) {
                str += importAndGlobalisePackage(dependency, name);
            }
            return str;
        },
    };
}

function createRollupConfigs(options) {
    const normalized = normalizeOptions(options);
    const { name, input, output, minify, ssg, jsx, typescript, common } = normalized;
    const configs = [];
    const createRollupConfig = (opts) => {
        const { active = true, name: mainName = `Islands.${name}`, subName, format, globals = {}, prefix, suffix, plugins = [], } = opts;
        if (!active) {
            return null;
        }
        return {
            input,
            external: Object.keys(globals),
            jsx,
            output: {
                name: mainName,
                globals,
                format,
                entryFileNames: `[name]/${subName}`,
                dir: output,
                banner: prefix && ((chunk) => prefix(chunk.name)),
                footer: suffix && ((chunk) => suffix(chunk.name)),
            },
            plugins: [
                resolvePlugin({
                    extensions: [
                        ".cjs",
                        ".mjs",
                        ".js",
                        ".json",
                        ".node",
                        ".jsx",
                        ".ts",
                        ".tsx",
                    ],
                }),
                commonjsPlugin(),
                replacePlugin({
                    preventAssignment: true,
                    "process.env.NODE_ENV": JSON.stringify("production"),
                }),
                minify && terserPlugin(),
                typescript &&
                    typescriptPlugin({
                        jsx,
                    }),
                typescript && typescriptPaths(),
                ...plugins,
            ],
        };
    };
    configs.push(createRollupConfig({
        active: true,
        subName: "client.js",
        format: "iife",
        globals: common,
        suffix: (name) => `\nwindow.Islands['${name}']?.render('${name}')`,
    }));
    configs.push(createRollupConfig({
        active: ssg,
        subName: "server.cjs",
        format: "cjs",
        suffix: () => renderComponentToFile("ssg.html"),
        plugins: [
            runScriptAfterBuildPlugin({
                deleteAfterRunning: true,
            }),
        ],
    }));
    return configs.filter(isRollupOptions);
}
function createCommonConfig(options) {
    const normalized = normalizeOptions(options);
    const { output, minify, jsx, common } = normalized;
    return {
        input: "virtual-entry",
        jsx,
        output: {
            name: "Islands._Common",
            file: path.resolve(output, "common.js"),
            format: "iife",
        },
        plugins: [
            replacePlugin({
                preventAssignment: true,
                "process.env.NODE_ENV": JSON.stringify("production"),
            }),
            virtualizeDependencyPlugin({
                dependencies: common,
                namespace: "Islands._Common",
            }),
            resolvePlugin(),
            commonjsPlugin(),
            minify && terserPlugin(),
        ],
    };
}
function isRollupOptions(config) {
    return config !== null;
}
async function runRollup(inputOptions, outputOptions) {
    let bundle;
    let buildFailed = false;
    try {
        bundle = await rollup(inputOptions);
        await bundle.write(outputOptions);
    }
    catch (error) {
        buildFailed = true;
        console.error(error);
    }
    if (bundle) {
        await bundle.close();
    }
    return !buildFailed;
}

class Command {
    args;
    callback;
    description;
    constructor(options) {
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
    run(argv) {
        const { help, ...args } = commandLineArgs(this.args, { argv });
        if (help) {
            console.log(commandLineUsage([
                {
                    header: "Options",
                    optionList: this.args,
                },
            ]));
            return;
        }
        return this.callback(args);
    }
}
async function commandset(commands) {
    const { command, help = false, _unknown: argv = [], } = commandLineArgs([
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
    ], {
        stopAtFirstUnknown: true,
    });
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
        }
        else {
            console.error(`Command '${command}' not recognized by React Islands.`);
        }
        return;
    }
    return commands[command].run([...argv, help && "--help"].filter(Boolean));
}

var build = new Command({
    description: "Build and statically render the islands.",
    args: [
        {
            name: "config",
            type: String,
            alias: "c",
            // @ts-ignore
            description: "The config file to use.",
            defaultValue: "islands.config.json",
        },
    ],
    callback: async (args) => {
        const { config } = args;
        const configJson = JSON.parse(readFileSync(config, "utf8"));
        const { islands, ...restConfig } = configJson;
        if (restConfig.common !== false) {
            const spinner = yoctoSpinner({
                text: `Creating common dependencies file...`,
            }).start();
            const commonRollupConfig = createCommonConfig(restConfig);
            const { output, ...input } = commonRollupConfig;
            const success = await runRollup(input, output);
            if (success) {
                spinner.success(`Succeeded: common dependencies file`);
            }
            else {
                spinner.warning(`Failed: common dependencies file`);
            }
        }
        for (const [name, input] of Object.entries(islands)) {
            const spinner = yoctoSpinner({
                text: `Creating island ${name}...`,
            }).start();
            const rollupConfigs = createRollupConfigs({
                input,
                name,
                ...restConfig,
            });
            let hadFailure = false;
            for (const rollupConfig of rollupConfigs) {
                const { output, ...input } = rollupConfig;
                const success = await runRollup(input, output);
                if (!success) {
                    hadFailure = true;
                }
            }
            rollupConfigs.map(async (options) => { });
            if (hadFailure) {
                spinner.warning(`Failed island: ${name}`);
            }
            else {
                spinner.success(`Succeeded island: ${name}`);
            }
        }
    },
});

commandset({
    build,
});

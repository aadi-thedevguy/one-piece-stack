#!/usr/bin/env node

import chalk from "chalk";
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createWriteStream } from "node:fs";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { x as extractTarball } from "tar";

const DEFAULT_PROJECT_NAME = "one-piece-app";
const TEMPLATE_ARCHIVE_URL =
    "https://codeload.github.com/aadi-thedevguy/one-piece-stack/tar.gz/refs/heads/main";
const PACKAGE_MANAGERS = new Set(["npm", "yarn", "pnpm", "bun"]);

function parseArguments(args) {
    let projectName;
    let packageManager;
    let skipInstall = false;

    for (let index = 0; index < args.length; index += 1) {
        const arg = args[index];
        if (arg === "--help" || arg === "-h") return { help: true };
        if (arg === "--skip-install") {
            skipInstall = true;
        } else if (arg === "--package-manager" || arg === "--pm") {
            packageManager = args[index + 1];
            if (!packageManager) throw new Error(`${arg} requires npm, yarn, pnpm, or bun.`);
            index += 1;
        } else if (arg.startsWith("--package-manager=") || arg.startsWith("--pm=")) {
            packageManager = arg.slice(arg.indexOf("=") + 1);
        } else if (arg.startsWith("-")) {
            throw new Error(`Unknown option: ${arg}`);
        } else if (projectName === undefined) {
            projectName = arg;
        } else {
            throw new Error(`Unexpected argument: ${arg}`);
        }
    }

    if (packageManager && !PACKAGE_MANAGERS.has(packageManager)) {
        throw new Error("Package manager must be one of: npm, yarn, pnpm, bun.");
    }

    return { projectName: projectName ?? DEFAULT_PROJECT_NAME, packageManager, skipInstall };
}

function detectPackageManager() {
    const userAgent = process.env.npm_config_user_agent ?? "";
    const detected = userAgent.match(/(?:^|\s)(npm|yarn|pnpm|bun)\//)?.[1];
    return detected && PACKAGE_MANAGERS.has(detected) ? detected : "npm";
}

function validateProjectName(name) {
    if (name === ".") return;
    if (!/^[a-z0-9][a-z0-9._-]*$/.test(name) || name === "..") {
        throw new Error(
            "Project name must start with a lowercase letter or number and contain only lowercase letters, numbers, dots, hyphens, or underscores."
        );
    }
}

function run(command, args, options = {}) {
    return new Promise((resolve, reject) => {
        // npm, yarn, pnpm, and bun are .cmd shims on Windows. The command is
        // selected from a fixed allowlist and these arguments are constant.
        const windows = process.platform === "win32";
        const executable = windows ? (process.env.ComSpec ?? "cmd.exe") : command;
        const commandArgs = windows ? ["/d", "/s", "/c", `${command} ${args.join(" ")}`] : args;
        const child = spawn(executable, commandArgs, { stdio: "inherit", ...options });
        child.once("error", reject);
        child.once("close", (code) => {
            if (code === 0) resolve();
            else reject(new Error(`${command} exited with code ${code ?? "unknown"}`));
        });
    });
}

async function downloadTemplate(targetDir) {
    const response = await fetch(TEMPLATE_ARCHIVE_URL, {
        headers: { "user-agent": "create-one-piece-app" }
    });
    if (!response.ok || !response.body) {
        throw new Error(`Could not download the starter template (HTTP ${response.status}).`);
    }

    const temporaryDir = await fs.mkdtemp(path.join(os.tmpdir(), "create-one-piece-app-"));
    const archivePath = path.join(temporaryDir, "template.tar.gz");
    try {
        await pipeline(Readable.fromWeb(response.body), createWriteStream(archivePath));
        await extractTarball({
            file: archivePath,
            cwd: targetDir,
            strip: 1,
            gzip: true
        });

        // Let the selected package manager create its own lockfile. Keeping
        // pnpm metadata in the downloaded template can make other managers
        // behave as though pnpm is required.
        const packageJsonPath = path.join(targetDir, "package.json");
        const packageJson = JSON.parse(await fs.readFile(packageJsonPath, "utf8"));
        delete packageJson.packageManager;
        if (packageJson.scripts?.["dev:inngest"]?.startsWith("pnpm dlx ")) {
            packageJson.scripts["dev:inngest"] = packageJson.scripts["dev:inngest"].replace(
                "pnpm dlx ",
                "npx --yes "
            );
        }
        await fs.writeFile(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
        await fs.rm(path.join(targetDir, "pnpm-lock.yaml"), { force: true });

        const readmePath = path.join(targetDir, "README.md");
        const readme = await fs.readFile(readmePath, "utf8");
        const packageManagerNeutralReadme = readme
            .replaceAll("npx create-one-piece-app", "npx one-piece-app")
            .replaceAll("pnpm create one-piece-app", "npx one-piece-app")
            .replaceAll("pnpm run ", "npm run ")
            .replaceAll("pnpm dev", "npm run dev")
            .replaceAll("pnpm check", "npm run check")
            .replaceAll("pnpm db:", "npm run db:");
        await fs.writeFile(readmePath, packageManagerNeutralReadme);
    } finally {
        await fs.rm(temporaryDir, { recursive: true, force: true });
    }
}

async function prepareTarget(projectName) {
    const targetDir = projectName === "."
        ? process.cwd()
        : path.resolve(process.cwd(), projectName);

    if (projectName === ".") {
        const entries = await fs.readdir(targetDir);
        if (entries.length > 0) {
            throw new Error("The current directory is not empty. Choose an empty directory or provide a project name.");
        }
    } else {
        try {
            await fs.access(targetDir);
            throw new Error(`Directory already exists: ${projectName}`);
        } catch (error) {
            if (error.code !== "ENOENT") throw error;
        }
        await fs.mkdir(targetDir, { recursive: true });
    }

    try {
        await downloadTemplate(targetDir);
        return targetDir;
    } catch (error) {
        if (projectName !== ".") {
            await fs.rm(targetDir, { recursive: true, force: true });
        }
        throw error;
    }
}

function printHelp() {
    console.log(`Create a new One Piece Stack app\n\nUsage: one-piece-app [project-name] [options]\n\nOptions:\n  --package-manager, --pm <name>  Use npm, yarn, pnpm, or bun (default: detected)\n  --skip-install                  Download the template without installing dependencies\n  -h, --help                      Show this help`);
}

async function main() {
    let targetDir;
    try {
        const options = parseArguments(process.argv.slice(2));
        if (options.help) {
            printHelp();
            return;
        }

        const { projectName, packageManager, skipInstall } = options;
        validateProjectName(projectName);
        console.log(chalk.magenta("Initializing One Piece Stack..."));
        targetDir = await prepareTarget(projectName);
        console.log(chalk.green(`Starter template downloaded to ${targetDir}.`));

        if (!skipInstall) {
            const manager = packageManager ?? detectPackageManager();
            console.log(chalk.cyan(`Installing dependencies with ${manager}...`));
            const installArgs = manager === "npm" ? ["install", "--legacy-peer-deps"] : ["install"];
            await run(manager, installArgs, { cwd: targetDir });
        }

        console.log(chalk.green("Your One Piece App is ready."));
        if (projectName !== ".") console.log(chalk.cyan(`\n  cd ${projectName}`));
        if (skipInstall) {
            const manager = packageManager ?? detectPackageManager();
            const installCommand = manager === "npm" ? "npm install --legacy-peer-deps" : `${manager} install`;
            console.log(chalk.cyan(`  ${installCommand}`));
        }
        console.log(chalk.cyan(`  ${packageManager ?? detectPackageManager()} run dev`));
        console.log(chalk.magenta("See https://github.com/aadi-thedevguy/one-piece-stack for setup instructions."));
    } catch (error) {
        console.error(chalk.red(`Error: ${error.message}`));
        process.exitCode = 1;
    }
}

await main();

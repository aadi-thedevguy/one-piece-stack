#!/usr/bin/env node

import chalk from "chalk";
import { spawn } from "node:child_process";
import path from "node:path";
import fs from "node:fs/promises";
import readline from "node:readline/promises";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Utility function to execute shell commands
function execCommand(command, args, options = {}) {
    return new Promise((resolve, reject) => {
        const proc = spawn(command, args, { shell: true, stdio: "inherit", ...options });
        proc.on("close", (code) => {
            if (code === 0) resolve();
            else reject(new Error(`${command} ${args.join(" ")} exited with code ${code}`));
        });
        proc.on("error", reject);
    });
}

// Check if a command is available
async function checkCommand(command) {
    try {
        await execCommand(command, ["--version"]);
        return true;
    } catch {
        return false;
    }
}

// Prompt user for input with colored text
// Prompt user for input with colored text using readline/promises
async function promptUser(question) {
    const answer = await rl.question(chalk.yellow(question));
    return answer.trim();
}

// Validate project name
function validateProjectName(name) {
    const validNameRegex = /^[a-z0-9-_]+$/;
    return {
        isValid: validNameRegex.test(name),
        errors: [
            !name && "Project name cannot be empty",
            /\s/.test(name) && "Project name cannot contain spaces",
            /[A-Z]/.test(name) && "Project name must be lowercase",
            !validNameRegex.test(name) && "Project name can only contain lowercase letters, numbers,hyphens and underscores"
        ].filter(Boolean)
    };
}

// Main CLI logic
async function runCLI(projectNameArg) {
    try {
        console.log(chalk.magenta(`Initializing One Piece Stack...`));
        const repoUrl = "https://github.com/aadi-thedevguy/one-piece-stack.git";
        let targetDir;
        let projectName = projectNameArg;

        // Handle case where no project name is provided
        if (!projectName) {
            projectName = await promptUser(
                "No project name provided. What would you like to name your app? " +
                chalk.cyan("(default: one-piece-app)") + "\n> "
            );
            if (!projectName) projectName = "one-piece-app";
            
            const validation = validateProjectName(projectName);
            while (!validation.isValid) {
                console.log(chalk.red("Invalid project name:"));
                validation.errors.forEach(error => console.log(chalk.red(`- ${error}`)));
                projectName = await promptUser(
                    "Please enter a valid project name " +
                    chalk.cyan("(lowercase letters, numbers, and hyphens only): ") + "\n> "
                );
                if (!projectName) projectName = "one-piece-app";
                validation = validateProjectName(projectName);
            }
        } else {
            const validation = validateProjectName(projectName);
            if (!validation.isValid) {
                console.log(chalk.red("Invalid project name provided:"));
                validation.errors.forEach(error => console.log(chalk.red(`- ${error}`)));
                console.log(chalk.yellow("Please provide a name with lowercase letters, numbers, and hyphens only"));
                process.exit(1);
            }
        }

        // Step 1: Check if Git and Node.js are installed
        if (!(await checkCommand("git"))) {
            console.error(chalk.red("Git is not installed. Please install Git and try again."));
            process.exit(1);
        }
        if (!(await checkCommand("node"))) {
            console.error(chalk.red("Node.js is not installed. Please install Node.js and try again."));
            process.exit(1);
        }
        console.log(chalk.green("Git and Node.js are installed."));

        // Step 2: Handle project directory and cloning
        if (projectName === ".") {
            console.log(chalk.cyan("Using current directory..."));
            targetDir = process.cwd();
            console.log(chalk.cyan(`Cloning repository from ${repoUrl}...`));
            await execCommand("git", ["clone", repoUrl]);
            targetDir = path.join(targetDir, "one-piece-stack");
            process.chdir(targetDir);
            console.log(chalk.green(`Repository cloned into ${targetDir}.`));
        } else {
            const targetPath = path.join(process.cwd(), projectName);
            try {
                await fs.access(targetPath);
                console.error(chalk.red(`Error: Directory '${projectName}' already exists in the current directory.`));
                console.log(chalk.yellow(`Please either:
                    1. Remove the existing directory with the name '${projectName}'
                    2. Choose a different project name
                    3. Run the command in a different directory`));
                process.exit(1);
            } catch {
                // Directory doesn't exist, proceed with creation
                console.log(chalk.cyan(`Creating directory ${projectName}...`));
                await fs.mkdir(projectName, { recursive: true });
                targetDir = targetPath;
                console.log(chalk.cyan(`Cloning repository from ${repoUrl} into ${projectName}...`));
                await execCommand("git", ["clone", repoUrl, projectName]);
                process.chdir(targetDir);
                console.log(chalk.green(`Repository cloned successfully into ${projectName}.`));
            }
        }
        
        // Disconnect from remote repository
        await execCommand("git", ["remote", "remove", "origin"]);

        // Step 3: Check if package manager is installed
        if (!(await checkCommand("npm"))) {
            console.error(chalk.red("npm is not installed. Please install it and try again."));
            process.exit(1);
        }

        console.log(chalk.cyan("We strongly recommend using pnpm for this project."));
        console.log(chalk.cyan("Checking if pnpm is installed..."));
        if (!(await checkCommand("pnpm"))) {
            console.log(chalk.yellow("pnpm is not installed. Installing it globally..."));
            await execCommand("npm", ["install", "-g", "pnpm"]);
            console.log(chalk.green("pnpm has been installed successfully."));
        } else {
            console.log(chalk.green("pnpm is already installed."));
        }
        
        await execCommand("pnpm", ["install"]);

        console.log(chalk.green("Congrats! Your One Piece App has been installed successfully."));
        console.log(chalk.magenta("Checkout https://github.com/aadi-thedevguy/one-piece-stack?tab=readme-ov-file#development for further instructions."));

    } catch (error) {
        console.error(chalk.red("An error occurred:"), error.message);
        process.exit(1);
    } finally {
        rl.close();
    }
}

// Parse command-line arguments and start the CLI
const projectName = process.argv[2];
runCLI(projectName);
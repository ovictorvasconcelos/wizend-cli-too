import fs from "fs";
import path from "path";
import inquirer from "inquirer";
import { promisify } from "util";
import logger from "../logger.js";
import { exec } from "child_process";
import { createNextProject } from "../templates/nextProject.js";
import { createNodeProject } from "../templates/nodeProject.js";
import { createReactProject } from "../templates/reactProject.js";

const execAsync = promisify(exec);
const logMessage = logger('config:mgr');
const makeDirAsync = promisify(fs.mkdir);
const writeAsyncFile = promisify(fs.writeFile);

async function runNpmInstall(directory) {
    try {
        logMessage.log(' ');
        logMessage.log('Running npm install...');
        await execAsync('npm install', { cwd: directory });
        logMessage.log(' ');
        logMessage.highlight('Dependencies successfully installed!');
    } catch (error) {
        logMessage.error(`Error executing the 'npm install' command: `, error);
    }
}

export async function createCommand() {
    try {
        const projectInfo = await inquirer.prompt([
            {
                type: 'input',
                name: 'projectName',
                message: 'Project Name',
                validate: (input) => !!input.trim() || "Project name cannot be empty",
                default: 'project-name',
            },
            {
                type: 'input',
                name: 'projectDescription',
                message: 'Project Description',
                default: "Create with Wizend CLI Tool"
            },
            {
                type: 'list',
                name: 'projectType',
                message: 'Select the type of project',
                choices: ["Node", "React", "Next"],
                default: "node"
            },
            {
                type: 'confirm',
                name: 'useTypeScript',
                message: 'Use Typescript?',
                default: false
            },
            {
                type: 'input',
                name: 'projectAuthor',
                message: 'Author',
                default: "Unknow Auhtor"
            },
        ]);
        
        const projectDirectory = path.join(process.cwd(), projectInfo.projectName);

        await makeDirAsync(projectDirectory);

        const readmeContent = `# ${projectInfo.projectName}\n\n${projectInfo.projectDescription || ''}\n\nDeveloped by ${projectInfo.projectAuthor}\n\nProject Type: ${projectInfo.projectType}\nUse TypeScript: ${projectInfo.useTypeScript}`;

        await writeAsyncFile(
            path.join(projectDirectory, 'README.md'), readmeContent
        );

        logMessage.highlight(`Project '${projectInfo.projectName}' created successfully in '${projectDirectory}'`);

        switch (projectInfo.projectType) {
            case 'Node':
                await createNodeProject(projectDirectory, projectInfo.useTypeScript, projectInfo.projectAuthor, projectInfo.projectDescription);
                break;
            case 'React':
                await createReactProject(projectDirectory, projectInfo.useTypeScript, projectInfo.projectAuthor, projectInfo.projectDescription);
                break;
            case 'Next':
                await createNextProject(projectDirectory, projectInfo.useTypeScript, projectInfo.projectAuthor, projectInfo.projectDescription);
                break;
            default:
                throw new Error(`Unknown project type: ${projectInfo.projectType}`);
        }

        await runNpmInstall(projectDirectory);

    } catch (error) {
        logMessage.error('Failed to create project: ', error);
    }
}
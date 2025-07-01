import * as vscode from 'vscode';
import simpleGit from 'simple-git';
import * as path from 'path';
import * as fs from 'fs-extra'; // for file system ops
import { AlpineTempLoc } from './your-utils-file'; // make sure you import this if in another file




export async function generateAlpineFlow() {
    const name = await promptForResourceName();
    if (!name) return;

    const author = await askForAuthor();
    if (!author) return;

    await CreateAlpineTemplate({ name, author });
}




export async function CreateAlpineTemplate(params) {
    const { name, author } = params;
    const folderUri = await AlpineTempLoc();

    if (!folderUri) return;

    const projectPath = path.join(folderUri.fsPath, name);

    try {
        vscode.window.showInformationMessage(`Cloning Alpine boilerplate to ${projectPath}...`);

        const git = simpleGit();

        // Clone into new folder named after the project
        await git.clone('https://github.com/NoCapScripts-FiveM/fivem-alpine-boilerplate.git', projectPath);

        vscode.window.showInformationMessage(`Template cloned successfully!`);

        // OPTIONAL: Modify files inside project folder (like package.json, README.md, etc.)
        const readmePath = path.join(projectPath, 'README.md');
        if (fs.existsSync(readmePath)) {
            let content = await fs.readFile(readmePath, 'utf8');
            content = content.replace(/{{NAME}}/g, name).replace(/{{AUTHOR}}/g, author);
            await fs.writeFile(readmePath, content);
        }

        vscode.window.showInformationMessage(`Project "${name}" created successfully.`);

        // ✅ Prompt to open the newly created folder
        const open = await vscode.window.showInformationMessage(
            'Open the new project folder?', 'Open Folder'
        );

        if (open === 'Open Folder') {
            vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(projectPath), true);
        }

    } catch (error) {
        vscode.window.showErrorMessage(`Failed to create Alpine project: ${error.message}`);
    }
}

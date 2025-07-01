const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const simpleGit = require('simple-git')

const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);


class FiveMBuilder {
    constructor(context) {
        this.context = context;
        this.disposables = [];
        this.bindedCreateResourceFlow = this.createResourceFlow.bind(this);
    }

    async activate() {
        console.log('FiveM Builder is now active!');

        try {
            this.registerCommands();
            this.setupTextDocumentWatcher();
            this.registerCompletionProvider();
            return true;
        } catch (error) {
            this.showErrorMessage('Extension activation failed', error);
            return false;
        }
    }

    async deactivate() {
        this.disposables.forEach(d => d.dispose());
        this.disposables = [];
    }


    async promptForAlpineFolder() {
        try {
            const folderUri = await vscode.window.showOpenDialog({
                canSelectFolders: true,
                openLabel: 'Select folder to create the Alpine template in'
            });

            if (!folderUri?.length) {
                this.showWarningMessage('No folder selected');
                return null;
            }

            return folderUri[0];
        } catch (error) {
            this.showErrorMessage('Folder selection failed', error);
            return null;
        }
    }


    async generateAlpineFlow() {
        const name = await this.promptForResourceName();
        if (!name) return;

        const author = await this.askForAuthor();
        if (!author) return;

        await this.CreateAlpineTemplate({ name, author });
    }

    async CreateAlpineTemplate({ name, author }) {
        const folderUri = await this.promptForAlpineFolder();
        if (!folderUri) return;

        const projectPath = path.join(folderUri.fsPath, name);

        try {
            vscode.window.showInformationMessage(`Cloning Alpine boilerplate to ${projectPath}...`);

            const git = simpleGit();

            // Clone into new folder named after the project
            await git.clone('https://github.com/NoCapScripts-FiveM/fivem-alpine-boilerplate.git', projectPath);

            vscode.window.showInformationMessage(`Template cloned successfully!`);

            // Modify README.md if exists
            const readmePath = path.join(projectPath, 'README.md');
            if (fs.existsSync(readmePath)) {
                let content = await fs.promises.readFile(readmePath, 'utf8');
                content = content.replace(/{{NAME}}/g, name).replace(/{{AUTHOR}}/g, author);
                await fs.promises.writeFile(readmePath, content);
            }

            vscode.window.showInformationMessage(`Project "${name}" created successfully.`);

            const open = await vscode.window.showInformationMessage(
                'Open the new project folder?', 'Open Folder'
            );

            if (open === 'Open Folder') {
                vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(projectPath), true);
            }

        } catch (error) {
            this.showErrorMessage(`Failed to create Alpine project`, error);
        }
    }
    

    async registerCommands() {
        const commands = [
            {
                command: 'fivembuilder.createResource',
                callback: () => this.safeExecute(this.createResourceFlow)
            },
            {
                command: 'fivembuilder.generateResourceViaSnippet',
                callback: () => this.safeExecute(this.createResourceFlow)
            },
            {
                command: 'fivembuilder.generateAlpine',
                callback: () => this.safeExecute(this.generateAlpineFlow)
            }
        ];

        for (const { command, callback } of commands) {
            const disposable = vscode.commands.registerCommand(command, callback);
            this.disposables.push(disposable);
        }
    }

    async setupTextDocumentWatcher() {
        const watcher = vscode.workspace.onDidChangeTextDocument(event => {
            this.safeExecute(() => this.handleTextDocumentChange(event));
        });
        this.disposables.push(watcher);
    }

    async registerCompletionProvider() {
        const languages = ['lua', 'javascript', 'typescript', 'json', 'plaintext'];

        const provider = vscode.languages.registerCompletionItemProvider(
            languages.map(lang => ({ scheme: 'file', language: lang })),
            {
                provideCompletionItems: (doc, pos) => this.generateCompletionItems()
            },
            'g'  
        );

        this.disposables.push(provider);
    }

   async safeExecute(fn) {
        try {
            await fn.call(this);
        } catch (error) {
            this.showErrorMessage('Operation failed', error);
        }
    }

    async promptForResourceName() {
        try {
            return await vscode.window.showInputBox({
                prompt: 'Enter the name of the FiveM resource',
                placeHolder: 'my-resource',
                validateInput: this.validateResourceName
            });
        } catch (error) {
            this.showErrorMessage('Failed to get resource name', error);
            return null;
        }
    }

    async createResourceFlow() {
        const resourceName = await this.promptForResourceName();
        if (!resourceName) return;

        const authorName = await this.askForAuthor();
        if (!authorName) return;

        const folderUri = await this.promptForFolderSelection();
        if (!folderUri) return;

        await this.createResourceStructure(folderUri.fsPath, resourceName, authorName);
    }



  

    async validateResourceName(value) {
        if (!value || !value.trim()) return 'Resource name cannot be empty';
        if (/[<>:"/\\|?*\x00-\x1F]/.test(value)) return 'Invalid characters in name';
        return null;
    }

     async  promptForFolderSelection() {
        try {
            const folderUri = await vscode.window.showOpenDialog({
                canSelectFolders: true,
                openLabel: 'Select folder to create the resource in'
            });

            if (!folderUri?.length) {
                this.showWarningMessage('No folder selected');
                return null;
            }

            return folderUri[0];
        } catch (error) {
            this.showErrorMessage('Folder selection failed', error);
            return null;
        }
    }

    async askForAuthor() {
        try {
            const author = await vscode.window.showInputBox({
                prompt: 'Enter the author name',
                placeHolder: 'Your Name',
                validateInput: this.validateAuthorName
            });

            if (!author) {
                this.showWarningMessage('Author name cannot be empty');
                return null;
            }

            return author;
        } catch (error) {
            this.showErrorMessage('Failed to get author name', error);
            return null;
        }
    }

    async validateAuthorName(value) {
        return (!value || !value.trim()) ? 'Author name cannot be empty' : null;
    }

    async createResourceStructure(basePath, resourceName, authorName) {
        const resourcePath = path.join(basePath, resourceName);

        try {
            await mkdir(resourcePath, { recursive: true });
            await Promise.all([
                mkdir(path.join(resourcePath, 'client'), { recursive: true }),
                mkdir(path.join(resourcePath, 'server'), { recursive: true })
            ]);

            await Promise.all([
                writeFile(path.join(resourcePath, 'fxmanifest.lua'), this.fxManifestTemplate(resourceName, authorName)),
                writeFile(path.join(resourcePath, 'client', 'client.lua'), '-- Client script\n'),
                writeFile(path.join(resourcePath, 'server', 'server.lua'), '-- Server script\n')
            ]);

            this.showInformationMessage(`Resource '${resourceName}' created successfully.`);
        } catch (error) {
            throw new Error(`Failed to create resource structure: ${error.message}`);
        }
    }

    async handleTextDocumentChange(event) {
        const editor = vscode.window.activeTextEditor;
        if (!editor || event.document !== editor.document) return;

        const triggers = [
            { trigger: 'genfm', action: () => this.createResourceFlow() },
            { trigger: 'genf', action: () => this.createResourceFlow() },
            { trigger: 'genalp', action: () => generateAlpineFlow() },
        ];

        for (const change of event.contentChanges) {
            for (const { trigger, action } of triggers) {
                if (change.text.includes(trigger)) {
                    const index = change.text.indexOf(trigger);
                    const startPos = change.range.start.translate(0, index);
                    const endPos = startPos.translate(0, trigger.length);
                    const range = new vscode.Range(startPos, endPos);

                    await editor.edit(edit => edit.delete(range));
                    await this.safeExecute(action);
                    return;
                }
            }
        }
    }


    async generateCompletionItems() {
        const fxItem = new vscode.CompletionItem('genfm', vscode.CompletionItemKind.Snippet);
        fxItem.detail = 'Insert basic fxmanifest.lua';
        fxItem.insertText = new vscode.SnippetString(this.fxManifestSnippet());
        fxItem.documentation = new vscode.MarkdownString('Generates a basic `fxmanifest.lua` template.');

        const genItem = new vscode.CompletionItem('genr', vscode.CompletionItemKind.Keyword);
        genItem.detail = 'Generate full FiveM resource';
        genItem.insertText = ''; 
        genItem.command = {
            title: 'Run Generator',
            command: 'fivembuilder.generateResourceViaSnippet'
        };
        genItem.documentation = new vscode.MarkdownString('Runs the resource generator (like Create Resource command).');

        const genAlpine = new vscode.CompletionItem('genalp', vscode.CompletionItemKind.Keyword);
        genAlpine.detail = 'Generate Alpine template';
        genAlpine.insertText = ''; 
        genAlpine.command = {
            title: 'Generate now',
            command: 'fivembuilder.generateAlpine'
        }
        genAlpine.documentation = new vscode.MarkdownString('Generates Alpine template for html')


        return [fxItem, genItem, genAlpine];
    }

    fxManifestTemplate(name, author) {
        return `fx_version ('cerulean')
game ('gta5')

lua54 ('yes')

author ('\${1:author}')
description ('\${2:description}')
version ('\${3:1.0.0}')

client_scripts ({
    'client/*.lua'
})

server_scripts ({
    'server/*.lua'
})

-- Script generated by VSCode FiveM Builder
`;
}

    fxManifestSnippet() {
        return `fx_version ('cerulean')
game ('gta5')

lua54 ('yes')

author ('\${1:author}')
description ('\${2:description}')
version ('\${3:1.0.0}')

client_scripts ({
    'client/*.lua'
})

server_scripts ({
    'server/*.lua'
})

-- Script generated by VSCode FiveM Builder
`;

}

    showErrorMessage(message, error) {
        const fullMessage = error?.message ? `${message}: ${error.message}` : message;
        vscode.window.showErrorMessage(fullMessage);
    }

    showWarningMessage(message) {
        vscode.window.showWarningMessage(message);
    }

    showInformationMessage(message) {
        vscode.window.showInformationMessage(message);
    }
}

function activate(context) {
    const extension = new FiveMBuilder(context);
    const success = extension.activate();
    if (!success) console.error('Failed to activate FiveM Builder extension');
    return extension;
}

function deactivate(extension) {
    if (extension?.deactivate) {
        extension.deactivate();
    }
}

module.exports = { activate, deactivate };

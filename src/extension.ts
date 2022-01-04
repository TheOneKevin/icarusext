import * as vsc from 'vscode';
import * as fusesoc from './fusesoc';
const workspace = vsc.workspace;

export function activate(context: vsc.ExtensionContext) {
	// Parse project file
	if (workspace.workspaceFolders != undefined) {
		if (workspace.workspaceFolders.length != 1) {
			vsc.window.showWarningMessage('Multi-root workspace detected and is unsupported.')
		}
		let projectFile = vsc.Uri.joinPath(workspace.workspaceFolders[0].uri, 'project.yml');
		let project = fusesoc.Project.parse(projectFile);
		if (project != undefined) {
			vsc.commands.executeCommand('setContext', 'icarusext.hasProjectOpen', true);
		}
	}
}

export function deactivate() { }

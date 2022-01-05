'use strict';

import * as vsc from 'vscode';
import * as fusesoc from './fusesoc';
import * as fs from 'fs';
import { FileTreeProvider } from './filetree';
const workspace = vsc.workspace;
const window = vsc.window;

let treeProvider = new FileTreeProvider();

async function loadProject(projectFile: vsc.Uri) {
	let project = await window.withProgress({
		location: vsc.ProgressLocation.Notification,
		title: "I am long running!",
		cancellable: false
	}, (progress, token) => {
		return fusesoc.Project.parse(projectFile, progress, token);
	});
	if (project != undefined) {
		vsc.commands.executeCommand('setContext', 'icarusext.hasProjectOpen', true);
		treeProvider.rootProject = project;
	}
}

export function activate(context: vsc.ExtensionContext) {
	// Register treeview and provider
	context.subscriptions.push(window.createTreeView('projectView', {
		treeDataProvider: treeProvider
	}));

	// Parse project file
	if (workspace.workspaceFolders != undefined) {
		if (workspace.workspaceFolders.length != 1) {
			vsc.window.showWarningMessage('Multi-root workspace detected and is unsupported.')
		}
		let projectFile = vsc.Uri.joinPath(workspace.workspaceFolders[0].uri, 'project.yml');
		if (fs.existsSync(projectFile.fsPath)) {
			vsc.commands.executeCommand('setContext', 'icarusext.hasProjectLoading', true);
			loadProject(projectFile);
		}
	}
}

export function deactivate() { }

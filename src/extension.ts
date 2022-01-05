'use strict';

import * as vsc from 'vscode';
import * as fusesoc from './fusesoc';
import * as fs from 'fs';
import { FileTreeProvider } from './filetree';
const workspace = vsc.workspace;
const window = vsc.window;
const commands = vsc.commands;

let treeProvider = new FileTreeProvider();

export function activate(context: vsc.ExtensionContext) {
	// Register user-visible commands
	context.subscriptions.push(commands.registerCommand('icarusext.refreshTree', () => refreshTree()));

	// Register treeview and provider
	context.subscriptions.push(window.createTreeView('projectView', {
		treeDataProvider: treeProvider
	}));

	// Parse project file
	refreshTree();
}

export function deactivate() { }

function refreshTree(): void {
	if (workspace.workspaceFolders != undefined) {
		if (workspace.workspaceFolders.length != 1) {
			vsc.window.showWarningMessage('Multi-root workspace detected and is unsupported.')
		}
		let projectFile = vsc.Uri.joinPath(workspace.workspaceFolders[0].uri, 'project.yml');
		loadProject(projectFile);
	}
}

async function loadProject(projectFile: vsc.Uri) {
	if (!fs.existsSync(projectFile.fsPath))
		return;
	vsc.commands.executeCommand('setContext', 'icarusext.hasProjectLoading', true);
	let project = await window.withProgress({
		location: vsc.ProgressLocation.Notification,
		title: 'Loading project...',
		cancellable: false
	}, (progress, token) => {
		return fusesoc.Project.parse(projectFile, progress, token);
	});
	if (project != undefined) {
		vsc.commands.executeCommand('setContext', 'icarusext.hasProjectOpen', true);
		treeProvider.rootProject = project;
	} else {
		vsc.window.showErrorMessage('Loading project failed. See console for details.');
	}
}

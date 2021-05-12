<<<<<<< Updated upstream
import * as vscode from 'vscode';
import { GLOBAL_CHANNEL } from './common';
import { IcarusProperties } from './configurations';
import * as action from './flow/actions';
import { FlowTreeProvider } from './flow/flowtree';
import { BenchRootAction, Decorator, FlowTaskAction } from './flow/nodebase';
import { Runner } from './runner';
import { Sizer } from './sizer';

const ICARUS_CMD_RUN = 'icarusext.run';
const ICARUS_CMD_STOP = 'icarusext.stop';
const ICARUS_CMD_TSIZER = 'icarusext.tsizer';

let run = new Runner();
let sizer = new Sizer();
let status: vscode.StatusBarItem;
let configs: Map<string, IcarusProperties> = new Map();
let activeConfig: IcarusProperties | null;
let defaultConfig: IcarusProperties = new IcarusProperties();
let flowTree: FlowTreeProvider;
let _output: vscode.OutputChannel;

function evt(e: vscode.TextDocument | undefined) {
	if (!e || e.languageId !== 'verilog') {
		status.text = `$(circuit-board) It's a bit lonely here`;
	}
	else {
		vscode.commands.executeCommand(ICARUS_CMD_TSIZER);
	}
}

function fetchConfigForWs(e: vscode.TextDocument | undefined) {
	if(e) {
		let wsroot = vscode.workspace.getWorkspaceFolder(e.uri)?.uri || null;
		if(wsroot) {
			activeConfig = ensureConfigExists(wsroot);
		} /*else {
			activeConfig = null;
		}*/
	} /*else {
		activeConfig = null;
	}*/
}

function ensureConfigExists(wsroot: vscode.Uri): IcarusProperties {
	let has = configs.get(wsroot.fsPath);
	if(!has) {
		has = new IcarusProperties(wsroot);
		configs.set(wsroot.fsPath, has);
	}
	return has;
}

export function getConfiguration(): IcarusProperties {
	return activeConfig ? activeConfig : defaultConfig;
}

export function getTree(): FlowTreeProvider {
	return flowTree;
}

export function globalOutput(): vscode.OutputChannel {
	return _output;
}

export function activate(context: vscode.ExtensionContext) {
	_output = vscode.window.createOutputChannel(GLOBAL_CHANNEL);
	flowTree = new FlowTreeProvider();
	if(vscode.workspace.workspaceFolders) {
		activeConfig = ensureConfigExists(vscode.workspace.workspaceFolders[0].uri);
	}

	context.subscriptions.push(vscode.commands.registerCommand(ICARUS_CMD_RUN, (fileUri: vscode.Uri) => {
		console.log(fileUri);
		vscode.commands.executeCommand(ICARUS_CMD_TSIZER);
		run.compile(fileUri);
	}));
	context.subscriptions.push(vscode.commands.registerCommand(ICARUS_CMD_STOP, (fileUri: vscode.Uri) => {
		run.stop(vscode.workspace.getWorkspaceFolder(fileUri)?.uri.fsPath || null);
		sizer.stop();
	}));
	context.subscriptions.push(vscode.commands.registerCommand(ICARUS_CMD_TSIZER, (x) => {
		sizer.tsizer(status, x || false);
	}));

	// Status bar
	status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 10);
	context.subscriptions.push(status);
	status.command = {
		title: "",
		command: ICARUS_CMD_TSIZER,
		arguments: [true]
	};
	status.text = `$(circuit-board) Click me!`;
	status.tooltip = 'Click me to refresh logic stats!';
	status.show();

	// Fire on document change and save
	context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(e => {
		evt(e?.document);
		fetchConfigForWs(e?.document);
	}));
	context.subscriptions.push(vscode.workspace.onDidSaveTextDocument(evt));

	vscode.commands.executeCommand(ICARUS_CMD_TSIZER);

	// Tree stuff
	fetchConfigForWs(vscode.window.activeTextEditor?.document);
	vscode.window.createTreeView('synthFlowView', {
		treeDataProvider: flowTree
	});
	context.subscriptions.push(vscode.commands.registerCommand('icarusext.tree.reload', () => getTree().refresh()));
	context.subscriptions.push(vscode.commands.registerCommand('icarusext.tree.runtask', action.runFlowTask));
	context.subscriptions.push(vscode.commands.registerCommand('icarusext.tree.stoptask', action.stopFlowTask));
	context.subscriptions.push(vscode.commands.registerCommand('icarusext.tree.addfile', action.flowAddFile));
	context.subscriptions.push(vscode.commands.registerCommand('icarusext.tree.openlog', action.openFile));
	context.subscriptions.push(vscode.commands.registerCommand('icarusext.tree.opencon', _output.show));
	context.subscriptions.push(vscode.commands.registerCommand('icarusext.tree.addstr', action.addItem));
	context.subscriptions.push(vscode.commands.registerCommand('icarusext.tree.delstr', action.delItem));
	context.subscriptions.push(vscode.commands.registerCommand('icarusext.tree.editbool', action.editPropBool));
	context.subscriptions.push(vscode.commands.registerCommand('icarusext.tree.editstring', action.editPropString));
	context.subscriptions.push(vscode.commands.registerCommand('icarusext.tree.choosefile', action.chooseFile));
	context.subscriptions.push(vscode.commands.registerCommand('icarusext.tree.openfile', action.openFile));

	context.subscriptions.push(vscode.commands.registerCommand('icarusext.tree.lock', () =>
		vscode.workspace.getConfiguration("verilog").update("icarusLockConfig", true)
	));
	context.subscriptions.push(vscode.commands.registerCommand('icarusext.tree.unlock', () =>
		vscode.workspace.getConfiguration("verilog").update("icarusLockConfig", false)
	));
	context.subscriptions.push(vscode.commands.registerCommand('icarusext.tree.sync', getConfiguration().syncJson));
}

export function deactivate() {
	run.dispose();
	sizer.dispose();
}
=======
import * as vscode from 'vscode';
import { GLOBAL_CHANNEL } from './common';
import { IcarusProperties } from './configurations';
import * as action from './flow/actions';
import { FlowTreeProvider } from './flow/flowtree';
import { Runner, Sizer } from './runner';

const ICARUS_CMD_RUN = 'icarusext.run';
const ICARUS_CMD_STOP = 'icarusext.stop';
const ICARUS_CMD_TSIZER = 'icarusext.tsizer';

let run = new Runner();
let sizer = new Sizer();
let status: vscode.StatusBarItem;
let configs: Map<string, IcarusProperties> = new Map();
let activeConfig: IcarusProperties | null;
let defaultConfig: IcarusProperties = new IcarusProperties();
let flowTree: FlowTreeProvider;
let _output: vscode.OutputChannel;

function evt(e: vscode.TextDocument | undefined) {
	if (!e || e.languageId !== 'verilog') {
		status.text = `$(circuit-board) It's a bit lonely here`;
	}
	else {
		vscode.commands.executeCommand(ICARUS_CMD_TSIZER);
	}
}

function fetchConfigForWs(e: vscode.TextDocument | undefined) {
	if(e) {
		let wsroot = vscode.workspace.getWorkspaceFolder(e.uri)?.uri || null;
		if(wsroot) {
			activeConfig = ensureConfigExists(wsroot);
		} /*else {
			activeConfig = null;
		}*/
	} /*else {
		activeConfig = null;
	}*/
}

function ensureConfigExists(wsroot: vscode.Uri): IcarusProperties {
	let has = configs.get(wsroot.fsPath);
	if(!has) {
		has = new IcarusProperties(wsroot);
		configs.set(wsroot.fsPath, has);
	}
	return has;
}

export function getConfiguration(): IcarusProperties {
	return activeConfig ? activeConfig : defaultConfig;
}

export function getTree(): FlowTreeProvider {
	return flowTree;
}

export function globalOutput(): vscode.OutputChannel {
	return _output;
}

export function activate(context: vscode.ExtensionContext) {
	_output = vscode.window.createOutputChannel(GLOBAL_CHANNEL);
	flowTree = new FlowTreeProvider();
	if(vscode.workspace.workspaceFolders) {
		activeConfig = ensureConfigExists(vscode.workspace.workspaceFolders[0].uri);
	}

	context.subscriptions.push(vscode.commands.registerCommand(ICARUS_CMD_RUN, (fileUri: vscode.Uri) => {
		console.log(fileUri);
		vscode.commands.executeCommand(ICARUS_CMD_TSIZER);
		run.compile(fileUri);
	}));
	context.subscriptions.push(vscode.commands.registerCommand(ICARUS_CMD_STOP, (fileUri: vscode.Uri) => {
		run.stop(vscode.workspace.getWorkspaceFolder(fileUri)?.uri.fsPath || null);
		sizer.stop();
	}));
	context.subscriptions.push(vscode.commands.registerCommand(ICARUS_CMD_TSIZER, (x) => {
		sizer.tsizer(status, x || false);
	}));

	// Status bar
	status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 10);
	context.subscriptions.push(status);
	status.command = {
		title: "",
		command: ICARUS_CMD_TSIZER,
		arguments: [true]
	};
	status.text = `$(circuit-board) Click me!`;
	status.tooltip = 'Click me to refresh logic stats!';
	status.show();

	// Fire on document change and save
	context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(e => {
		evt(e?.document);
		fetchConfigForWs(e?.document);
	}));
	context.subscriptions.push(vscode.workspace.onDidSaveTextDocument(evt));

	vscode.commands.executeCommand(ICARUS_CMD_TSIZER);

	// Tree stuff
	fetchConfigForWs(vscode.window.activeTextEditor?.document);
	vscode.window.createTreeView('synthFlowView', {
		treeDataProvider: flowTree
	});
	context.subscriptions.push(vscode.commands.registerCommand('icarusext.tree.reload', () => getTree().refresh()));
	context.subscriptions.push(vscode.commands.registerCommand('icarusext.tree.runtask', action.runFlowTask));
	context.subscriptions.push(vscode.commands.registerCommand('icarusext.tree.stoptask', action.stopFlowTask));
	context.subscriptions.push(vscode.commands.registerCommand('icarusext.tree.addfile', action.flowAddFile));
	context.subscriptions.push(vscode.commands.registerCommand('icarusext.tree.openlog', action.openFile));
	context.subscriptions.push(vscode.commands.registerCommand('icarusext.tree.opencon', () => _output.show()));
	context.subscriptions.push(vscode.commands.registerCommand('icarusext.tree.addstr', action.addItem));
	context.subscriptions.push(vscode.commands.registerCommand('icarusext.tree.delstr', action.delItem));
	context.subscriptions.push(vscode.commands.registerCommand('icarusext.tree.editbool', action.editPropBool));
	context.subscriptions.push(vscode.commands.registerCommand('icarusext.tree.editstring', action.editPropString));
	context.subscriptions.push(vscode.commands.registerCommand('icarusext.tree.choosefile', action.chooseFile));
	context.subscriptions.push(vscode.commands.registerCommand('icarusext.tree.openfile', action.openFile));

	context.subscriptions.push(vscode.commands.registerCommand('icarusext.tree.lock', () =>
		vscode.workspace.getConfiguration("verilog").update("icarusLockConfig", true)
	));
	context.subscriptions.push(vscode.commands.registerCommand('icarusext.tree.unlock', () =>
		vscode.workspace.getConfiguration("verilog").update("icarusLockConfig", false)
	));
	context.subscriptions.push(vscode.commands.registerCommand('icarusext.tree.sync', () => getConfiguration().syncJson()));
}

export function deactivate() {
	run.dispose();
	sizer.dispose();
}
>>>>>>> Stashed changes

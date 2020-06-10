import * as vscode from 'vscode';
import { Runner } from './runner';

const ICARUS_CMD_RUN = 'icarusext.run';
const ICARUS_CMD_STOP = 'icarusext.stop';
const ICARUS_CMD_TSIZER = 'icarusext.tsizer';

let run = new Runner();
let status: vscode.StatusBarItem;

function evt(e: vscode.TextDocument | undefined) {
	if (!e || e.languageId !== 'verilog') {
		status.text = `$(circuit-board) It's a bit lonely here`;
	}
	else {
		vscode.commands.executeCommand(ICARUS_CMD_TSIZER);
	}
}

export function activate(context: vscode.ExtensionContext) {
	let cmdrun = vscode.commands.registerCommand(ICARUS_CMD_RUN, (fileUri: vscode.Uri) => {
		vscode.commands.executeCommand(ICARUS_CMD_TSIZER);
		run.compile(fileUri);
	});
	let cmdstop = vscode.commands.registerCommand(ICARUS_CMD_STOP, (fileUri: vscode.Uri) => {
		run.stop(vscode.workspace.getWorkspaceFolder(fileUri)?.uri.fsPath || null);
	});
	let cmdtsizer = vscode.commands.registerCommand(ICARUS_CMD_TSIZER, (x) => {
		run.tsizer(status, x || false);
	});
	context.subscriptions.push(cmdrun);
	context.subscriptions.push(cmdstop);
	context.subscriptions.push(cmdtsizer);

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
	context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(e => evt(e?.document)));
	context.subscriptions.push(vscode.workspace.onDidSaveTextDocument(evt));

	vscode.commands.executeCommand(ICARUS_CMD_TSIZER);
}

export function deactivate() {
	run.dispose();
}

import * as vscode from 'vscode';
import { Runner } from './runner';

let run = new Runner();

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(vscode.commands.registerCommand('icarusext.run', (fileUri: vscode.Uri) => {
		run.compile(fileUri);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('icarusext.stop', () => {
		run.stop();
	}));
}

export function deactivate() {
	run.dispose();
}

import * as vscode from 'vscode';
import { RUNNER_CHANNEL } from './common';

export abstract class DisposableRunnerBase implements vscode.Disposable {
    protected output: vscode.OutputChannel;
    private config: vscode.Disposable;
    constructor(output: vscode.OutputChannel) {
        this.output = output;
        this.config = vscode.workspace.onDidChangeConfiguration(() => {
            this.getConfig();
        });
        this.getConfig();
    }
    protected abstract getConfig() : void;
    dispose() {
        this.config.dispose();
    }
}

export abstract class RunnerBase extends DisposableRunnerBase {
    public async abstract compile(fileUri: vscode.Uri) : Promise<void>;
    public abstract stop(cwd: string | null) : void;
    dispose() {
        super.dispose();
        this.stop(null);
    }
}

export class Runner extends RunnerBase {
    constructor() {
        super(vscode.window.createOutputChannel(RUNNER_CHANNEL));
    }
    
    protected getConfig() { };

    public async compile(fileUri: vscode.Uri) : Promise<void> {

    }

    public stop(cwd: string | null) : void {

    }
}

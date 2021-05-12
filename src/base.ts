import * as vscode from 'vscode';
import { RUNNER_CHANNEL } from './common';
import { IcarusRunner } from './runner/icarus';

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
    public dispose() {
        this.config.dispose();
    }
}

export abstract class RunnerBase extends DisposableRunnerBase {
    public async abstract compile(fileUri: vscode.Uri) : Promise<void>;
    public abstract stop(cwd: string | null) : void;
    public dispose() {
        super.dispose();
        this.stop(null);
    }
}

export abstract class SizerBase extends DisposableRunnerBase {
    public async abstract tsizer(status: vscode.StatusBarItem, showMessage: boolean) : Promise<void>;
    public abstract stop() : void;
    dispose() {
        super.dispose();
        this.stop();
    }
}

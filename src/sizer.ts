import * as vscode from 'vscode';
import { TSIZER_CHANNEL } from './common';
import { DisposableRunnerBase } from './runner';

export abstract class SizerBase extends DisposableRunnerBase {
    public async abstract tsizer(status: vscode.StatusBarItem, showMessage: boolean) : Promise<void>;
    public abstract stop() : void;
    dispose() {
        super.dispose();
        this.stop();
    }
}

export class Sizer extends SizerBase {
    constructor() {
        super(vscode.window.createOutputChannel(TSIZER_CHANNEL));
    }
    
    protected getConfig() { };

    public async tsizer(status: vscode.StatusBarItem, showMessage: boolean) {

    }

    public stop() : void {

    }
}

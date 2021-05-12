<<<<<<< Updated upstream
=======
<<<<<<< Updated upstream
import { exec, ChildProcess } from 'child_process';
import { emptyDirSync, readFileSync } from 'fs-extra';

>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
}
=======

    public stop(cwd: string | null) {
        const treeKill = require('tree-kill');
        if (this.procCompile) {
            treeKill(this.procCompile.pid);
            this.procCompile = undefined;
            this.output.appendLine("Killed compiler.");
        }

        if (this.procExec) {
            treeKill(this.procExec.pid);
            this.procExec = undefined;
            this.output.appendLine("Killed executer.");
        }

        if (this.procSizer) {
            treeKill(this.procSizer.pid);
            this.procSizer = undefined;
        }

        if (cwd) {
            emptyDirSync(path.resolve(cwd, CONFIG_BUILD));
            this.output.appendLine("Cleaned build directory.");
        }

        this.watcher?.dispose();
        this.watcher = undefined;
    }

    public async tsizer(status: vscode.StatusBarItem, showMessage: boolean) {
        if (this.procSizer) {
            const treeKill = require('tree-kill');
            treeKill(this.procSizer.pid);
            this.procSizer = undefined;
        }

        let fileUri = vscode.window.activeTextEditor?.document.uri;
        if (!fileUri) {
            status.text = `$(circuit-board) It's a bit lonely here`;
            return;
        }

        status.text = `$(loading~spin) Loading...`;

        let cwd = getWorkspaceCwd(fileUri);
        let outputFileUri = path.join(CONFIG_BUILD, `a.out1`);
        let inputFileUri = path.relative(cwd, fileUri.fsPath);
        let moduleUri = path.dirname(inputFileUri);
        let cmd: string = `iverilog -tsizer ${CONFIG_ARGS} -o ${outputFileUri} ${inputFileUri}`;

        this.procSizer = exec(cmd, { cwd: cwd });
        this.tsizerOutput.clear();
        this.tsizerOutput.appendLine(cmd);
        this.procSizer.stdout?.on("data", d => this.tsizerOutput.append(d));
        this.procSizer.stderr?.on("data", d => this.tsizerOutput.append(d));
        this.procSizer.on("close", c => {
            this.procSizer = undefined;
            this.tsizerOutput.appendLine(`\ntsizer finished with exit code ${c}`);

            if (c !== 0) {
                status.text = `$(circuit-board) File not synthesizable`;
                return;
            }

            this.out = readFileSync(path.resolve(cwd, outputFileUri)).toString('ascii') || "";
            if (showMessage) {
                vscode.window.showInformationMessage(this.out.trim()
                    .replace(/\r\n/gm, '\n') // Newline
                    .replace(/\n\*/gm, '\n\n*') // Add paragraph space
                    .replace(/\n {5}/gm, ', ') // Leading tab
                    .replace(/ {3}/gm, '') // 3 spaces
                    .replace(/ {2}/gm, ''), // 2 spaces
                    { modal: true });
            }
            status.text = `$(circuit-board) Flip-Flops: ${getStatusFlipFlops(this.out)}, Logic Gates: ${getStatusGates(this.out)}`;
        });
    }

    private destroyWatcher() {
        if (!this.procExec) {
            this.watcher?.dispose();
            this.watcher = undefined;
        }
    }

    dispose() {
        this.stop(null);
    }
}
=======
import * as vscode from 'vscode';
import { RunnerBase, SizerBase } from './base';
import { RUNNER_CHANNEL, TSIZER_CHANNEL } from './common';
import { IcarusRunner } from './runner/icarus';
import { IcarusSizer } from './sizer/icarus';

export class Sizer extends SizerBase {
    private runner: SizerBase;
    constructor() {
        super(vscode.window.createOutputChannel(TSIZER_CHANNEL));
        this.runner = new IcarusSizer(this.output);
    }
    
    protected getConfig() { };

    public async tsizer(status: vscode.StatusBarItem, showMessage: boolean) {
        this.runner.tsizer(status, showMessage);
    }

    public stop() {
        this.runner.stop();
    }

    public dispose() {
        super.dispose();
        this.runner.dispose();
    }
}

export class Runner extends RunnerBase {
    private runner: RunnerBase;
    constructor() {
        super(vscode.window.createOutputChannel(RUNNER_CHANNEL));
        this.runner = new IcarusRunner(this.output);
    }
    
    protected getConfig() { };

    public async compile(fileUri: vscode.Uri) : Promise<void> {
        this.runner.compile(fileUri);
    }

    public stop(cwd: string | null) : void {
        this.runner.stop(cwd);
    }

    public dispose() {
        super.dispose();
        this.runner.dispose();
    }
}
>>>>>>> Stashed changes
>>>>>>> Stashed changes

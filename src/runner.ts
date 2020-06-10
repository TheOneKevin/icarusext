import { exec, ChildProcess } from 'child_process';
import { emptyDirSync, readFileSync } from 'fs-extra';

import * as vscode from 'vscode';
import * as path from 'path';

const CHANNEL_NAME = "Icarus Output";
const OPTION_OPEN = "Open in GTKWave";
const TSIZER_NAME = "Icarus Tsizer Output";

// Config
const CONFIG = vscode.workspace.getConfiguration("verilog");
const CONFIG_GLOB = CONFIG.get<string>('gtkwaveWatchGlob') || '';
const CONFIG_ARGS = CONFIG.get<string>('icarusCompileArguments') || '';
const CONFIG_BUILD = CONFIG.get<string>('icarusBuildDirectory') || '';
const CONFIG_PERSIST = CONFIG.get<boolean>('icarusPersistentBuild') || false;

function getWorkspaceCwd(fileUri: vscode.Uri | null = null): string {
    if (!fileUri) {
        // TODO: Something goes here
        return "";
    }

    let cwd: string = vscode.workspace.getWorkspaceFolder(fileUri)?.uri.fsPath || "";
    if (!cwd) {
        cwd = path.dirname(fileUri.fsPath);
    }
    return cwd;
}

function getStatusGates(out: string): string {
    let res = "0";
    var regexp = /Logic Gates  : (\d+)/g;
    let match = regexp.exec(out);
    while (match !== null) {
        res = match[1];
        match = regexp.exec(out);
    }
    return res;
}

function getStatusFlipFlops(out: string): string {
    let res = "0";
    var regexp = /Flip-Flops   : (\d+)/g;
    let match = regexp.exec(out);
    while (match !== null) {
        res = match[1];
        match = regexp.exec(out);
    }
    return res;
}

export class Runner implements vscode.Disposable {
    private output: vscode.OutputChannel;
    private tsizerOutput: vscode.OutputChannel;

    private procCompile: ChildProcess | undefined;
    private procExec: ChildProcess | undefined;
    private procSizer: ChildProcess | undefined;
    private procGtk: Map<string, ChildProcess>;

    private watcher: vscode.FileSystemWatcher | undefined;

    // Persistent out
    private out: string = "";

    constructor() {
        this.output = vscode.window.createOutputChannel(CHANNEL_NAME);
        this.tsizerOutput = vscode.window.createOutputChannel(TSIZER_NAME);
        this.procGtk = new Map<string, ChildProcess>();
    }

    public async compile(fileUri: vscode.Uri) {
        // Avoid leaky asses
        if (this.procCompile || this.procExec) {
            vscode.window.showErrorMessage("An existing compilation/execution is still running!");
            return;
        }

        this.output.show(true);

        let cwd = getWorkspaceCwd(fileUri);

        if (!CONFIG_PERSIST) {
            emptyDirSync(path.resolve(cwd, CONFIG_BUILD));
        }

        let outputFileUri = path.join(CONFIG_BUILD, `${path.basename(fileUri.fsPath)}.out`);
        let inputFileUri = path.relative(cwd, fileUri.fsPath);
        let cmd: string = `iverilog ${CONFIG_ARGS} -o ${outputFileUri} ${inputFileUri}`;

        this.output.appendLine(` > ${cmd} \n`);

        this.procCompile = exec(cmd, { cwd: cwd });
        this.procCompile.stdout?.on("data", d => this.output.append(d));
        this.procCompile.stderr?.on("data", d => this.output.append(d));
        this.procCompile.on("close", c => {
            this.procCompile = undefined;
            this.output.appendLine(`Compilation finished with exit code ${c}`);

            if (c === 0) {
                // Let it execute in the build folder now
                let absOut = path.resolve(cwd, outputFileUri);
                let newCwd = path.dirname(absOut);
                this.execute(path.relative(newCwd, absOut), newCwd);
            } else {
                vscode.window.showErrorMessage(`Compilation failed successfully with ${c} errors.`);
            }
        });
    }

    private async execute(fileUri: string, cwd: string) {
        this.destroyWatcher();

        let callback = (e: vscode.Uri) => {
            if (this.procGtk.has(e.fsPath)) {
                return;
            }

            vscode.window.showInformationMessage("Output file was created.", OPTION_OPEN, "Cancel").then(selection => {
                if (selection === OPTION_OPEN) {
                    let proc = exec(`gtkwave ${e.fsPath}`);
                    this.procGtk.set(e.fsPath, proc);
                    proc.on("close", () => this.procGtk.delete(e.fsPath));
                }
                this.destroyWatcher();
            });
        };

        this.watcher = vscode.workspace.createFileSystemWatcher(
            new vscode.RelativePattern(cwd, CONFIG_GLOB),
            false, true, true
        );
        this.watcher.onDidCreate(callback);
        this.watcher.onDidChange(callback);

        await new Promise(r => setTimeout(r, 1000));

        let cmd = `vvp ${fileUri}`;
        this.output.appendLine(` > ${cmd} \n`);

        this.procExec = exec(cmd, { cwd: cwd });
        this.procExec.stdout?.on("data", d => this.output.append(d));
        this.procExec.stderr?.on("data", d => this.output.append(d));
        this.procExec.on("close", c => {
            if (c !== 0) {
                vscode.window.showErrorMessage(`Execution failed with exit code ${c}.`);
            }
            this.procExec = undefined;
            this.output.appendLine(`Execution finished with exit code ${c}`);
            // We cannot destroy watcher here due to race conditions.
            // Avoid synchronization when possible.
        });
    }

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
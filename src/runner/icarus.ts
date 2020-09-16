import { exec, ChildProcess } from 'child_process';
import { emptyDirSync } from 'fs-extra';
import { OPTION_OPEN, getWorkspaceCwd } from '../common';
import { RunnerBase } from '../runner';

import * as vscode from 'vscode';
import * as path from 'path';

export class IcarusRunner extends RunnerBase {
    private procCompile: ChildProcess | undefined;
    private procExec: ChildProcess | undefined;
    private procGtk: Map<string, ChildProcess>;

    private watcher: vscode.FileSystemWatcher | undefined;

    private GLOB : string = '';
    private ARGS : string = '';
    private BUILD : string = '';
    private PERSIST : boolean = false;

    constructor(output: vscode.OutputChannel) {
        super(output);
        this.procGtk = new Map<string, ChildProcess>();
    }

    protected getConfig() {
        let config = vscode.workspace.getConfiguration("verilog");
        this.GLOB = config.get<string>('gtkwaveWatchGlob') || '';
        this.ARGS = config.get<string>('icarusCompileArguments') || '';
        this.BUILD = config.get<string>('icarusBuildDirectory') || '';
        this.PERSIST = config.get<boolean>('icarusPersistentBuild') || false;
    }

    public async compile(fileUri: vscode.Uri) {
        // Avoid leaky asses
        if (this.procCompile || this.procExec) {
            vscode.window.showErrorMessage("An existing compilation/execution is still running!");
            return;
        }

        this.output.show(true);

        let cwd = getWorkspaceCwd(fileUri);

        if (!this.PERSIST) {
            emptyDirSync(path.resolve(cwd, this.BUILD));
        }

        let outputFileUri = path.join(this.BUILD, `${path.basename(fileUri.fsPath)}.out`);
        let inputFileUri = path.relative(cwd, fileUri.fsPath);
        let cmd: string = `iverilog ${this.ARGS} -o ${outputFileUri} ${inputFileUri}`;

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
            new vscode.RelativePattern(cwd, this.GLOB),
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

        if (cwd) {
            emptyDirSync(path.resolve(cwd, this.BUILD));
            this.output.appendLine("Cleaned build directory.");
        }

        this.watcher?.dispose();
        this.watcher = undefined;
    }

    private destroyWatcher() {
        if (!this.procExec) {
            this.watcher?.dispose();
            this.watcher = undefined;
        }
    }
}
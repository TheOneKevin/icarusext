import { exec, ChildProcess } from 'child_process';
import { emptyDirSync } from 'fs-extra';

import * as vscode from 'vscode';
import * as path from 'path';

const CHANNEL_NAME = "Icarus Verilog Output";
const CONFIG_NAME = "verilog";

const OPTION_OPEN = "Open in GTKWave";

export class Runner implements vscode.Disposable {

    private output: vscode.OutputChannel;

    // Resources we need to free later on
    private procCompile: ChildProcess | undefined;
    private procExec: ChildProcess | undefined;
    private watcher: vscode.FileSystemWatcher | undefined;

    // Config
    private readonly gtkwaveWatchGlob: string;
    private readonly compileArguments: string;
    private readonly buildFolder: string;

    constructor() {
        this.output = vscode.window.createOutputChannel(CHANNEL_NAME);

        let config = vscode.workspace.getConfiguration(CONFIG_NAME);
        this.gtkwaveWatchGlob = config.get<string>('gtkwaveWatchGlob') || '';
        this.compileArguments = config.get<string>('icarusCompileArguments') || '';
        this.buildFolder = config.get<string>('icarusBuildDirectory') || '';
    }

    public async compile(fileUri: vscode.Uri) {
        this.output.show(true);

        let cwd: string = vscode.workspace.getWorkspaceFolder(fileUri)?.uri.fsPath || "";
        if (!cwd) {
            cwd = path.dirname(fileUri.fsPath);
        }

        emptyDirSync(path.resolve(cwd, this.buildFolder));

        let outputFileUri = path.join(this.buildFolder, `${path.basename(fileUri.fsPath)}.out`);
        let inputFileUri = path.relative(cwd, fileUri.fsPath);

        this.procCompile = exec(`iverilog -o ${outputFileUri} ${inputFileUri} ${this.compileArguments}`, { cwd: cwd });
        this.procCompile.stdout?.on("data", d => {
            this.output.append(d);
        });
        this.procCompile.stderr?.on("data", d => {
            this.output.append(d);
        });
        this.procCompile.on("close", c => {
            this.procCompile = undefined;
            // Let it execute in the build folder now
            let absOut = path.resolve(cwd, outputFileUri);
            let newCwd = path.dirname(absOut);
            this.execute(path.relative(newCwd, absOut), newCwd);
        });
    }

    public async execute(fileUri: string, cwd: string) {
        // Destroy old watcher
        this.destroyWatcher();
        this.watcher = vscode.workspace.createFileSystemWatcher(
            new vscode.RelativePattern(cwd, this.gtkwaveWatchGlob),
            false, true, true
        );
        this.watcher.onDidCreate(e => {
            vscode.window.showInformationMessage("Output file was created.", OPTION_OPEN, "Cancel").then(selection => {
                if (selection === OPTION_OPEN) {
                    exec(`gtkwave ${e.fsPath}`);
                }
                // Are we the last ones? If so, die!
                this.destroyWatcher();
            });
        });

        this.procExec = exec(`vvp ${fileUri}`, { cwd: cwd });
        this.procExec.stdout?.on("data", d => {
            this.output.append(d);
        });
        this.procExec.stderr?.on("data", d => {
            this.output.append(d);
        });
        this.procExec.on("close", c => {
            this.procExec = undefined;
            // We cannot destroy watcher here due to race conditions.
            // Avoid synchronization when possible.
        });
    }

    private destroyWatcher() {
        if (!this.procExec) {
            this.watcher?.dispose();
            this.watcher = undefined;
        }
    }

    public stop() {
        const treeKill = require('tree-kill');
        if (this.procCompile) {
            treeKill(this.procCompile.pid);
            this.procCompile = undefined;
        }

        if (this.procExec) {
            treeKill(this.procExec.pid);
            this.procExec = undefined;
        }

        this.watcher?.dispose();
        this.watcher = undefined;
    }

    dispose() {
        this.stop();
    }
}
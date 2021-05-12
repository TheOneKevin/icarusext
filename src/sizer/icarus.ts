<<<<<<< Updated upstream
import { exec, ChildProcess } from 'child_process';
import { readFileSync } from 'fs-extra';
import { getWorkspaceCwd } from '../common';
import { SizerBase } from '../sizer';

import * as vscode from 'vscode';
import * as path from 'path';

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

export class IcarusSizer extends SizerBase {
    private procSizer: ChildProcess | undefined;
    // Persistent out
    private out: string = "";

    private ARGS : string = '';
    private BUILD : string = '';

    constructor(output: vscode.OutputChannel) {
        super(output);
    }

    protected getConfig() {
        let config = vscode.workspace.getConfiguration("verilog");
        this.ARGS = config.get<string>('icarusCompileArguments') || '';
        this.BUILD = config.get<string>('icarusBuildDirectory') || '';
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
        let outputFileUri = path.join(this.BUILD, `a.out1`);
        let inputFileUri = path.relative(cwd, fileUri.fsPath);
        //let moduleUri = path.dirname(inputFileUri);
        let cmd: string = `iverilog -tsizer ${this.ARGS} -o ${outputFileUri} ${inputFileUri}`;

        this.procSizer = exec(cmd, { cwd: cwd });
        this.output.clear();
        this.output.appendLine(cmd);
        this.procSizer.stdout?.on("data", d => this.output.append(d));
        this.procSizer.stderr?.on("data", d => this.output.append(d));
        this.procSizer.on("close", c => {
            this.procSizer = undefined;
            this.output.appendLine(`\ntsizer finished with exit code ${c}`);

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

    public stop() {
        const treeKill = require('tree-kill');
        if (this.procSizer) {
            treeKill(this.procSizer.pid);
            this.procSizer = undefined;
        }
    }

    dispose() {
        this.stop();
    }
=======
import { exec, ChildProcess } from 'child_process';
import { readFileSync } from 'fs-extra';
import { getWorkspaceCwd } from '../common';
import { SizerBase } from '../base';

import * as vscode from 'vscode';
import * as path from 'path';

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

export class IcarusSizer extends SizerBase {
    private procSizer: ChildProcess | undefined;
    // Persistent out
    private out: string = "";

    private ARGS : string = '';
    private BUILD : string = '';

    constructor(output: vscode.OutputChannel) {
        super(output);
        this.getConfig();
    }

    protected getConfig() {
        let config = vscode.workspace.getConfiguration("verilog");
        this.ARGS = config.get<string>('icarusCompileArguments') || '';
        this.BUILD = config.get<string>('icarusBuildDirectory') || '';
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
        let outputFileUri = path.join(this.BUILD, `a.out1`);
        let inputFileUri = path.relative(cwd, fileUri.fsPath);
        //let moduleUri = path.dirname(inputFileUri);
        let cmd: string = `iverilog -tsizer ${this.ARGS} -o ${outputFileUri} ${inputFileUri}`;

        this.procSizer = exec(cmd, { cwd: cwd });
        this.output.clear();
        this.output.appendLine(cmd);
        this.procSizer.stdout?.on("data", d => this.output.append(d));
        this.procSizer.stderr?.on("data", d => this.output.append(d));
        this.procSizer.on("close", c => {
            this.procSizer = undefined;
            this.output.appendLine(`\ntsizer finished with exit code ${c}`);

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

    public stop() {
        const treeKill = require('tree-kill');
        if (this.procSizer) {
            treeKill(this.procSizer.pid);
            this.procSizer = undefined;
        }
    }

    dispose() {
        this.stop();
    }
>>>>>>> Stashed changes
}
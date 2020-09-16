import { writeFileSync } from 'fs';
import { existsSync } from 'fs-extra';
import { jsonc } from 'jsonc';
import * as path from 'path';
import { Disposable, Uri, workspace } from 'vscode';
import { getTree } from './extension';

export class IcarusProperties implements Disposable {
    private readonly rootFolder: Uri | null;
    private readonly configFolder: string | undefined;
    private disposables : Disposable[] = [];
    private configFile : Uri | null | undefined;
    private _config: Configuration | null = null;

    constructor(rootPath?: Uri) {
        if(!rootPath) {
            this.configFolder = undefined;
            this.configFile = undefined;
            this.rootFolder = null;
            return;
        }
        this.rootFolder = rootPath;
        this.configFolder = path.join(rootPath.fsPath, ".vscode");
        const configFilePath = path.join(this.configFolder, "verilog-conf.json");
        if(existsSync(configFilePath)) {
            this.configFile = Uri.file(configFilePath);
        } else {
            this.configFile = null;
        }
        let watcher = workspace.createFileSystemWatcher(configFilePath);
        this.disposables.push(watcher);
        this.reloadConfig();
        watcher.onDidCreate(u => {
            this.configFile = u;
            this.reloadConfig();
        });
        watcher.onDidDelete(u => {
            this.configFile = null;
            this.reloadConfig();
        });
        watcher.onDidChange(u => {
            this.reloadConfig();
        });
    }

    private reloadConfig() {
        // If null, reset to defaults
        if(!this.configFile) {
            this._config = null;
            return;
        }
        try {
            this._config = <Configuration> jsonc.readSync(this.configFile.fsPath);
            if(!this._config) {
                throw new Error("Failed to parse properties file");
            }
        } catch(e) {
            
        }
        getTree().refresh();
    }

    public syncJson() {
        if(!this._config || !this.configFile) {
            return;
        }
        writeFileSync(this.configFile.fsPath,
            jsonc.stringify(this._config, undefined, 4));
    }

    public get configuration() {
        return this._config;
    }

    public get wsroot() {
        return this.rootFolder;
    }

    public dispose() {
        this.disposables.forEach(e => e.dispose());
    }
}

export interface Configuration {
    synth: SynthConfig;
    tb: string[];
}

export interface SynthConfig {
    top: string[];
    tasks: TaskConfig[];
    outputs: string[];
}

export interface TaskConfig {
    title: string;
    type: string;
    args?: string[];
    cmds?: string[];
    runInRoot?: boolean;
    log?: string;
    run?: string;
}

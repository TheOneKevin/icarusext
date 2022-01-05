'use strict';

import { readFileSync } from 'fs';
import { window, TreeItem, TreeItemCollapsibleState, Uri, Progress, CancellationToken, ThemeIcon, workspace } from 'vscode';
import * as path from 'path';
import * as YAML from 'yaml';
import { IFileTreeItem } from '../filetree';
import { IPCore } from './ParseCAPI2';

type TProgress = Progress<{
    message?: string | undefined;
    increment?: number | undefined;
}>;

/**
 * Sets map[key] to val() if not existing, otherwise, return value.
 * @param map Map
 * @param key Key
 * @param val Default value function that returns the default value
 * @returns map[key] if exists and val() otherwise
 */
function mapSetOrDefault<T, U>(map: Map<T, U>, key: T, val: () => U): U {
    let ret = map.get(key);
    if (!ret) {
        ret = val();
        map.set(key, ret);
    }
    return ret;
}

export class Project implements IFileTreeItem {
    private files: Uri[] = [];
    private ips: IPCore[] = [];
    private children: Map<string, VendorTree>;

    private constructor() {
        this.children = new Map<string, VendorTree>();
    }

    /**
     * Initializes typed Project from YAML.
     * This is the sole public constructor of Project.
     * @param filePath Path to project YAML
     * @returns 
     */
    static async parse(filePath: Uri, progress: TProgress, token: CancellationToken): Promise<Project | undefined> {
        const rootDir = path.dirname(filePath.fsPath);
        let obj = YAML.parse(readFileSync(filePath.fsPath, 'utf-8'));
        if (obj == undefined) {
            return undefined;
        }
        // 1. Deserialize YAML
        let project = new Project();
        if (!Array.isArray(obj.files)) {
            return undefined;
        }
        // 2. Set up progress tracking variables
        const totalLength = 0 | obj.files?.length;
        let progressObj = {
            progress: progress,
            totalLength: totalLength,
            incrementAmount: 100 / Math.max(totalLength, 1),
            totalProcessed: 0
        };
        // 3. Loop and parse IP, filtering out errored IPs
        let ipcores: Promise<IPCore>[] = [];
        for (let file of obj.files) {
            if (typeof file !== 'string') {
                return undefined;
            }
            let fileUri = Uri.from({
                scheme: "file", path: path.resolve(rootDir, file)
            });
            project.files.push(fileUri);
            ipcores.push(IPCore.parse(fileUri, progressObj));
        }
        project.ips = await Promise.all(ipcores.map(p => p.catch(e => {
            console.warn(`Skipped loading IP ${e.path} due to:\n${e}`);
            window.showWarningMessage(
                `Skipped loading IP ${e.path}. ${e}`, 'Open .core file'
            ).then(x => {
                if (x === undefined || !e?.path)
                    return;
                workspace.openTextDocument(Uri.from({
                    scheme: 'file', path: e.path
                })).then(doc => window.showTextDocument(doc));
            });
            return e;
        })));
        project.ips = project.ips.filter(v => !(v instanceof Error));
        // 4. Build vendor tree upwards
        for (let ip of project.ips) {
            let vendor = mapSetOrDefault(project.children, ip.Vendor, () => new VendorTree(ip.Vendor));
            let library = mapSetOrDefault(vendor.children, ip.Library, () => new LibraryTree(ip.Library));
            library.ips.push(ip);
        }
        return project;
    }

    public getChildren(): IFileTreeItem[] {
        return [... this.children.values()];
    }

    public getTreeItem(): TreeItem {
        let item = new TreeItem('Project Root', this.ips.length == 0
            ? TreeItemCollapsibleState.None
            : TreeItemCollapsibleState.Expanded);
        item.iconPath = new ThemeIcon('project');
        return item;
    }
}

class VendorTree implements IFileTreeItem {
    public children: Map<string, LibraryTree>;

    public constructor(public name: string) {
        this.children = new Map<string, LibraryTree>();
    }

    public get compact(): boolean {
        return this.children.size == 1;
    }

    public getChildren(): IFileTreeItem[] {
        return this.compact ? this.children.values().next().value.getChildren() : [...this.children.values()];
    }

    public getTreeItem(): TreeItem {
        let name = this.compact ? `${this.name}:${this.children.values().next().value.name}` : this.name;
        let item = new TreeItem(name, TreeItemCollapsibleState.Collapsed);
        item.iconPath = new ThemeIcon('library');
        return item;
    }
}

class LibraryTree implements IFileTreeItem {
    public ips: IPCore[] = [];

    public constructor(public name: string) { }

    public getChildren(): IFileTreeItem[] {
        return this.ips;
    }

    public getTreeItem(): TreeItem {
        let item = new TreeItem(this.name, TreeItemCollapsibleState.Collapsed);
        item.iconPath = new ThemeIcon('folder');
        return item;
    }
}

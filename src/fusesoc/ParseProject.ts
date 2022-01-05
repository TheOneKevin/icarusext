'use strict';

import { readFileSync } from 'fs';
import { TreeItem, TreeItemCollapsibleState, Uri, Progress, CancellationToken } from 'vscode';
import * as path from 'path';
import * as YAML from 'yaml';
import { IFileTreeItem } from '../filetree';
import { IPCore } from './ParseCAPI2';

type TProgress = Progress<{
    message?: string | undefined;
    increment?: number | undefined;
}>;

export class Project implements IFileTreeItem {
    private files: Uri[] = [];
    private children: IPCore[] = [];

    private constructor() { }

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
        // First, deserialize the object
        let project = new Project();
        if (!Array.isArray(obj.files)) {
            return undefined;
        }

        const totalLength = 0 | obj.files?.length;
        let progressObj = {
            progress: progress,
            totalLength: totalLength,
            incrementAmount: 100 / Math.max(totalLength, 1),
            totalProcessed: 0
        };

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
        project.children = await Promise.all(ipcores.map(p => p.catch(e => {
            console.warn(`Skipped loading due to ${e}`);
            return e;
        })));
        project.children = project.children.filter(v => !(v instanceof Error));
        return project;
    }

    public getChildren(): IFileTreeItem[] {
        return this.children;
    }

    public getTreeItem(): TreeItem {
        return new TreeItem("Root",
            this.children.length == 0
                ? TreeItemCollapsibleState.None
                : TreeItemCollapsibleState.Expanded);
    }
}
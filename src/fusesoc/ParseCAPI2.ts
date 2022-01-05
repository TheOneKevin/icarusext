'use strict';

import { promises as fs } from 'fs';
import { ThemeIcon, TreeItem, TreeItemCollapsibleState, Uri } from 'vscode';
import * as path from 'path';
import * as YAML from 'yaml';
import { IFileTreeItem } from '../filetree';

const parser = require('./CAPI2Meta.js');

export class IPCore implements IFileTreeItem {
    private vendor: string;
    private library: string;
    private name: string;
    private version: string;
    private filesetMap;
    private dependencies: CAPI2Reference[];

    private constructor() {
        this.vendor = '';
        this.library = '';
        this.name = '';
        this.version = '';
        this.filesetMap = new Map<string, CAPI2File[]>();
        this.dependencies = [];
    }

    static async parse(filePath: Uri, progressObj: any): Promise<IPCore> {
        const options = { conditions: {} };
        const rootDir = path.dirname(filePath.fsPath);
        let obj = YAML.parse(await fs.readFile(filePath.fsPath, 'utf-8'));
        let ret = new IPCore();
        // console.log(obj);
        // TODO: Check CAPI2 syntax beforehand
        if (!('CAPI=2' in obj))
            throw Error(`${filePath.fsPath}\nMalformed YAML: Incorrect/missing CAPI2 version`);
        // Deserialize VLNV
        [ret.vendor, ret.library, ret.name, ret.version] = obj.name.split(':');
        // Parse default target only
        let defaultFilesets: string[] = [];
        let defaultFileset = obj.targets?.default?.filesets;
        if (!defaultFileset && !Array.isArray(defaultFileset))
            throw Error(`${filePath.fsPath}\nMalformed YAML: Missing default target fileset`);
        let defaultFilesetAppend = obj.targets?.default?.filesets_append;
        if (defaultFilesetAppend && Array.isArray(defaultFilesetAppend))
            defaultFileset = defaultFileset.concat(defaultFilesetAppend);
        for (let fileset of defaultFileset) {
            let parsedFilesets = parser.parse(fileset, options);
            defaultFilesets = defaultFilesets.concat(parsedFilesets)
        }
        // Obtain files in filesets
        for (let fileset of defaultFilesets) {
            let files = obj.filesets?.[fileset]?.files;
            let type = obj.filesets?.[fileset]?.file_type;
            let depend = obj.filesets?.[fileset]?.depend;
            if (!files || !Array.isArray(files))
                files = [];
            if (!type)
                type = 'undefined';
            if (!depend || !Array.isArray(depend))
                depend = [];
            ret.filesetMap.set(fileset, []);
            for (let file of files)
                ret.filesetMap.get(fileset)?.push(
                    new CAPI2File(rootDir, file, type));
            for (let expr of depend)
                for (let d of parser.parse(expr, options))
                    ret.dependencies.push(new CAPI2Reference(d));
        }
        //
        // console.log(ret.filesetMap);
        progressObj.progress.report({
            increment: progressObj.incrementAmount,
            message: `Processing ${++progressObj.totalProcessed}/${progressObj.totalLength}`
        });
        return ret;
    }

    public getChildren(): IFileTreeItem[] {
        let ret: IFileTreeItem[] = [new CAPI2References(this.dependencies)];
        for (let val of this.filesetMap.values())
            ret = ret.concat(val);
        return ret;
    }

    public getTreeItem(): TreeItem {
        let item = new TreeItem(this.getVlnv(), TreeItemCollapsibleState.Collapsed);
        item.iconPath = new ThemeIcon('folder-library');
        return item;
    }

    public getVlnv(): string {
        return `${this.vendor}:${this.library}:${this.name}`;
    }
}

class CAPI2File implements IFileTreeItem {
    constructor(private rootDir: string, private path: string, private type: string) { }
    public getChildren(): IFileTreeItem[] {
        return [];
    }
    public getTreeItem(): TreeItem {
        let item = new TreeItem(this.path);
        item.iconPath = new ThemeIcon('file-code');
        return item;
    }
}

class CAPI2References implements IFileTreeItem {
    constructor(private children: IFileTreeItem[]) { }
    public getChildren(): IFileTreeItem[] {
        return this.children;
    }
    public getTreeItem(): TreeItem {
        let item = new TreeItem("IP Dependencies", TreeItemCollapsibleState.Collapsed);
        item.iconPath = new ThemeIcon('references');
        return item;
    }
}

class CAPI2Reference implements IFileTreeItem {
    constructor(private vln: string) { }
    public getChildren(): IFileTreeItem[] {
        return [];
    }
    public getTreeItem(): TreeItem {
        let item = new TreeItem(this.vln);
        item.iconPath = new ThemeIcon('library');
        return item;
    }
}

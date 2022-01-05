'use strict';

import { Event, TreeDataProvider, TreeItem, EventEmitter } from 'vscode';
import { IFileTreeItem } from './FileTreeItem';

/**
 * Class to allow more than one root node to be displayed in the project tree.
 */
class ProjectTreeRoot implements IFileTreeItem {
    public rootProject: IFileTreeItem | undefined;

    getChildren(): IFileTreeItem[] {
        return <IFileTreeItem[]> [this.rootProject].filter(Boolean);
    }

    getTreeItem(): TreeItem {
        throw new Error('Method not implemented.');
    }
}

export class FileTreeProvider implements TreeDataProvider<IFileTreeItem> {
    readonly onDidChangeTreeData: Event<IFileTreeItem | undefined | void>;
    private onChangeEvent: EventEmitter<IFileTreeItem | undefined | void>;
    private _root: ProjectTreeRoot = new ProjectTreeRoot();

    /**
     * Constructor
     * @param _root No root project is present when undefined
     */
    constructor() {
        this.onChangeEvent = new EventEmitter<IFileTreeItem | undefined | void>();
        this.onDidChangeTreeData = this.onChangeEvent.event;
    }

    get rootProject(): IFileTreeItem {
        return this._root;
    }

    set rootProject(val: IFileTreeItem) {
        this._root.rootProject = val;
        this.onChangeEvent.fire();
    }

    // Override
    public getTreeItem(element: IFileTreeItem): TreeItem {
        return element.getTreeItem();
    }

    // Override
    public getChildren(element?: IFileTreeItem): IFileTreeItem[] {
        let children = element ? element.getChildren() : this._root.getChildren();
        if (children) {
            return children;
        }
        return [];
    }
}

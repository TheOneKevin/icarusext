import { TreeItem } from 'vscode';

export interface IFileTreeItem {
    getChildren(): IFileTreeItem[];
    getTreeItem(): TreeItem;
}

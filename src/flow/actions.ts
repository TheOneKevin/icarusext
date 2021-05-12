import { Uri, window, workspace } from "vscode";
import { getTree } from "../extension";
import { Decorator, FlowAction, FlowTaskAction, NodeType } from "./nodebase";
import * as dct from "./decoratortypes";

export function flowAddFile(treeNode: FlowAction) {
    if(treeNode.type === NodeType.BENCH || treeNode.type === NodeType.DECORATOR) {
        let node = treeNode as Decorator;
        let data = node.data as dct.type_flist;
        window.showOpenDialog({
            canSelectFolders: false,
            canSelectMany: data.many || false,
            filters: data.filters,
            defaultUri: data.default
        }).then(e => {
            if(e) {
                data.update(e);
                getTree().refresh();
            }
        });
    }
}

export function addItem(treeNode: FlowAction) {
    if(treeNode.type === NodeType.DECORATOR) {
        let node = treeNode as Decorator;
        let data = node.data as dct.type_list;
        data.update(node).then(() => getTree().refresh);
    }
}

export function delItem(treeNode: FlowAction) {
    if(treeNode.type === NodeType.DECORATOR) {
        let data = (treeNode as Decorator).data as dct.type_litem;
        data.array.splice(data.index, 1);
        getTree().refresh();
    }
}

export function editPropBool(treeNode: FlowAction) {
    if(treeNode.type === NodeType.DECORATOR) {
        let data = (treeNode as Decorator).data as dct.type_bool;
        data.toggle();
        getTree().refresh();
    }
}

export function editPropString(treeNode: FlowAction) {
    if(treeNode.type === NodeType.DECORATOR) {
        let node = treeNode as Decorator;
        let data = node.data as dct.type_string;
        let str:string = data.get();
        window.showInputBox({
            value: str,
            valueSelection: [str.length, str.length],
            prompt: "Edit property string"
        }).then(e => {
            data.update(e === undefined ? data.get() : e);
            getTree().refresh();
        });
    }
}

export function chooseFile(treeNode: FlowAction) {
    if(treeNode.type === NodeType.DECORATOR) {
        let node = treeNode as Decorator;
        let data = node.data as dct.type_file;
        window.showOpenDialog({
            canSelectFolders: false,
            canSelectMany: false,
            filters: data.filters,
            defaultUri: data.default
        }).then(e => {
            if(e) {
                data.update(e[0]);
                getTree().refresh();
            }
        });
    }
}

export function runFlowTask(treeNode: FlowAction) {
    if(treeNode.type === NodeType.DECORATOR) {
        ((<Decorator> treeNode).data as dct.runnable).run();
    } else if(treeNode.type === NodeType.TASKACTION) {
        (treeNode as FlowTaskAction).run();
    }
}

export function stopFlowTask(treeNode: FlowAction) {
    if(treeNode.type === NodeType.DECORATOR) {
        ((<Decorator> treeNode).data as dct.runnable).tryStop();
    } else if(treeNode.type === NodeType.TASKACTION) {
        (treeNode as FlowTaskAction).tryStop();
    }
}

export function openFile(treeNode: FlowAction) {
    if(treeNode.type === NodeType.DECORATOR) {
        let data = (treeNode as Decorator).data as dct.openable;
        workspace.openTextDocument(Uri.file(data.file())).then(v => {
            window.showTextDocument(v);
        }, reason => {
            window.showErrorMessage("Open file failed: " + reason);
        });
    }
}

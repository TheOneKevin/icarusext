import { assert } from "console";
import { Uri, window, workspace } from "vscode";
import { getTree } from "../extension";
import * as ice40 from './arch/ice40const';
import { BenchRootAction, Decorator, FlowAction, FlowTaskAction, NodeType } from "./nodebase";
import { SynthYosysIce40 } from "./nodesynth";

export function flowAddFile(treeNode: FlowAction) {
    if(treeNode.type === NodeType.BENCH || treeNode.type === NodeType.DECORATOR) {
        let node = treeNode as Decorator;
        window.showOpenDialog({
            canSelectFolders: false,
            canSelectMany: node.data.many || false,
            filters: node.data.filters,
            defaultUri: node.data.default
        }).then(e => {
            if(e) {
                node.data.update(e);
                getTree().refresh();
            }
        });
    }
}

export function addItem(treeNode: FlowAction) {
    if(treeNode.type === NodeType.DECORATOR) {
        let node = treeNode as Decorator;
        node.data.update(node).then(() => getTree().refresh);
    }
}

export function delItem(treeNode: FlowAction) {
    if(treeNode.type === NodeType.DECORATOR) {
        let node = treeNode as Decorator;
        node.data.array.splice(node.data.index, 1);
        getTree().refresh();
    }
}

export function editPropBool(treeNode: FlowAction) {
    if(treeNode.type === NodeType.DECORATOR) {
        let node = treeNode as Decorator;
        node.data.toggle();
        getTree().refresh();
    }
}

export function editPropString(treeNode: FlowAction) {
    if(treeNode.type === NodeType.DECORATOR) {
        let node = treeNode as Decorator;
        let str:string = node.data.get();
        window.showInputBox({
            value: str,
            valueSelection: [str.length, str.length],
            prompt: "Edit property string"
        }).then(e => {
            node.data.update(e || "");
            getTree().refresh();
        });
    }
}

export function chooseFile(treeNode: FlowAction) {
    if(treeNode.type === NodeType.DECORATOR) {
        let node = treeNode as Decorator;
        window.showOpenDialog({
            canSelectFolders: false,
            canSelectMany: false,
            filters: node.data.filters,
            defaultUri: node.data.default
        }).then(e => {
            if(e) {
                node.data.update(e[0]);
                getTree().refresh();
            }
        });
    }
}

export function runFlowTask(treeNode: FlowAction) {
    if(treeNode.type === NodeType.DECORATOR) {
    } else if(treeNode.type === NodeType.TASKACTION) {
        (treeNode as FlowTaskAction).run();
    }
}

export function stopFlowTask(treeNode: FlowAction) {
    if(treeNode.type === NodeType.DECORATOR) {
    } else if(treeNode.type === NodeType.TASKACTION) {
        (treeNode as FlowTaskAction).tryStop();
    }
}

export function openFile(treeNode: FlowAction) {
    if(treeNode.type === NodeType.DECORATOR) {
        let node = treeNode as Decorator;
        workspace.openTextDocument(Uri.file(node.data.file)).then(v => {
            window.showTextDocument(v);
        }, reason => {
            window.showErrorMessage("Open file failed: " + reason);
        });
    }
}

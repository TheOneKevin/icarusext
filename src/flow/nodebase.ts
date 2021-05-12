<<<<<<< Updated upstream
import * as path from 'path';
import { ThemeIcon, TreeItem, TreeItemCollapsibleState, Uri, window, workspace } from "vscode";
import { getFriendlyPath } from '../common';
import { Configuration, IcarusProperties } from "../configurations";
import { getConfiguration, getTree } from "../extension";

export enum NodeType {
    UNKNOWN = 0,

    SYNTH,
    
    PNR, PACK,
    
    BENCH,
    BENCH_FILE,

    // Decorator properties
    DECORATOR, TASKACTION
};

export abstract class FlowAction extends TreeItem {
    type? : NodeType;
    constructor(label: string, collapsibleState?: TreeItemCollapsibleState,
        iconPath?: string | Uri | { light: string | Uri; dark: string | Uri } | ThemeIcon) {
        super(label, collapsibleState);
        this.iconPath = iconPath;
    }
    public abstract get children(): FlowAction[];
}

export interface IDecorator {
    label: string;
    state: TreeItemCollapsibleState;
    context?: string;
    icon?: ThemeIcon;
    type?: NodeType;
    children?: Decorator[];
    data?: any;
    description?: string;
    tooltip?: string;
}

export class Decorator extends FlowAction {
    private _children: Decorator[] = [];
    private _data?: any;
    constructor(conf: IDecorator) {
        super(conf.label, conf.state, conf.icon);
        this.contextValue = conf.context;
        this.type = conf.type || NodeType.DECORATOR;
        if(conf.children) {
            this.children.push(... conf.children);
        }
        this._data = conf.data;
        this.description = conf.description;
        this.tooltip = conf.tooltip || `${conf.label} ${conf.description || ""}`;
    }
    public get children(): Decorator[] { return this._children; }
    public get data(): any { return this._data; }
}

export abstract class FlowTaskAction extends FlowAction {
    contextValue = "flowtask";
    public abstract run(): Promise<any> | undefined;
    public abstract tryStop(): boolean | undefined;
}

export abstract class RootAction extends FlowAction {
    contextValue = "flowroot";
    constructor(label: string, collapsibleState?: TreeItemCollapsibleState, iconPath?: ThemeIcon) {
        super(label, collapsibleState, iconPath);
    }
}

export class PnrRootAction extends RootAction {
    type = NodeType.PNR;
    constructor() {
        super("Place and Route", TreeItemCollapsibleState.Expanded, new ThemeIcon("package"));
    }
    public get children() { return []; }
}

export class PackRootAction extends RootAction {
    type = NodeType.PACK;
    constructor() {
        super("Pack", TreeItemCollapsibleState.Expanded, new ThemeIcon("file-binary"));
    }
    public get children() { return []; }
}

export class BenchRootAction extends Decorator {    
    contextValue = "flowbench";
    constructor(man: IcarusProperties) {
        super({
            label: "Benches",
            state: TreeItemCollapsibleState.Expanded,
            icon: new ThemeIcon("beaker"),
            type: NodeType.BENCH,
            context: "type_flist"
        });
        if(!man || !man.configuration) { return; }
        let conf = man.configuration;
        conf.tb.forEach((v, i) => this.children.push(new Decorator({
            label: getFriendlyPath(man.wsroot?.fsPath, v),
            state: TreeItemCollapsibleState.None,
            tooltip: path.resolve(man.wsroot?.fsPath || "", v),
            icon: new ThemeIcon("file-code"),
            context: "openable runnable type_type_litem",
            data: {
                default: man.wsroot?.fsPath,
                update: (p: Uri[]) => p.forEach(e => {
                    if(path.isAbsolute(e.fsPath)) {
                        conf.synth.top.push(path.relative(man.wsroot?.fsPath || "", e.fsPath));
                    } else {
                        conf.synth.top.push(e.fsPath);
                    }
                }),
                file: path.resolve(man.wsroot?.fsPath || "", v),
                index: i, array: conf.tb
            }
        })));
    }
}
=======
import * as path from 'path';
import { ThemeIcon, TreeItem, TreeItemCollapsibleState, Uri } from "vscode";
import { getFriendlyPath } from '../common';
import { IcarusProperties } from "../configurations";
import * as dct from "./decoratortypes";

export enum NodeType {
    UNKNOWN = 0,
    SYNTH, PNR, PACK, BENCH,    
    // Decorator properties
    DECORATOR, TASKACTION
};

export interface IRunPromise {
    caller: FlowTaskAction;
    code: number | null;
    signal: NodeJS.Signals | null;
}

export type DecoratorOptions = INodeOptions & {
    children?: Decorator[];
    data?: any;
};

export interface INodeOptions {
    label: string;
    state: TreeItemCollapsibleState;
    context?: string;
    icon?: ThemeIcon;
    type?: NodeType;
    description?: string;
    tooltip?: string;
}

export abstract class FlowAction extends TreeItem {
    type? : NodeType;
    constructor(conf: INodeOptions) {
        super(conf.label, conf.state);
        this.iconPath = conf.icon;
        this.contextValue = conf.context;
        this.type = conf.type || NodeType.DECORATOR;
        this.description = conf.description;
        this.tooltip = conf.tooltip || `${conf.label} ${conf.description || ""}`;
    }
    public abstract get children(): FlowAction[];
}

export class Decorator extends FlowAction {
    private _children: Decorator[] = [];
    protected _data?: any;
    constructor(conf: DecoratorOptions) {
        super(conf);
        if(conf.children) {
            this.children.push(... conf.children);
        }
        this._data = conf.data;
    }
    public get children(): Decorator[] { return this._children; }
    public get data(): any { return this._data; }
}

export abstract class FlowTaskAction extends FlowAction {
    public abstract run(): Promise<IRunPromise> | undefined;
    public abstract tryStop(): boolean | undefined;
}

export class PnrRootAction extends FlowAction {
    type = NodeType.PNR;
    constructor() {
        super({
            label: "Place and Route",
            state: TreeItemCollapsibleState.Expanded,
            icon: new ThemeIcon("package")
        });
    }
    public get children() { return []; }
}

export class PackRootAction extends FlowAction {
    type = NodeType.PACK;
    constructor() {
        super({
            label: "Pack",
            state: TreeItemCollapsibleState.Expanded,
            icon: new ThemeIcon("file-binary")
        });
    }
    public get children() { return []; }
}

export class BenchRootAction extends Decorator {    
    constructor(man: IcarusProperties) {
        super({
            label: "Benches",
            state: TreeItemCollapsibleState.Expanded,
            icon: new ThemeIcon("beaker"),
            type: NodeType.BENCH,
            context: "type_flist"
        });
        if(!man || !man.configuration) { return; }
        let conf = man.configuration;
        this._data = <dct.type_flist> {
            many: true,
            default: man.wsroot,
            update: (p: Uri[]) => p.forEach(e => {
                if(path.isAbsolute(e.fsPath)) {
                    conf.tb.push(path.relative(man.wsroot?.fsPath || "", e.fsPath));
                } else {
                    conf.tb.push(e.fsPath);
                }
            }),
        };
        conf.tb.forEach((v, i) => this.children.push(new Decorator({
            label: getFriendlyPath(man.wsroot?.fsPath, v),
            state: TreeItemCollapsibleState.None,
            tooltip: path.resolve(man.wsroot?.fsPath || "", v),
            icon: new ThemeIcon("file-code"),
            context: "openable runnable type_litem",
            data: <dct.openable & dct.runnable & dct.type_litem> {
                default: man.wsroot?.fsPath,
                file: () => path.resolve(man.wsroot?.fsPath || "", v),
                index: i, array: conf.tb,
                run: () => {},
                tryStop: () => {}
            }
        })));
    }
}
>>>>>>> Stashed changes

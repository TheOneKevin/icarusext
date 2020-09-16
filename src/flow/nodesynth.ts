import { ChildProcess, exec } from 'child_process';
import * as path from 'path';
import { resolve } from 'path';
import treeKill = require('tree-kill');
import { ThemeIcon, TreeItemCollapsibleState, Uri, window } from "vscode";
import { getFriendlyPath } from '../common';
import { IcarusProperties, TaskConfig } from "../configurations";
import { getTree, globalOutput } from '../extension';
import * as ice40 from './arch/ice40const';
import { getSwitchOrder } from './arch/ice40const';
import { Decorator, FlowAction, FlowTaskAction, NodeType, RootAction } from './nodebase';

type RunPromise = {
    caller: SynthYosysIce40,
    code: number | null,
    signal: NodeJS.Signals | null
};

interface Inpout {
    inputs: string[];
    outputs: string[];
}

interface Returns {
    str: string;
    inputs: number[];
    outputs: number[];
}

function getIconFromFile(uri: string) {
    switch(path.extname(uri).toLowerCase()) {
        case '.json': return new ThemeIcon("file-code");
        case '.edif': case '.blif': return new ThemeIcon("file-binary");
        default: return new ThemeIcon("file");
    }
}

function getIconFromSwitch(cmd: string) {
    let match = cmd.match(/(\w+) .*/);
    if(!match || match.length < 2) {
        return new ThemeIcon("dash");
    }
    switch(match[1]) {
        case 'json': return new ThemeIcon("json");
        case 'edif': case 'blif': return new ThemeIcon("file-binary");
        default: return new ThemeIcon("dash");
    }
}

function doSubstitution(s: string, t: Inpout): Returns {
    // Substitute things like -json ${O:0}
    // ${O:0} = 0th output file specified
    let inp: number[] = [];
    let out: number[] = [];
    return {
        str: s.replace(/\$\{([^$]*)\}/, (m, ...g: string[]) => {
            if (!g || g.length < 1) {
                return m;
            }
            let m1 = g[0].match(/O:(\d+)/);
            let m2 = g[0].match(/I:(\d+)/);
            if (m1 && m1.length > 1) {
                let i = Number(m1[1]);
                // Bounds check
                if(i >= t.outputs.length) {
                    return m;
                }
                out.push(i);
                return t.outputs[i];
            } else if (m2 && m2.length > 1) {
                let i = Number(m2[1]);
                // Bounds check
                if(i >= t.inputs.length) {
                    return m;
                }
                inp.push(i);
                return t.inputs[i];
            }
            return m;
        }),
        inputs: inp,
        outputs: out
    };
}

function getNode(man: IcarusProperties, conf: TaskConfig): FlowTaskAction {
    if(conf.type.toLowerCase() === "yosys-ice40") {
        return new SynthYosysIce40(man, conf);
    }
    return new class extends FlowTaskAction {
        constructor() {
            super(conf.title, TreeItemCollapsibleState.None, new ThemeIcon("circle-slash"));
            this.tooltip = "Type: Unknown";
            this.description = "(Disabled)";
        }
        public get children() { return []; }
        public run() { return undefined; }
        public tryStop() { return true; }
    } ();
}

function parseRun(cmd: string | undefined): string {
    let s = "begin";
    let t = "end";
    let m = cmd?.match(/(\w+)?:(\w+)?/);
    if(m && m.length === 3) {
        s = m[1] || s;
        t = m[2] || t;
    }
    return `From ${s} to ${t}`;
}

export class SynthRootAction extends RootAction {
    private tasks: FlowAction[] = [];
    private decorations: FlowAction[] = [];
    private outputFiles: Uri[] = [];
    type = NodeType.SYNTH;
    constructor(man: IcarusProperties) {
        super("Synthesize", TreeItemCollapsibleState.Expanded, new ThemeIcon("circuit-board"));
        if(!man.configuration) { return; }        
        // Parse output files
        man.configuration.synth.outputs.forEach(e => {
            if(!man.wsroot) { return; }
            this.outputFiles.push(
                Uri.parse(path.resolve(man.wsroot.fsPath, e))
            );
        });
        // Decorations and tasks
        this.decorations.push(new Decorator({
            label: "Top level modules",
            state: TreeItemCollapsibleState.Collapsed,
            icon: new ThemeIcon("file-submodule"),
            context: "type_flist",
            data: { update: (p: Uri[]) => p.forEach(e => {
                if(path.isAbsolute(e.fsPath)) {
                    man.configuration?.synth.top.push(path.relative(man.wsroot?.fsPath || "", e.fsPath));
                } else {
                    man.configuration?.synth.top.push(e.fsPath);
                }
            })},
            children: man.configuration.synth.top.map((x, i) => new Decorator({
                label: getFriendlyPath(man.wsroot?.fsPath, x),
                tooltip: path.resolve(man.wsroot?.fsPath || "", x),
                state: TreeItemCollapsibleState.None,
                icon: new ThemeIcon("file-code"),
                context: "openable type_type_litem",
                data: {
                    file: path.resolve(man.wsroot?.fsPath || "", x),
                    index: i, array: man.configuration?.synth.top
                }
            }))
        }));
        man.configuration?.synth.tasks.forEach(t => {
            let n = getNode(man, t);
            this.tasks.push(n);
            this.decorations.push(n);
        });
    }
    public get children(): FlowAction[] { return this.decorations; }
}

export class SynthYosysIce40 extends FlowTaskAction {
    private decorations: Decorator[] = [];
    private man: IcarusProperties;
    private cfg: TaskConfig;
    type = NodeType.TASKACTION;
    contextValue = "runnable";
    constructor(man: IcarusProperties, t: TaskConfig) {
        super(t.title, TreeItemCollapsibleState.Expanded, new ThemeIcon("play"));
        this.tooltip = "Type: yosys-ice40";
        this.man = man;
        this.cfg = t;
        let outputs: number[] = []; // Get all the output indicies
        // We will be clever and update outputs[] as we parse the options
        this.decorations.push(
            new Decorator({
                label: "Command (yosys):",
                state: TreeItemCollapsibleState.None,
                icon: new ThemeIcon("server-process"),
                description: "synth_ice40"
            }),
            new Decorator({
                label: "Log file:",
                state: TreeItemCollapsibleState.None,
                icon: new ThemeIcon("output"),
                description: t.log || "None",
                tooltip: "Console log file location",
                context: "type_log type_file",
                data: {
                    default: man.wsroot,
                    update: (e: Uri) => this.cfg.log = e.fsPath,
                    file: path.resolve(man.wsroot?.fsPath || "", t.log || "")
                }
            }),
            new Decorator({
                label: "Run in workspace root?",
                state: TreeItemCollapsibleState.None,
                icon: new ThemeIcon("symbol-property"),
                description: t.runInRoot ? 'Yes' : 'No',
                context: "type_bool",
                data: { toggle: () => { t.runInRoot = !t.runInRoot; } }
            }),
            new Decorator({
                label: "Execute:",
                state: TreeItemCollapsibleState.None,
                icon: new ThemeIcon("symbol-property"),
                description: parseRun(t.run),
                context: "type_string",
                data: { update: (v: string) => { t.run = v; }, get: () => t.run }
            })
        );

        let opts = new Decorator({
            label: "Options",
            state: TreeItemCollapsibleState.Expanded,
            icon: new ThemeIcon("checklist"),
            context: "type_list",
            type: NodeType.DECORATOR,
            data: { update: () => new Promise<void>((resolve) => {
                ice40.pickOption(e => {
                    if(e) {
                        t.args?.push(e);
                        resolve();
                    }
                });
            })},
            children: t.args?.map<Decorator>((a, i, r) => {
                let sub = doSubstitution(a, {
                    inputs: [], outputs: man.configuration?.synth.outputs || []
                });
                // Update output file list
                outputs.push(...sub.outputs);
                return new Decorator({
                    label: sub.str,
                    state: TreeItemCollapsibleState.None,
                    icon: getIconFromSwitch(a),
                    context: "type_type_litem",
                    tooltip: ice40.getTooltipFromSwitch(a),
                    data: {  index: i, array: t.args }
                });
            }) // End children
        }); // End options

        opts.children.sort((a, b) => {
            if(!a.label || !b.label) { return 1; }
            let oa = getSwitchOrder(a.label);
            let ob = ice40.getSwitchOrder(b.label);
            if(oa === 100 && ob === 100) {
                if(a.label < b.label) { return -1; }
                if(a.label > b.label) { return 1; }
            }
            return oa - ob;
        });
        this.decorations.push(opts);

        // Deduce the outputs from the result
        if(!man.configuration) { return; }
        let conf = man.configuration;
        this.decorations.push(new Decorator({
            label: "Output Files",
            state: TreeItemCollapsibleState.Collapsed,
            icon: new ThemeIcon("files"),
            tooltip: "Output Files (Automatic detection)",
            children: outputs.map<Decorator>(i => new Decorator({
                label: getFriendlyPath(man.wsroot?.fsPath, conf.synth.outputs[i]),
                tooltip: path.resolve(man.wsroot?.fsPath || "", conf.synth.outputs[i]),
                state: TreeItemCollapsibleState.None,
                icon: getIconFromFile(conf.synth.outputs[i]),
                context: "openable",
                data: { file: path.resolve(man.wsroot?.fsPath || "", conf.synth.outputs[i]) }
            }))
        }));

        // Disposables
        getTree().subscribe(() => {
            if(this.proc) {
                treeKill(this.proc.pid);
            }
        });
    }

    protected compileCommand(): string {
        let logFile : string|undefined = this.cfg.log;
        if(this.cfg.log && this.man.wsroot && path.isAbsolute(this.cfg.log)) {
            logFile = path.relative(this.man.wsroot.fsPath, this.cfg.log);
        }
        let doLog = logFile ? ` -o ${logFile}` : "";
        let opts = "";
        this.cfg.args?.forEach(x => {
            opts += ' -' + doSubstitution(x, {
                inputs: [], outputs: this.man.configuration?.synth.outputs || []
            }).str;
        });
        // Don't worry about the spaces, they're accounted for ;)
        return `yosys -QT -p "tee -q${doLog} synth_ice40${opts}; stat" ${this.man.configuration?.synth.top || ""}`;
    }
    public get children(): Decorator[] { return this.decorations; }

    private proc : ChildProcess | undefined;
    public run(): Promise<RunPromise> | undefined {
        if(this.proc) {
            window.showErrorMessage(`A process is already running: ${this.proc.spawnfile}`);
            return;
        }
        this.iconPath = new ThemeIcon('ellipsis');
        this.label = 'Running...';
        getTree().refresh(true);
        let cmd = this.compileCommand();
        globalOutput().show();
        globalOutput().appendLine('> ' + cmd);
        this.proc = exec(cmd, { cwd: this.man.wsroot?.fsPath });
        this.proc.stdout?.on("data", d => globalOutput().append(d));
        this.proc.stderr?.on("data", d => globalOutput().append(d));
        return new Promise<RunPromise> ((accept) => {
            this.proc?.on("exit", (c, s) => {
                this.proc?.stdout?.destroy();
                this.proc?.stderr?.destroy();
                this.proc = undefined;
                accept({ caller: this, code: c, signal: s });
                globalOutput().appendLine(`Task finished with exit code ${c}`);
                this.label = this.cfg.title;
                this.iconPath = new ThemeIcon('play');
                getTree().refresh(true);
            });
        });
    }
    public tryStop(): boolean | undefined {
        getTree().refresh(true);
        if(!this.proc) {
            window.showWarningMessage(`No processes are running`);
        }
        return this.proc?.kill();
    }
}

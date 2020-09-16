import { Disposable, Event, EventEmitter, ProviderResult, TreeDataProvider, TreeItem, workspace } from "vscode";
import { getConfiguration } from "../extension";
import { BenchRootAction, FlowAction, PackRootAction, PnrRootAction } from "./nodebase";
import { SynthRootAction } from "./nodesynth";
type func = () => void;

export interface ITreeConsts {
    yosys_path?: string;
}

export class FlowTreeProvider implements TreeDataProvider<FlowAction> {
    private onChangeEvent: EventEmitter<FlowAction | undefined | void>;
    readonly onDidChangeTreeData: Event<FlowAction | undefined | void>;
    private subscribedResources: func[] = [];
    private softReset: boolean = false;
    private roots: FlowAction[] = [];
    private _config: ITreeConsts = { };

    constructor() {
        this.onChangeEvent = new EventEmitter<FlowAction | undefined | void>();
        this.onDidChangeTreeData = this.onChangeEvent.event;
        workspace.onDidChangeConfiguration(this.refreshConfig);
        this.refreshConfig();
    }

    public getTreeItem(element: FlowAction): TreeItem | Thenable<TreeItem> {
        return element;
    }

    public getChildren(element?: FlowAction): ProviderResult<FlowAction[]> {
        if(!getConfiguration().configuration) {
            return [];
        }
        // Get root nodes
        if(!element) {
            if(!this.softReset) {
                this.roots = [
                    new SynthRootAction(getConfiguration()),
                    new PnrRootAction(),
                    new PackRootAction(),
                    new BenchRootAction(getConfiguration())
                ];
            }
            this.softReset = false;
            return this.roots;
        }
        // Return precompiled children
        return element.children;
    }

    public refresh(soft?: boolean) {
        // Reload
        if(soft !== undefined) {
            this.softReset = soft;
        }
        if(!this.softReset) {
            // ! Don't free resources if it's a soft reset ! //
            this.freeResources();
        }
        setTimeout(() => this.onChangeEvent.fire(), 100);
    }

    public freeResources() {
        // Dispose all objects/node resources
        this.subscribedResources.forEach(x => x());
        this.subscribedResources = [];
    }

    public subscribe(dispose: func) {
        if(this.subscribedResources.length > 500) {
            this.freeResources();
        }
        this.subscribedResources.push(dispose);
    }

    private refreshConfig() {
        this._config = {

        };
    }

    public get config() {
        return this._config;
    }
}
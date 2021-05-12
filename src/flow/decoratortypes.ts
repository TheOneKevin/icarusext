import { Uri } from "vscode";
import { FlowAction, IRunPromise } from "./nodebase";

// Typesafe declarations of .data field

export type type_flist = {
    update: (p: Uri[]) => void;
    many?: boolean | undefined,
    default?: Uri | undefined,
    filters?: {[name:string]:string[]} | undefined
};

export type openable = {
    file: () => string
};

export type type_litem = {
    index: number, array: any[]
};

export type type_file = {
    update: (e: Uri) => void,
    default?: Uri | undefined,
    filters?: {[name:string]:string[]} | undefined
};

export type type_bool = {
    toggle: () => void
};

export type type_string = {
    update: (v: string) => void,
    get: () => string
};

export type type_list = {
    update: (self?:FlowAction) => Promise<void>;
};

export type runnable = {
    run: () => Promise<IRunPromise> | undefined;
    tryStop: () => boolean | undefined;
};

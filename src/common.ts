import * as path from 'path';
import * as vscode from 'vscode';

// Constants
export const GLOBAL_CHANNEL = "Icarus SynthFlow Output";
export const TSIZER_CHANNEL = "Icarus Tsizer Output";
export const RUNNER_CHANNEL = "Icarus Runner Output";
export const OPTION_OPEN = "Open in GTKWave";

export function getWorkspaceCwd(fileUri: vscode.Uri | null = null): string {
    if (!fileUri) {
        // TODO: Something goes here
        return "";
    }

    let cwd: string = vscode.workspace.getWorkspaceFolder(fileUri)?.uri.fsPath || "";
    if (!cwd) {
        cwd = path.dirname(fileUri.fsPath);
    }
    return cwd;
}

export function getFriendlyPath(root: string | undefined, v: string): string {
    if(!root) { return v; }
    let name = path.normalize(v).split(path.sep).join(path.posix.sep);
    if(path.isAbsolute(v)) {
        name = path.relative(root, v).split(path.sep).join(path.posix.sep);
    }
    return name;
}

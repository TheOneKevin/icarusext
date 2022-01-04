import { readFileSync } from 'fs';
import { Uri } from 'vscode';
import * as YAML from 'yaml';

export class Project {
    files: Uri[] = [];

    private constructor() { }

    /**
     * Initializes typed Project from a serialized untyped object.
     * @param path Path to project YAML
     * @returns Deserialized object
     */
    static parse(path: Uri): Project | undefined {
        const file = readFileSync(path.fsPath, 'utf-8');
        let obj = YAML.parse(file);
        if (obj == undefined) {
            return undefined;
        }

        // Deserialize obj
        let project = new Project();
        if (!Array.isArray(obj.files)) {
            return undefined;
        }
        for (let file of obj.files) {
            if (typeof file !== 'string') {
                return undefined;
            }
            project.files.push(Uri.parse(file));
        }
        return project;
    }
}
class FileErrorObject extends Error {
    public constructor(private _path: string, private _msg: string) {
        super(_msg);
    }
    public get path() { return this._path; }
    public toString = (): string => {
        return `Error: ${this._msg}`;
    }
}

export function FileError(_path: string, _msg: string) {
    return new FileErrorObject(_path, _msg);
}

import { readFile } from 'fs';
import { Uri } from 'vscode';
import * as YAML from 'yaml';

export class IPCore {

}

/**
 * Parse CAPI2 string expressions that follow this grammar:
 * 
 * exprs        ::= expr | expr exprs
 * expr         ::= word | conditional
 * word         ::= WORD
 * conditional  ::= condition TERNARY LPAREN exprs RPAREN
 * condition    ::= word | NOT word
 * WORD         = [a-zA-Z0-9:<>.\[\]_-,=~/^+]+
 * NOT          = !
 * LPAREN       = (
 * RPAREN       = )
 * TERNARY      = ?
 * 
 * @param expr Expression string
 */
function parse_expression(expr: string) {

}

function parse_filesets() {

}

function parse_targets() {

}

function parse(path: Uri) {
    readFile(path.fsPath, 'utf-8', (e, d) => {
        YAML.parse(d);
    });
}
// ICE40 constants

import { QuickPickItem, window } from "vscode";

// Reference: http://www.clifford.at/yosys/cmd_synth_ice40.html
const map: Map<string, {num: number, text: string}> = new Map([
    ["top",         { num: 0, text: "Use the specified module as top module." }],
    ["blif",        { num: 1, text: "Write the design to the specified BLIF file." }],
    ["edif",        { num: 2, text: "Write the design to the specified EDIF file." }],
    ["json",        { num: 3, text: "Write the design to the specified JSON file." }],
    //["run", "Only run the commands between the labels."],
    ["noflatten",   { num: 4, text: "Do not flatten design before synthesis" }],
    ["retime",      { num: 5, text: "Run 'abc' with -dff option" }],
    ["relut",       { num: 6, text: "Combine LUTs after synthesis" }],
    ["nocarry",     { num: 7, text: "Do not use SB_CARRY cells in output netlist" }],
    ["nodffe",      { num: 8, text: "Do not use SB_DFFE* cells in output netlist" }],
    ["dffe_min_ce_use", { num: 9, text: "Do not use SB_DFFE* cells if the resulting CE line would go to less" + "\nthan min_ce_use SB_DFFE*in output netlist" }],
    ["nobram",      { num:10, text: "Do not use SB_RAM40_4K* cells in output netlist" }],
    ["dsp",         { num:11, text: "Use iCE40 UltraPlus DSP cells for large arithmetic" }],
    ["noabc",       { num:12, text: "Use built-in Yosys LUT techmapping instead of abc" }],
    ["abc2",        { num:13, text: "Run two passes of 'abc' for slightly improved logic density" }],
    ["vpr",         { num:14, text: "Generate an output netlist (and BLIF file) suitable for VPR" + "\n(this feature is experimental and incomplete)" }]
]);

let qitems: QuickPickItem[] = [];
map.forEach((v, k) => qitems.push({ label: k, detail: v.text }));

export function getTooltipFromSwitch(sw: string): string {
    return map.get(sw.split(' ')[0])?.text || "";
}

export function getSwitchOrder(sw: string): number {
    return map.get(sw.split(' ')[0])?.num || 100;
}

export function pickOption(f: (x:string|undefined)=>void) {
    let qp = window.createQuickPick();
    qp.canSelectMany = false;
    qp.items = qitems;
    qp.matchOnDetail = true;
    qp.step = 1;
    qp.title = "Choose a configuration option.";
    qp.show();
    qp.onDidAccept(() => {
        let first = qp.selectedItems[0].label;
        switch(first) {
            case "top": case "blif": case "edif": case "json": case "dffe_min_ce_use":
                break;
            default:
                f(first);
                qp.dispose();
                return;
        }
        window.showInputBox({
            value: first + ' args',
            valueSelection: [ first.length+1, first.length+5 ],
            prompt: "Complete the command by specifying the argument requested.\nHint: Use ${O:n} to reference the nth output file."
        }).then(e => f(e));
        qp.dispose();
    });
}

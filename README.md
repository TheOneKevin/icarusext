# Icarus Verilog Testbench Runner

A simple extension to run single file Icarus Verilog testbenches with GTKWave integration. Hassle-free, portable, easy to configure. Combines the best bits of everything out there.

## Usage

This extension adds two buttons, which will appear in the titlebar of any Verilog file, and a status item positioned in the lower-right corner.

## Features



## Configuration

- `verilog.gtkwaveWatchGlob`: GTKWave will be summoned when a file satisfying the glob is created (glob is relative to the build directory).
- `verilog.icarusCompileArguments`: Arguments passed to Verilog compiler.
- `verilog.icarusBuildDirectory`: Build folder path relative to workspace root.
- `verilog.icarusPersistentBuild`: True if build folder should not be cleared before each compilation.

## Commands

- `icarusext.run` : Compiles and runs current file
- `icarusext.stop` : Stops and kills any running processes.
- `icarusext.tsizer` : Obtains **very rough** estimates for logic components. Will run on these events:
    - `window.onDidChangeActiveTextEditor`
    - `workspace.onDidSaveTextDocument`
    - Status item click (will show modal in this case)
    - When command `icarusext.run` is run

## License

Code is licensed under MIT.

> "Logo made by Freepik from www.flaticon.com (Flaticon license with attribution)"

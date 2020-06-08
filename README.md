# Icarus Verilog Testbench Runner

A simple extension to run single file Icarus Verilog testbenches with GTKWave integration. Hassle-free, portable, easy to configure. Combines the best bits of everything out there.

## Usage

Two buttons will appear in the titlebar of any Verilog file.

## Configuration

- `verilog.gtkwaveWatchGlob`: GTKWave will be summoned when a file satisfying the glob is created (glob is relative to the build directory).
- `verilog.icarusCompileArguments`: Arguments passed to Verilog compiler.
- `verilog.icarusBuildDirectory`: Build folder path relative to workspace root.

## Commands

- `icarusext.run` : Compiles and runs current file
- `icarusext.stop` : Stops and kills any running processes.

## License

> "Logo made by Freepik from www.flaticon.com (Flaticon license with attribution)"

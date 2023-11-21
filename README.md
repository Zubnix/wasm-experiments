Implementation of a dynamic wasm linker, based on the spec used by llvm: https://github.com/WebAssembly/tool-conventions/blob/main/DynamicLinking.md

# Building
You'll need at least llvm 17, adjust the `Makefile` as needed to point to the correct binaries, then simply run
```shell
make
```

# Running

```shell
python3 -m http.server
```
import {LDWasm} from "./LDWasm.mjs";

async function main() {
    // FIXME we have to use a single shared memory object because llvm doesn't support wasm multi-memory yet.
    const ld = new LDWasm(
        new WebAssembly.Memory({initial: 1024, shared: true, maximum: 10240}))

    new Worker('process.mjs', {type: 'module'})
        .postMessage({exec: await ld.load('toy_app_a.wasm')})

    new Worker('process.mjs', {type: 'module'})
        .postMessage({exec: ld.load('toy_app_a.wasm')})
}

window.onload = main

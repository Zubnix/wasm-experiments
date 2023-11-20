function main() {
    // FIXME we have to use a single shared memory object because llvm doesn't support wasm multi-memory yet.
    const memory = new WebAssembly.Memory({initial: 1024, shared: true, maximum: 10240});
    const process_a = new Worker('process.mjs', {type: 'module'})
    process_a.postMessage({ path: 'toy_app_a.wasm', memory })
}

window.onload = main

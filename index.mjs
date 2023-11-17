// based on https://github.com/ids1024/wasm-dynamic-test/blob/master/wasm.js

'use strict'

// Default value wasm-ld uses; equal to WasmPageSize
const STACK_SIZE = 64 * 1024;
const utf8Decoder = new TextDecoder("utf-8")

/** Round 'num' up so it is aligned to a multiple of 'align' */
function roundUpAlign(num, align) {
    if (align === 0 || num % align === 0) {
        return num;
    }
    return num + align - num % align;
}

/** Reads a 'varint32' integer, which is based on the variable-length encoding LEB128  */
function readVaruint32(array, idx) {
    let value = 0;
    let count = 0;
    while (count < 5) {
        const b = array[idx + count];
        value |= (b & 0x7f) << (7 * count);
        count++;
        if ((b & 0x80) === 0) {
            break;
        }
    }
    return [value, idx + count];
}

/** Extracts the "dylib" Custom section from WebAssembly module, and parses it into an object.  */
function parseDylink(module) {
    const section = WebAssembly.Module.customSections(module, "dylink");
    const array = new Uint8Array(section[0]);

    let idx = 0;

    let memorysize
    let memoryalignment
    let tablesize
    let tablealignment
    let needed_dynlibs_count;

    [memorysize, idx] = readVaruint32(array, idx);
    [memoryalignment, idx] = readVaruint32(array, idx);
    [tablesize, idx] = readVaruint32(array, idx);
    [tablealignment, idx] = readVaruint32(array, idx);
    [needed_dynlibs_count, idx] = readVaruint32(array, idx);

    const needed_dynlibs = [];
    for (let i = 0; i < needed_dynlibs_count; i++) {
        let length;
        [length, idx] = readVaruint32(array, idx);
        const path = utf8Decoder.decode(array.slice(idx, idx + length));
        needed_dynlibs.push(path);
        idx += length;
    }

    return {
        memorysize,
        memoryalignment,
        tablesize,
        tablealignment,
        needed_dynlibs
    };
}

class WasmLoader {
    constructor(imports) {
        this.dynamic_libraries = {};
        this.memory = new WebAssembly.Memory({initial: 1024});
        this.__indirect_function_table = new WebAssembly.Table({element: "anyfunc", initial: 0});
        this.__stack_pointer = new WebAssembly.Global({value: "i32", mutable: true}, STACK_SIZE);
        this.__memory_base = STACK_SIZE;
        this.__table_base = 0;
        this.imports = imports;
    }

    #makeEnv() {
        return {
            memory: this.memory,
            __indirect_function_table: this.__indirect_function_table,
            __stack_pointer: this.__stack_pointer,
            __memory_base: this.__memory_base,
            __table_base: this.__table_base,
            ...this.imports
        };
    }

    async loadModule(path) {
        if (this.dynamic_libraries[path] !== undefined) {
            return this.dynamic_libraries[path];
        }

        const module = await WebAssembly.compileStreaming(fetch(path));
        const dylink = parseDylink(module);

        const dynlibs = [];
        for (let path of dylink.needed_dynlibs) {
            dynlibs.push(await this.loadModule(path));
        }

        const env = this.#makeEnv();
        env.__memory_base = roundUpAlign(env.__memory_base, dylink.memoryalignment);
        env.__table_base = roundUpAlign(env.__table_base, dylink.tablealignment);
        for (const library of dynlibs) {
            Object.assign(env, library.exports);
        }

        // Update values that will be used by next module
        this.__memory_base = env.__memory_base + dylink.memorysize;
        this.__table_base = env.__table_base + dylink.tablesize;

        this.__indirect_function_table.grow(this.__table_base - this.__indirect_function_table.length);

        const instance = await WebAssembly.instantiate(module, {env: env});
        if(instance.exports.__wasm_call_ctors) {
            instance.exports.__wasm_call_ctors();
        }
        this.dynamic_libraries[path] = instance;
        return instance;
    }
}

function print_int(num) {
    // console.log(num.toString());
}

function print_str(addr) {
    // const buf = new Uint8Array(wasm.memory.buffer).slice(addr);
    // console.log(buf.slice(0, buf.indexOf(0)));
}

async function main() {
    const wasmLoader = new WasmLoader({print_int: print_int, print_str: print_str});
    await wasmLoader.loadModule('toy_kernel.wasm')
    await wasmLoader.loadModule('toy_app_a.wasm')
}

window.onload = main

//wasm.loadModule("bin.wasm").then(instance => instance.exports.main());

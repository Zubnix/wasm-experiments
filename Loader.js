// based on https://github.com/ids1024/wasm-dynamic-test/blob/master/wasm.js

'use strict'

// Default value wasm-ld uses; equal to WasmPageSize
const STACK_SIZE = 64 * 1024;
const utf8Decoder = new TextDecoder("utf-8")

/** Round 'num' up, so it is aligned to a multiple of 'align' */
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
    let memorySize
    let memoryAlignment
    let tableSize
    let tableAlignment

    let neededDynlibs = []

    const section = WebAssembly.Module.customSections(module, "dylink.0");
    let array = new Uint8Array(section[0]);

    let idx = 0
    while (idx < array.byteLength) {
        const type = array[idx++]
        let length
        [length, idx] = readVaruint32(array, idx)
        const end = idx + length
        const payload = array.subarray(idx, end)
        idx = end

        switch (type) {
            case 1: { // WASM_DYLINK_MEM_INFO
                let subIdx = 0;
                // begin readign actual data
                [memorySize, subIdx] = readVaruint32(payload, subIdx);
                [memoryAlignment, subIdx] = readVaruint32(payload, subIdx);
                [tableSize, subIdx] = readVaruint32(payload, subIdx);
                [tableAlignment, subIdx] = readVaruint32(payload, subIdx);
                break;
            }
            case 2: { // WASM_DYLINK_NEEDED
                let subIdx = 0;
                let neededDynlibsCount
                [neededDynlibsCount, subIdx] = readVaruint32(payload, subIdx);
                for (let i = 0; i < neededDynlibsCount; i++) {
                    let length;
                    [length, subIdx] = readVaruint32(payload, subIdx);
                    let path = utf8Decoder.decode(payload.subarray(subIdx, subIdx + length));
                    neededDynlibs.push(path);
                    subIdx += length;
                }
                break;
            }
            case 3: { // WASM_DYLINK_EXPORT_INFO
                break;
            }
            case 4: { // WASM_DYLINK_IMPORT_INFO
                break;
            }
        }
    }

    return {
        memorySize,
        memoryAlignment,
        tableSize,
        tableAlignment,
        neededDynlibs
    };
}

export class Loader {
    constructor(memory, imports = {}) {
        this.dynamicLibraries = {};
        this.memory = memory
        this.__indirect_function_table = new WebAssembly.Table({element: "anyfunc", initial: 0});
        this.__stack_pointer = new WebAssembly.Global({value: "i32", mutable: true}, STACK_SIZE);
        this.__memory_base = STACK_SIZE;
        this.__table_base = 0;
        this.imports = imports;
    }

    #makeEnv(dynLibs, neededFunctionImports) {
        const exportEntries = dynLibs.flatMap(dynLib => Object.entries(dynLib.exports))
            .filter(([exportedFunction])=>neededFunctionImports.includes(exportedFunction))
        const importedExports = Object.fromEntries(exportEntries)
        return {
            memory: this.memory,
            __indirect_function_table: this.__indirect_function_table,
            __stack_pointer: this.__stack_pointer,
            __memory_base: this.__memory_base,
            __table_base: this.__table_base,
            ...this.imports,
            ...importedExports
        };
    }

    async load(path) {
        if (this.dynamicLibraries[path] !== undefined) {
            return this.dynamicLibraries[path];
        }

        const module = await WebAssembly.compileStreaming(fetch(path));
        const dylink = parseDylink(module);
        const dynLibs = []
        for (const neededDynlib of dylink.neededDynlibs) {
            dynLibs.push(await this.load(neededDynlib))
        }

        // TODO import for globals?
        const neededFunctionImports = WebAssembly.Module.imports(module)
            .filter(importEntry => importEntry.module === 'env' && importEntry.kind === 'function')
            .map(importEntry => importEntry.name)

        const env = this.#makeEnv(dynLibs, neededFunctionImports);
        env.__memory_base = roundUpAlign(env.__memory_base, dylink.memoryAlignment);
        env.__table_base = roundUpAlign(env.__table_base, dylink.tableAlignment);

        // Update values that will be used by next module
        this.__memory_base = env.__memory_base + dylink.memorySize;
        this.__table_base = env.__table_base + dylink.tableSize;

        this.__indirect_function_table.grow(this.__table_base - this.__indirect_function_table.length);

        const instance = await WebAssembly.instantiate(module, {env});
        if (instance.exports.__wasm_apply_data_relocs) {
            instance.exports.__wasm_apply_data_relocs()
        }
        if (instance.exports.__wasm_call_ctors) {
            instance.exports.__wasm_call_ctors();
        }
        this.dynamicLibraries[path] = instance;
        return instance;
    }
}
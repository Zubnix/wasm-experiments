import { Loader } from "./Loader.js";

const textDecoder = new TextDecoder()

async function main() {
    const memory = new WebAssembly.Memory({initial: 1024, maximum: 10240})
    const loader = new Loader(memory, { println: (messagePtr) => {
        const uint8Memory = new Uint8Array(memory.buffer);
        let size = 0;
        while(uint8Memory[messagePtr+size] !== 0) {
            size++
        }
        const message = uint8Memory.subarray(messagePtr, messagePtr+size);
        console.log(textDecoder.decode(message))
    }})
    const instance = await loader.load('toy_app.wasm')
    if (instance.exports.main) {
        instance.exports.main()
    }
}

window.onload = main

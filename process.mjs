import {LDWasm} from './LDWasm.mjs';

async function initialize({ path, memory, imports }) {
    const loader = new LDWasm(memory, imports)
    const instance = await loader.load(path)
    if (instance.exports.main) {
        instance.exports.main()
    }
}

self.onmessage = ((event) => {
        initialize(event.data)
})
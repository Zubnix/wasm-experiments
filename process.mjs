import {initialize} from './LDWasm.mjs';

async function exec({ module, env }) {
    const instance = await initialize({ module, env })
    if (instance.exports.main) {
        instance.exports.main()
    }
}

self.onmessage = ((event) => {
        exec(event.data.exec)
})
# needs at least llvm17
CLANG = clang-18
LD = wasm-ld-18

CFLAGS = --target=wasm32-unknown-unknown -matomics -mmutable-globals -mbulk-memory -std=c11 -nostdlib -fvisibility=hidden -shared

all: toy_kernel.wasm toy_app_a.wasm toy_app_b.wasm

toy_kernel.wasm: toy_kernel.c
	$(CLANG) -o $@ $(CFLAGS) -fPIC -Wl,--no-entry -Wl,--shared-memory -Wl,--import-memory $<

toy_app_a.wasm: toy_app_a.c
	$(CLANG) -o $@ $(CFLAGS) -e main -Wl,toy_kernel.wasm -Wl,--shared-memory -Wl,--import-memory $<

toy_app_b.wasm: toy_app_b.c
	$(CLANG) -o $@ $(CFLAGS) -e main -Wl,toy_kernel.wasm -Wl,--shared-memory -Wl,--import-memory $<

clean:
	rm *.wasm
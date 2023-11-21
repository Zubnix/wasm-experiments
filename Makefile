# needs at least llvm17
CLANG = clang-17
LD = wasm-ld-17

CFLAGS = --target=wasm32-unknown-unknown -matomics -mmutable-globals -mbulk-memory -std=c11 -nostdlib -fvisibility=hidden -shared

all: toy_lib.wasm toy_app.wasm

toy_lib.wasm: toy_lib.c
	$(CLANG) -o $@ $(CFLAGS) -fPIC -Wl,--no-entry -Wl,--import-memory $<

toy_app.wasm: toy_app.c
	$(CLANG) -o $@ $(CFLAGS) -e main -Wl,toy_lib.wasm -Wl,--import-memory $<

clean:
	rm *.wasm
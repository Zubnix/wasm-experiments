# needs at least llvm17
CLANG = clang-18
LD = wasm-ld-18

CFLAGS = --target=wasm32-unknown-unknown -matomics -mmutable-globals -std=c11 -nostdlib

all: toy_kernel.wasm toy_app_a.wasm

toy_kernel.wasm: toy_kernel.c
	$(CLANG) -o $@ $(CFLAGS) -fPIC -fvisibility=hidden -shared -Wl,--no-entry $<

toy_app_a.wasm: toy_app_a.c
	$(CLANG) -o $@ $(CFLAGS) -fvisibility=hidden -shared -e main -Wl,toy_kernel.wasm $<

clean:
	rm *.wasm
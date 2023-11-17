# needs at least llvm17
CLANG = clang
LLC = llc
LD = wasm-ld

CFLAGS = --target=wasm32 -matomics -mmutable-globals -std=c11 -nostdlib

all: toy_kernel.wasm toy_app_a.wasm

toy_kernel.wasm: toy_kernel.c
	$(CLANG) -o $@ $(CFLAGS) -fPIC -fvisibility=hidden -shared -Wl,--no-entry -Wl,--experimental-pic $<

toy_app_a.wasm: toy_app_a.c
	$(CLANG) -o $@ $(CFLAGS) -e main -Ltoy_kernel.wasm -Wl,--unresolved-symbols=import-dynamic $<

clean:
	rm *.wasm
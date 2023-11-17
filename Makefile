# needs at least llvm17

CLANG = clang
LLC = llc
LD = wasm-ld

CFLAGS = --target=wasm32 -matomics -mmutable-globals -std=c11 -nostdlib

all: toy_kernel.wasm toy_app_sum_requestor.wasm

toy_kernel.wasm: toy_kernel.c
	$(CLANG) -o $@ $(CFLAGS) -fPIC -fvisibility=hidden -shared -Wl,--no-entry -Wl,--experimental-pic $<

toy_app_sum_requestor.wasm: toy_app_sum_requestor.c
	$(CLANG) -o $@ $(CFLAGS) -e main -Wl,--unresolved-symbols=import-dynamic $<

clean:
	rm *.wasm
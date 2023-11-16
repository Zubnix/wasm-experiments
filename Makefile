CLANG = clang-18
LLC = llc-18
LD = wasm-ld-18

all: toy_kernel.wasm toy_app_sum_requestor.wasm

toy_kernel.ll: toy_kernel.c
	$(CLANG) --target=wasm32 -emit-llvm -matomics -mmultimemory -mmutable-globals -c -S -std=c99 -fPIC -o $@ -nostdlib $<

toy_kernel.o: toy_kernel.ll
	$(LLC) -march=wasm32 --relocation-model=pic -filetype=obj -o $@ $<

toy_kernel.wasm: toy_kernel.o
	$(LD) --shared --experimental-pic -o $@ $^

toy_app_sum_requestor.ll: toy_app_sum_requestor.c
	$(CLANG) --target=wasm32 -emit-llvm -matomics -mmultimemory -mmutable-globals -c -S -std=c99 -o $@ -nostdlib $<

toy_app_sum_requestor.o: toy_app_sum_requestor.ll
	$(LLC) -march=wasm32 -filetype=obj -o $@ $<

toy_app_sum_requestor.wasm: toy_app_sum_requestor.o toy_kernel.wasm
	$(LD) --entry=main -o $@ $^

clean:
	rm *.o *.ll *.wasm
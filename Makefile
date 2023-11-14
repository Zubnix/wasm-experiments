CLANG = clang
LLC = llc
LD = wasm-ld

APP_SRC = app.c
APP_OBJ_SRC := $(patsubst %.c, %.o, $(APP_SRC))

KERNEL_SRC = kernel.c
KERNEL_OBJ_SRC := $(patsubst %.c, %.o, $(KERNEL_SRC))

all: kernel app

%.ll: %.c
	$(CLANG) \
		--target=wasm32	\
		-emit-llvm \
		-c \
		-S \
		-std=c99 \
		-o $@ \
		-nostdlib \
		$<

%.o: %.ll
	$(LLC) \
		-march=wasm32 \
		-filetype=obj \
		$<

app: $(APP_OBJ_SRC)
	$(LD) \
		--no-entry \
		--strip-all \
		--import-memory \
		--export=__heap_base \
		-o $@ \
		$^

kernel: $(KERNEL_OBJ_SRC)
	$(LD) \
		--no-entry \
		--strip-all \
		--import-memory \
		--export=__heap_base \
		-o $@ \
		$^
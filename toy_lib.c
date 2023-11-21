#include "toy_lib.h"

#define EXPORT __attribute__((visibility("default")))

EXPORT
void get_toy_message(char **message) {
    *message = "Hello from the other side.";
}
#include "toy_lib.h"

extern void println(char* message);

int main(void) {
    char *message;
    get_toy_message(&message);
    println(message);
}

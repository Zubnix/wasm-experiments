#include "toy_kernel.h"

int main(void) {
    int user_sum;
    int a = 0;
    int b = 0;
    for (int i = 0; i < 100; ++i) {
        _syscall_request_sum(&user_sum, a, b);
        a++;
        b++;
    }
    return 0;
}

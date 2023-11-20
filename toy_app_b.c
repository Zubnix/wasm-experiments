#include "toy_kernel.h"

int main(void) {
    for (int i = 0; i < 100; ++i) {
        int user_addends[2];
        _syscall_notify_request_sum(user_addends);
        _syscall_put_sum(user_addends[0]+user_addends[1]);
    }
    return 0;
}

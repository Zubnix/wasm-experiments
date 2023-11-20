#include "toy_kernel.h"

int addends[2];
int addends_fence = 0;

int sum = 0;
int sum_fence = 0;

#define TOY_EXPORT __attribute__((visibility("default")))

/**
 * \brief Request to calculate the sum of 2 numbers and block until the result is available.
 * \param user_sum process memory where the rsult of the sum will be stored
 * \param a first addend
 * \param b second addend
 */
TOY_EXPORT
void _syscall_request_sum(int *user_sum, const int a, const int b) {
    addends[0] = a;
    addends[1] = b;

    sum_fence = 0;
    addends_fence = 1;
    __builtin_wasm_memory_atomic_notify(&addends_fence, 1);
    __builtin_wasm_memory_atomic_wait32(&sum_fence, 0, 10000);
    *user_sum = sum;
}

/**
 * \brief Block until 2 addends of a requested sum become available.
 * \param user_addends process memory where the result of the sum will be stored
 */
TOY_EXPORT
void _syscall_notify_request_sum(int *user_addends) {
    __builtin_wasm_memory_atomic_wait32(&addends_fence, 0, 10000);
    // TODO atomically copy this?
    __builtin_memcpy_inline(user_addends, addends, sizeof(addends));
    addends_fence = 0;
}

/**
 * \brief send back the result of a sum
 * \param user_sum the result 2 addends of a sum
 */
TOY_EXPORT
void _syscall_put_sum(const int user_sum) {
    sum_fence = 1;
    __builtin_wasm_memory_atomic_notify(&sum_fence, 1);
    sum = user_sum;
}

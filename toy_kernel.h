#ifndef TOY_KERNEL_H
#define TOY_KERNEL_H

void _syscall_request_sum(int *user_sum, const int a, const int b);
void _syscall_notify_request_sum(int *user_addends);
void _syscall_put_sum(const int user_sum);

#endif // TOY_KERNEL_H

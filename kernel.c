__attribute__((export_name("syscall_add")))
void syscall_add(int *  __attribute__(address_space(1)) result, int a, b) {
    *result = a + b;
}

int main() {
}
import secrets
import string

def generate_temp_password(length=10):
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))

# Generate a test password to see what it looks like
test_password = generate_temp_password()
print(f"Sample temporary password format: {test_password}")
print(f"Length: {len(test_password)}")
print(f"Characters: Letters and digits only")

# Test a few more
print("\nMore examples:")
for i in range(5):
    print(f"- {generate_temp_password()}")

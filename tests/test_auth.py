from app import auth


def test_hash_and_verify_short_password():
    pw = "abcdef"
    hashed = auth.hash_password(pw)
    assert isinstance(hashed, str)
    assert auth.verify_password(pw, hashed)


def test_hash_and_verify_long_password():
    # ensure behavior works for passwords longer than bcrypt's 72-byte limit
    long_pw = "a" * 300
    hashed = auth.hash_password(long_pw)
    assert auth.verify_password(long_pw, hashed)

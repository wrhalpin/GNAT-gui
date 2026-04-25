from gnat_gui.auth.password import hash_password, verify_password


def test_hash_and_verify_roundtrip():
    plain = "correct-horse-battery-staple"
    hashed = hash_password(plain)
    assert hashed != plain
    assert verify_password(plain, hashed)


def test_wrong_password_rejected():
    hashed = hash_password("correct")
    assert not verify_password("wrong", hashed)


def test_hashes_are_unique():
    h1 = hash_password("same")
    h2 = hash_password("same")
    assert h1 != h2

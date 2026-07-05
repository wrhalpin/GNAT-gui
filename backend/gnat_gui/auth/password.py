from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerifyMismatchError

_ph = PasswordHasher()

# A real argon2 hash of an unguessable value, verified against for unknown
# usernames so login latency doesn't reveal whether an account exists.
_DUMMY_HASH = _ph.hash("timing-equalizer-not-a-real-password")


def hash_password(plain: str) -> str:
    return _ph.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return _ph.verify(hashed, plain)
    except VerifyMismatchError:
        return False
    except InvalidHashError:
        # Malformed/legacy hash in storage: fail closed as a wrong password,
        # not a 500.
        return False


def dummy_verify() -> None:
    """Burn the same argon2 cost as a real verification (timing equalizer)."""
    try:
        _ph.verify(_DUMMY_HASH, "wrong-password")
    except VerifyMismatchError:
        pass

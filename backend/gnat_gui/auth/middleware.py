from fastapi import Cookie, HTTPException, status


def get_session_token(session: str | None = Cookie(default=None)) -> str:
    if not session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated"
        )
    return session

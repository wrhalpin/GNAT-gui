from fastapi import APIRouter, HTTPException, status

from gnat_gui.db.models.ui_state import UIState
from gnat_gui.deps import CurrentUser, DB
from gnat_gui.schemas.ui import UIStateGet, UIStatePut

router = APIRouter(prefix="/api/prefs", tags=["prefs"])


@router.get("/{key}", response_model=UIStateGet)
def get_pref(key: str, db: DB, current_user: CurrentUser) -> UIStateGet:
    state = db.query(UIState).filter_by(user_id=current_user.id, key=key).first()
    if not state:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Preference not found")
    return UIStateGet(key=state.key, value=state.value)


@router.put("/{key}", response_model=UIStateGet)
def set_pref(key: str, body: UIStatePut, db: DB, current_user: CurrentUser) -> UIStateGet:
    state = db.query(UIState).filter_by(user_id=current_user.id, key=key).first()
    if state:
        state.value = body.value
    else:
        state = UIState(user_id=current_user.id, key=key, value=body.value)
        db.add(state)
    db.commit()
    return UIStateGet(key=key, value=body.value)

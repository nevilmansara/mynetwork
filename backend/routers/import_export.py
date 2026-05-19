import io

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import StreamingResponse

from middleware.auth_middleware import get_current_user
from services.import_export_service import export_people_csv, import_people_csv

router = APIRouter()

MAX_UPLOAD_BYTES = 5 * 1024 * 1024  # 5 MB


@router.get("/export")
async def export_csv(current_user: dict = Depends(get_current_user)):
    csv_content = await export_people_csv(current_user["user_id"])
    return StreamingResponse(
        io.StringIO(csv_content),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="mynetwork_people.csv"'},
    )


@router.post("/import")
async def import_csv(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    if not (file.filename or '').lower().endswith('.csv'):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File must be a .csv")

    raw = await file.read()
    if len(raw) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="File too large (max 5 MB)")

    try:
        text = raw.decode('utf-8-sig')  # strip BOM if present
    except UnicodeDecodeError:
        text = raw.decode('latin-1')

    return await import_people_csv(text, current_user["user_id"])

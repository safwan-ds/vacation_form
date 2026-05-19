import io
import json
import os
import re
import time
from collections import defaultdict, deque
from pathlib import Path
from threading import Lock
from typing import Any

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, ConfigDict, Field
from pypdf import PdfReader, PdfWriter
from pypdf.generic import BooleanObject, NameObject, NumberObject

BASE_DIR = Path(__file__).resolve().parent.parent
CONFIG_PATH = BASE_DIR / "config.json"
PDF_TEMPLATE_PATH = BASE_DIR / "إجازة الكترونية.pdf"

ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "ALLOWED_ORIGINS", "http://localhost:8000,http://127.0.0.1:8000"
    ).split(",")
    if origin.strip()
]
RATE_LIMIT_REQUESTS = int(os.getenv("RATE_LIMIT_REQUESTS", "60"))
RATE_LIMIT_WINDOW_SECONDS = int(os.getenv("RATE_LIMIT_WINDOW_SECONDS", "60"))
MAX_CONTENT_LENGTH = int(os.getenv("MAX_CONTENT_LENGTH", str(64 * 1024)))
MAX_FIELD_LENGTH = int(os.getenv("MAX_FIELD_LENGTH", "200"))

app = FastAPI(title="Vacation Form API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

_request_buckets: dict[str, deque[float]] = defaultdict(deque)
_rate_limit_lock = Lock()


class FormSubmission(BaseModel):
    model_config = ConfigDict(extra="forbid")
    data: dict[str, Any] = Field(default_factory=dict)


PDF_FIELD_MAP = {
    "breakType": {"pdfName": "نوع الإجازة", "type": "dropdown"},
    "fullName": {"pdfName": "اكتب الاسم الرباعي", "type": "text"},
    "civilId": {"pdfName": "الرقم المدني", "type": "text"},
    "mosqueName": {"pdfName": "اكتب اسم المسجد الرسمي", "type": "text"},
    "jobTitle": {"pdfName": "الوظيفة", "type": "dropdown"},
    "nationality": {"pdfName": "الجنسية", "type": "text"},
    "phoneNumber": {"pdfName": "رقم التليفون", "type": "text"},
    "fileNumber": {"pdfName": "رقم الملف", "type": "text"},
    "fileContract": {"pdfName": "نوع العقد", "type": "dropdown"},
    "leaveDuration": {"pdfName": "مدة الإجازة", "type": "text"},
    "leaveStartDate": {"pdfName": "تاريخ بداية الإجازة", "type": "text"},
    "leaveEndDate": {"pdfName": "تاريخ نهاية الإجازة", "type": "text"},
    "assignedFridayPlan": {"pdfName": "اختار", "type": "radio"},
    "subFullName": {"pdfName": "اكتب الاسم كاملا", "type": "text"},
    "subCivilId": {"pdfName": "رقم مدني", "type": "text"},
    "subCurrentMosque": {"pdfName": "اكتب اسم المسجد", "type": "text"},
    "subJobTitle": {"pdfName": "وظيفة", "type": "dropdown"},
    "subNationality": {"pdfName": "الجنسية للبديل", "type": "text"},
    "subPhoneNumber": {"pdfName": "رقم الهاتف", "type": "text"},
    "subAssignedWork": {"pdfName": "العمل المكلف به", "type": "dropdown"},
    "subAssignmentDuration": {"pdfName": "مدة الإجازة", "type": "text"},
    "subStartDate": {"pdfName": "تاريخ بداية الإجازة", "type": "text"},
    "subEndDate": {"pdfName": "تاريخ نهاية الإجازة", "type": "text"},
    "fridayPreacherName": {"pdfName": "اسم الخطيب الثلاثي", "type": "text"},
    "fridaySermonMosque": {"pdfName": "مسجد الخطبة", "type": "text"},
}

NUMERIC_FIELDS = {
    "civilId",
    "fileNumber",
    "phoneNumber",
    "leaveDuration",
    "subCivilId",
    "subPhoneNumber",
    "subAssignmentDuration",
}


@app.middleware("http")
async def log_and_guard_requests(request: Request, call_next):
    client_ip = request.client.host if request.client else "unknown"

    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > MAX_CONTENT_LENGTH:
        return JSONResponse(
            status_code=413,
            content={"detail": "Request payload too large"},
        )

    now = time.time()
    with _rate_limit_lock:
        bucket = _request_buckets[client_ip]
        while bucket and now - bucket[0] > RATE_LIMIT_WINDOW_SECONDS:
            bucket.popleft()
        if len(bucket) >= RATE_LIMIT_REQUESTS:
            return JSONResponse(
                status_code=429,
                content={"detail": "Rate limit exceeded"},
            )
        bucket.append(now)

    start = time.perf_counter()
    response = await call_next(request)
    elapsed_ms = (time.perf_counter() - start) * 1000
    print(
        f"{request.method} {request.url.path} from={client_ip} "
        f"status={response.status_code} took_ms={elapsed_ms:.2f}"
    )
    return response


def _load_config() -> dict[str, Any]:
    with CONFIG_PATH.open("r", encoding="utf-8") as config_file:
        return json.load(config_file)


def _to_clean_str(value: Any) -> str:
    if isinstance(value, bool):
        return "نعم" if value else "لا"
    return str(value).strip()


def _validate_civil_id(civil_id: str) -> bool:
    if not re.fullmatch(r"[1-3]\d{11}", civil_id):
        return False
    weights = [2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2]
    total = sum(int(civil_id[i]) * weights[i] for i in range(11))
    check_digit = (11 - (total % 11)) % 11
    return check_digit == int(civil_id[11])


def validate_form_data(data: dict[str, Any]) -> tuple[dict[str, str], dict[str, str]]:
    config = _load_config()
    fields = config.get("fields", [])

    errors: dict[str, str] = {}
    cleaned: dict[str, str] = {}

    for field in fields:
        if field.get("type") == "section":
            continue

        field_id = field.get("id")
        if not field_id:
            continue

        raw_value = data.get(field_id, "")
        value = _to_clean_str(raw_value)

        if len(value) > MAX_FIELD_LENGTH:
            errors[field_id] = "قيمة الحقل طويلة جداً"
            continue

        if field_id in NUMERIC_FIELDS and value:
            value = re.sub(r"[^0-9]", "", value)

        if field.get("required") and not value:
            errors[field_id] = "يرجى تعبئة هذا الحقل"
            continue

        if value and field_id in {"civilId", "subCivilId"}:
            if not _validate_civil_id(value):
                errors[field_id] = "الرقم المدني غير صحيح"
                continue

        cleaned[field_id] = value

    leave_start = cleaned.get("leaveStartDate")
    leave_end = cleaned.get("leaveEndDate")
    if leave_start and leave_end and leave_end < leave_start:
        errors["leaveEndDate"] = "تاريخ النهاية يجب أن يكون بعد البداية"

    sub_start = cleaned.get("subStartDate")
    sub_end = cleaned.get("subEndDate")
    if sub_start and sub_end and sub_end < sub_start:
        errors["subEndDate"] = "تاريخ النهاية يجب أن يكون بعد البداية"

    if errors:
        for field_id in errors:
            cleaned.pop(field_id, None)

    return errors, cleaned


def generate_filled_pdf(cleaned_data: dict[str, str]) -> bytes:
    if not PDF_TEMPLATE_PATH.exists():
        raise HTTPException(status_code=500, detail="PDF template not found")

    reader = PdfReader(str(PDF_TEMPLATE_PATH))
    writer = PdfWriter()
    writer.clone_document_from_reader(reader)

    field_values: dict[str, str] = {}
    for field_id, value in cleaned_data.items():
        mapping = PDF_FIELD_MAP.get(field_id)
        if not mapping:
            continue

        if mapping["type"] == "radio":
            field_values[mapping["pdfName"]] = "Yes" if value == "نعم" else "no"
        else:
            field_values[mapping["pdfName"]] = value

    for page in writer.pages:
        writer.update_page_form_field_values(page, field_values, auto_regenerate=False)

    acro_form = writer._root_object.get(NameObject("/AcroForm"))
    if acro_form:
        acro_form.update({NameObject("/NeedAppearances"): BooleanObject(True)})

    for page in writer.pages:
        annotations = page.get("/Annots")
        if not annotations:
            continue
        for annotation_ref in annotations:
            annotation = annotation_ref.get_object()
            current_flags = int(annotation.get(NameObject("/Ff"), 0))
            annotation.update({NameObject("/Ff"): NumberObject(current_flags | 1)})

    output = io.BytesIO()
    writer.write(output)
    output.seek(0)
    return output.read()


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/config")
def get_config() -> dict[str, Any]:
    return _load_config()


@app.post("/validate")
def validate_submission(payload: FormSubmission) -> dict[str, Any]:
    errors, cleaned_data = validate_form_data(payload.data)
    return {
        "valid": len(errors) == 0,
        "errors": errors,
        "cleanedData": cleaned_data,
    }


@app.post("/generate-pdf")
def generate_pdf(payload: FormSubmission):
    errors, cleaned_data = validate_form_data(payload.data)
    if errors:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "Validation failed",
                "errors": errors,
            },
        )

    pdf_bytes = generate_filled_pdf(cleaned_data)
    employee_name = cleaned_data.get("fullName", "إجازة")
    safe_name = re.sub(r"[^\w\u0600-\u06FF\-\s]", "", employee_name).strip() or "إجازة"
    filename = f"إجازة - {safe_name}.pdf"

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


app.mount("/", StaticFiles(directory=str(BASE_DIR), html=True), name="static")

import csv
import io
import logging

from fastapi import HTTPException

from database import get_db
from models.person import PersonCreate
from services.people_service import create_person

logger = logging.getLogger(__name__)


async def export_people_csv(user_id: str) -> str:
    async with get_db() as session:
        result = await session.run(
            """
            MATCH (u:User {id: $user_id})-[:OWNS]->(p:Person)
            WHERE NOT coalesce(p.is_self, false)
            RETURN p ORDER BY p.name
            """,
            user_id=user_id,
        )
        records = await result.data()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['name', 'email', 'phone', 'occupation', 'company', 'skills', 'location', 'notes'])
    for r in records:
        p = r['p']
        skills = ';'.join(p.get('skills') or [])
        writer.writerow([
            p.get('name', ''),
            p.get('email') or '',
            p.get('phone') or '',
            p.get('occupation') or '',
            p.get('company') or '',
            skills,
            p.get('location') or '',
            p.get('notes') or '',
        ])
    return output.getvalue()


async def import_people_csv(content: str, user_id: str) -> dict:
    try:
        reader = csv.DictReader(io.StringIO(content))
        rows = list(reader)
    except Exception:
        raise HTTPException(status_code=400, detail="Could not parse CSV file")

    if not rows:
        return {'imported': 0, 'skipped': 0, 'errors': []}

    # Normalise header names (strip whitespace, lowercase)
    if reader.fieldnames:
        norm = [f.strip().lower() for f in reader.fieldnames]
        if 'name' not in norm:
            raise HTTPException(status_code=400, detail="CSV must have a 'name' column")

    # Load existing names and emails for duplicate detection
    async with get_db() as session:
        existing_result = await session.run(
            """
            MATCH (u:User {id: $user_id})-[:OWNS]->(p:Person)
            RETURN toLower(p.name) AS name, toLower(coalesce(p.email, '')) AS email
            """,
            user_id=user_id,
        )
        existing_records = await existing_result.data()

    existing_names = {r['name'] for r in existing_records}
    existing_emails = {r['email'] for r in existing_records if r['email']}

    imported = 0
    skipped = 0
    errors: list[str] = []

    for i, raw_row in enumerate(rows, start=2):
        # Normalize keys
        row = {k.strip().lower(): (v or '').strip() for k, v in raw_row.items()}

        name = row.get('name', '')
        if not name:
            errors.append(f"Row {i}: missing name — skipped")
            skipped += 1
            continue

        if name.lower() in existing_names:
            skipped += 1
            continue

        email = row.get('email') or None
        if email and email.lower() in existing_emails:
            skipped += 1
            continue

        skills_raw = row.get('skills', '')
        skills = [s.strip() for s in skills_raw.split(';') if s.strip()]

        data = PersonCreate(
            name=name,
            email=email,
            phone=row.get('phone') or None,
            occupation=row.get('occupation') or None,
            company=row.get('company') or None,
            skills=skills,
            location=row.get('location') or None,
            notes=row.get('notes') or None,
        )

        try:
            await create_person(data, user_id)
            existing_names.add(name.lower())
            if email:
                existing_emails.add(email.lower())
            imported += 1
        except Exception as exc:
            errors.append(f"Row {i} ({name}): {exc}")
            skipped += 1

    logger.info("CSV import for user %s: %d imported, %d skipped", user_id, imported, skipped)
    return {'imported': imported, 'skipped': skipped, 'errors': errors}

with open("TotalApp/rutero-sam-backend/app/api/v1/endpoints/tracking.py", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    "from sqlalchemy import select",
    "from sqlalchemy import select, func"
)

with open("TotalApp/rutero-sam-backend/app/api/v1/endpoints/tracking.py", "w", encoding="utf-8") as f:
    f.write(content)

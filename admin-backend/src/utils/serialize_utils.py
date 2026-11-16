# src/utils/serialize_utils.py
from datetime import date, datetime, time
from decimal import Decimal


def serialize_row(row):
    out = {}
    for key, value in row.items():
        if isinstance(value, (date, datetime, time)):
            out[key] = value.isoformat()
        elif isinstance(value, Decimal):
            out[key] = float(value)
        else:
            out[key] = value
    return out


def serialize_rows(rows):
    return [serialize_row(r) for r in rows]

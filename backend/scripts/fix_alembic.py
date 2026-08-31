from app.core.config import settings
from sqlalchemy import create_engine, text

def fix_db():
    engine = create_engine(str(settings.DATABASE_URL).replace('postgresql+asyncpg', 'postgresql'))
    with engine.connect() as conn:
        result = conn.execute(text('SELECT * FROM alembic_version;')).fetchall()
        print('Current versions:', result)
        conn.execute(text("UPDATE alembic_version SET version_num = 'ee98c523997d';"))
        conn.commit()
        print('Updated to ee98c523997d')

if __name__ == "__main__":
    fix_db()

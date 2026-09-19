"""merge_heads

Revision ID: 6aacf74cea2b
Revises: 0b44915641b4, f5d35f688b46
Create Date: 2026-09-15 11:34:59.901598

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6aacf74cea2b'
down_revision: Union[str, Sequence[str], None] = ('0b44915641b4', 'f5d35f688b46')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass

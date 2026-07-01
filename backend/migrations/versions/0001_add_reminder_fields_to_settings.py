"""Add reminder fields to settings

Revision ID: 0001
Revises:
Create Date: 2026-07-01 07:00:00.000000
"""
from alembic import op
import sqlalchemy as sa


revision = '0001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('settings', sa.Column('reminder_enabled', sa.Boolean(), nullable=False, server_default=sa.text('0')))
    op.add_column('settings', sa.Column('reminder_time', sa.String(5), nullable=False, server_default=sa.text("'09:00'")))
    op.add_column('settings', sa.Column('reminder_frequency', sa.String(20), nullable=False, server_default=sa.text("'daily'")))
    op.add_column('settings', sa.Column('reminder_days', sa.Text(), nullable=True))
    op.add_column('settings', sa.Column('reminder_amount', sa.Float(), nullable=False, server_default=sa.text('0.0')))
    op.add_column('settings', sa.Column('reminder_title', sa.String(200), nullable=False, server_default=sa.text("'Money Vault Reminder'")))
    op.add_column('settings', sa.Column('reminder_message', sa.String(500), nullable=False, server_default=sa.text("'Don''t forget today''s savings!'")))
    op.add_column('settings', sa.Column('reminder_timezone', sa.String(50), nullable=False, server_default=sa.text("'UTC'")))


def downgrade():
    op.drop_column('settings', 'reminder_timezone')
    op.drop_column('settings', 'reminder_message')
    op.drop_column('settings', 'reminder_title')
    op.drop_column('settings', 'reminder_amount')
    op.drop_column('settings', 'reminder_days')
    op.drop_column('settings', 'reminder_frequency')
    op.drop_column('settings', 'reminder_time')
    op.drop_column('settings', 'reminder_enabled')

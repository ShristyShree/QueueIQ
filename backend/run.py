"""
Entry point for development server.
  python run.py            — start Flask dev server
  flask seed-db            — populate database with hospital data
  flask create-db          — create all tables
"""

import click
from app import create_app, db
from app.services.seed import seed_hospitals

app = create_app()


@app.cli.command("create-db")
def create_db():
    """Create all database tables."""
    with app.app_context():
        db.create_all()
        click.echo("✅ All tables created.")


@app.cli.command("seed-db")
def seed_db():
    """Seed the database with hospital data."""
    seed_hospitals(app)


@app.cli.command("drop-db")
def drop_db():
    """⚠️  Drop all tables (destructive)."""
    if click.confirm("This will DELETE all data. Continue?"):
        with app.app_context():
            db.drop_all()
            click.echo("🗑️  All tables dropped.")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)

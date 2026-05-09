from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.admin_user import AdminUser


def main():
    db = SessionLocal()

    try:
        username = input("Admin username: ").strip()
        password = input("Admin password: ").strip()

        existing_admin = (
            db.query(AdminUser)
            .filter(AdminUser.username == username)
            .first()
        )

        if existing_admin:
            print("Admin already exists.")
            return

        admin = AdminUser(
            username=username,
            password_hash=hash_password(password),
            is_active=True,
        )

        db.add(admin)
        db.commit()

        print("Admin created successfully.")

    finally:
        db.close()


if __name__ == "__main__":
    main()
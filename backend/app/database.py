import json

import firebase_admin
from firebase_admin import credentials, firestore

from app.config import settings

_firebase_app: firebase_admin.App | None = None
_firestore_client: firestore.Client | None = None


def init_firebase() -> None:
    global _firebase_app, _firestore_client

    if _firebase_app is not None:
        return

    # Use Firebase credentials from Render environment variable
    # when available. Otherwise use the local JSON file.
    if settings.firebase_credentials_json:
        service_account_info = json.loads(
            settings.firebase_credentials_json
        )
        cred = credentials.Certificate(service_account_info)
    else:
        cred = credentials.Certificate(
            settings.firebase_credentials_path
        )

    options = {}

    if settings.firebase_storage_bucket:
        options["storageBucket"] = settings.firebase_storage_bucket

    _firebase_app = firebase_admin.initialize_app(
        cred,
        options or None,
    )

    _firestore_client = firestore.client()


def get_firestore() -> firestore.Client:
    if _firestore_client is None:
        init_firebase()

    assert _firestore_client is not None

    return _firestore_client


def reset_firebase() -> None:
    """Reset Firebase state – used in tests."""
    global _firebase_app, _firestore_client

    if _firebase_app is not None:
        firebase_admin.delete_app(_firebase_app)

    _firebase_app = None
    _firestore_client = None
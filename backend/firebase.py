import os

import firebase_admin
from firebase_admin import credentials, firestore
from dotenv import load_dotenv

load_dotenv()

credentials_path = os.getenv("FIREBASE_CREDENTIALS_PATH")

if not credentials_path:
    raise ValueError("FIREBASE_CREDENTIALS_PATH is not set in .env")

cred = credentials.Certificate(credentials_path)

if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)

db = firestore.client()
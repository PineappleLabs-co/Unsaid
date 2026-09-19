import os
import logging
from typing import Optional
import firebase_admin
from firebase_admin import credentials, firestore
from app.config import settings

logger = logging.getLogger(__name__)

_firestore_client = None


def get_firestore_client():
    """
    Initializes and returns the Firestore client singleton.
    Supports GOOGLE_APPLICATION_CREDENTIALS, FIREBASE_CONFIG, or mock/emulator.
    """
    global _firestore_client
    if _firestore_client is not None:
        return _firestore_client

    try:
        if not firebase_admin._apps:
            # Check for service account credentials path
            cred_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
            if cred_path and os.path.exists(cred_path):
                cred = credentials.Certificate(cred_path)
                firebase_admin.initialize_app(cred)
            else:
                # Default app initialization
                firebase_admin.initialize_app()
        _firestore_client = firestore.client()
        logger.info("Firestore client successfully initialized.")
    except Exception as e:
        logger.warning(f"Could not initialize native Firestore credentials: {e}. Operating in standalone mode.")
        _firestore_client = None

    return _firestore_client

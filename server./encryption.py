
import base64 #ספרייה להצפנה/פענוח של מחרוזות לבסיס 64 – מאפשר לשלוח טקסט במקום בינארי (למשל דרך JSON).
import json #מאפשר להמיר מ־dict לפורמט JSON ולהפך.
import os #גישה למשתני סביבה (כמו .env) ומערכות הפעלה.
from typing import Dict, Any #מספק טיפוסי עזר לפונקציות – מגדיר אילו מבנים מתקבלים או מוחזרים.
from dotenv import load_dotenv #טוען את הקובץ .env לסביבת ההרצה של התוכנית. חובה כדי שנוכל להשתמש במפתח ההצפנה מהסביבה.
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend #הספרייה הראשית להצפנה – יוצרת הצפנות, מצבים (GCM), ו־Cipher.



def _get_env_b64(name: str) -> bytes:
    """Read Base64 value from environment and decode to bytes."""
    load_dotenv()  # loads variables from .env into the process
    b64 = os.getenv(name)
    if not b64:
        raise ValueError(f"{name} not found in environment")
    try:
        return base64.b64decode(b64)
    except Exception as e:
        raise ValueError(f"Invalid Base64 in {name}: {e}") from e


def get_aes_key() -> bytes:
    """
    Return the raw AES key bytes (length must be 16/24/32).
    """
    key = _get_env_b64("APP_AES_KEY")
    if len(key) not in (16, 24, 32):
        raise ValueError("APP_AES_KEY must decode to 16/24/32 bytes")
    return key


def encrypt_json(obj: Dict[str, Any]) -> Dict[str, str]:
    """
    Encrypt a Python dict (JSON-encoded) using AES-GCM.
    Returns: {"iv": b64, "ct": b64, "tag": b64}
    """
    key = get_aes_key()
    iv = os.urandom(12)  # 12 bytes is the standard nonce size for GCM
    plaintext = json.dumps(obj, separators=(',', ':')).encode('utf-8') # Convert dict to JSON string and then to bytes

    cipher = Cipher(algorithms.AES(key), modes.GCM(iv), backend=default_backend())#Constructs an encryption object with the AES algorithm in GCM IV mode
    encryptor = cipher.encryptor()

    # Encrypt the plaintext and finalize the operation
    ct = encryptor.update(plaintext) + encryptor.finalize()

    return {
        "iv": base64.b64encode(iv).decode(),
        "ct": base64.b64encode(ct).decode(),
        "tag": base64.b64encode(encryptor.tag).decode(),
    }


def decrypt_json(enc: Dict[str, str]) -> Dict[str, Any]:
    """
    Decrypt {"iv": b64, "ct": b64, "tag": b64} and return the original dict.
    """
    key = get_aes_key()
    iv = base64.b64decode(enc["iv"])
    ct = base64.b64decode(enc["ct"])
    tag = base64.b64decode(enc["tag"])

    cipher = Cipher(algorithms.AES(key), modes.GCM(iv, tag), backend=default_backend())
    decryptor = cipher.decryptor()
    
    # Decrypt the ciphertext and finalize the operation
    plaintext = decryptor.update(ct) + decryptor.finalize()

    return json.loads(plaintext.decode('utf-8'))

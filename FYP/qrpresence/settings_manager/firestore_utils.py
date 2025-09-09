from google.cloud import firestore

# Initialize Firestore client
db = firestore.Client()

def get_firestore_client():
    return db
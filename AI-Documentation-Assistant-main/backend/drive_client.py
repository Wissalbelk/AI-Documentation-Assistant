import io
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload
from google.oauth2.service_account import Credentials

SCOPES = ["https://www.googleapis.com/auth/drive.readonly"]
SERVICE_ACCOUNT_FILE = "credentials/service_account.json"


def get_drive_service():
    creds = Credentials.from_service_account_file(
        SERVICE_ACCOUNT_FILE, scopes=SCOPES
    )
    return build("drive", "v3", credentials=creds)


def list_files():
    service = get_drive_service()
    results = service.files().list(
        pageSize=50,
        fields="files(id, name, mimeType)"
    ).execute()
    return results.get("files", [])


def download_file(file_id, file_name):
    service = get_drive_service()
    request = service.files().get_media(fileId=file_id)

    file_path = f"data/{file_name}"
    fh = io.FileIO(file_path, "wb")

    downloader = MediaIoBaseDownload(fh, request)
    done = False
    while not done:
        _, done = downloader.next_chunk()

    return file_path

# cloudinary_helper.py
import cloudinary
import cloudinary.uploader
from config import Config

cloudinary.config(
    cloud_name=Config.CLOUDINARY_CLOUD_NAME,
    api_key=Config.CLOUDINARY_API_KEY,
    api_secret=Config.CLOUDINARY_API_SECRET
)

def upload_photo(photo_file, folder_name):
    """Upload a photo to Cloudinary"""
    try:
        result = cloudinary.uploader.upload(
            photo_file,
            folder=f"vehicles/{folder_name}",
            resource_type="image"
        )
        return result["secure_url"]
    except Exception as e:
        print(f"[CLOUDINARY] Upload failed: {e}")
        return None

def delete_photo(public_id):
    """Delete a photo from Cloudinary"""
    try:
        cloudinary.uploader.destroy(public_id)
    except Exception as e:
        print(f"[CLOUDINARY] Delete failed: {e}")
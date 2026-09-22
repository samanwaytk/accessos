import os
import base64
from dotenv import load_dotenv
load_dotenv()
from app.services import vision_service

# 1x1 pixel PNG
png_b64 = b"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
png_data = base64.b64decode(png_b64)

res = vision_service.analyze_image(png_data, 'image/png', 'what is this')
print(res)

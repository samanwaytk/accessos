import os
import sys
# Add backend to path so app.services can be imported
sys.path.append(os.path.abspath('backend'))
from dotenv import load_dotenv
load_dotenv('backend/.env')

from app.services.vision_service import analyze_image

with open('test.jpg', 'wb') as f:
    f.write(b'dummy_image_data_here')

try:
    with open('test.jpg', 'rb') as f:
        data = f.read()
    result = analyze_image(data, 'image/jpeg', 'What is this?')
    print(result)
except Exception as e:
    import traceback
    traceback.print_exc()

import os
from dotenv import load_dotenv
load_dotenv(".env")
import google.generativeai as genai

genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))

print("Available models supporting generateContent:")
for m in genai.list_models():
    if 'generateContent' in m.supported_generation_methods:
        print(m.name)

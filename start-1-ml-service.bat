cd /d %~dp0\NyayVivek-ML
call .venv\Scripts\activate
uvicorn app.main:app --host 127.0.0.1 --port 8000
pause

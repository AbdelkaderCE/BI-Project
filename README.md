# Apriori Analytics Mini Project

This project implements the Apriori algorithm with a FastAPI backend and a React frontend following the Claude.com UI philosophy.

## Features
- **Backend:** FastAPI, Pandas, mlxtend
- **Frontend:** React, Vite, Axios, Lucide-react
- **Algorithm:** Apriori for Frequent Itemsets and Association Rules
- **UI:** Cream & Coral styling, responsive design

## Setup & Run

### 1. Backend
Open a terminal and navigate to the `backend` directory:
```powershell
cd backend
..\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --host 127.0.0.1 --port 8000 --workers 1
```
The backend API will run on `http://localhost:8000`.

### 2. Frontend
Open another terminal and navigate to the `frontend` directory:
```powershell
cd frontend
npm install
npm run dev
```
The React frontend will be available at `http://localhost:5173`.

## How to Use
1. A sample dataset `sample_data.csv` is provided in the root directory.
2. Open the frontend app.
3. Upload `sample_data.csv`.
4. Enter `InvoiceNo` for Transaction Column Name.
5. Enter `Description` for Item Column Name.
6. Set Minimum Support (e.g., `0.02`) and Minimum Confidence (e.g., `0.5`).
7. Click **Run Apriori**.
8. View the extracted Frequent Itemsets and Association Rules below.

## Troubleshooting Lag / No Results

- If your PC becomes slow during processing, increase **Minimum Support** to `0.05` or `0.1`.
- If you see no results, lower **Minimum Support** (for example from `0.1` to `0.02`).
- The backend now protects your machine with limits for file size and dataset complexity. If you hit a limit, reduce CSV size or filter your data first.
- Keep backend and frontend running locally at:
	- Backend: `http://127.0.0.1:8000`
	- Frontend: `http://127.0.0.1:5173`

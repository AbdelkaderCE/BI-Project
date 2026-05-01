from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from mlxtend.frequent_patterns import apriori, association_rules
import io
import math

MAX_UPLOAD_BYTES = 25 * 1024 * 1024
MAX_ROWS = 300_000
MAX_TRANSACTIONS = 80_000
MAX_ITEMS = 1_200
MAX_MATRIX_CELLS = 6_000_000
MAX_ITEMSET_SIZE = 3
MAX_RESULTS = 100

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Apriori API is running"}

@app.post("/apriori")
def run_apriori(
    file: UploadFile = File(...),
    transaction_col: str = Form(...),
    item_col: str = Form(...),
    min_support: float = Form(0.01),
    min_confidence: float = Form(0.5)
):
    try:
        if min_support <= 0 or min_support > 1:
            raise HTTPException(status_code=400, detail="`min_support` must be in the range (0, 1].")
        if min_confidence <= 0 or min_confidence > 1:
            raise HTTPException(status_code=400, detail="`min_confidence` must be in the range (0, 1].")

        content = file.file.read()
        if not content:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")
        if len(content) > MAX_UPLOAD_BYTES:
            raise HTTPException(
                status_code=413,
                detail=(
                    f"CSV file is too large ({round(len(content) / (1024 * 1024), 2)} MB). "
                    f"Maximum allowed size is {MAX_UPLOAD_BYTES // (1024 * 1024)} MB."
                ),
            )

        header_df = pd.read_csv(io.BytesIO(content), nrows=0)

        if transaction_col not in header_df.columns or item_col not in header_df.columns:
            raise HTTPException(status_code=400, detail=f"Columns '{transaction_col}' or '{item_col}' not found in CSV.")

        df = pd.read_csv(io.BytesIO(content), usecols=[transaction_col, item_col], dtype={transaction_col: "string", item_col: "string"})
        df = df.dropna(subset=[transaction_col, item_col])
        if df.empty:
            raise HTTPException(status_code=400, detail="No valid rows found after removing empty transaction/item values.")

        if len(df) > MAX_ROWS:
            df = df.head(MAX_ROWS)

        df[transaction_col] = df[transaction_col].str.strip()
        df[item_col] = df[item_col].str.strip()
        df = df[(df[transaction_col] != "") & (df[item_col] != "")]
        df = df.drop_duplicates(subset=[transaction_col, item_col])

        if df.empty:
            raise HTTPException(status_code=400, detail="No valid transaction-item pairs remain after cleaning data.")

        transaction_count = int(df[transaction_col].nunique())
        item_count = int(df[item_col].nunique())

        transaction_preview_df = (
            df.groupby(transaction_col, sort=False)[item_col]
            .agg(lambda values: list(dict.fromkeys(values.tolist())))
            .reset_index()
            .head(5)
        )
        transaction_preview = [
            {
                "transaction_id": row[transaction_col],
                "items": row[item_col],
                "item_count": len(row[item_col]),
            }
            for _, row in transaction_preview_df.iterrows()
        ]

        if transaction_count > MAX_TRANSACTIONS:
            raise HTTPException(
                status_code=422,
                detail=(
                    f"Dataset has too many transactions ({transaction_count}). "
                    f"Maximum supported is {MAX_TRANSACTIONS}."
                ),
            )

        min_item_occurrences = max(1, math.ceil(min_support * transaction_count))
        item_occurrences = df.groupby(item_col)[transaction_col].nunique()
        valid_items = item_occurrences[item_occurrences >= min_item_occurrences].index
        df = df[df[item_col].isin(valid_items)]

        if df.empty:
            preview = []
            columns = [transaction_col, item_col]
            return {
                "columns": columns,
                "preview": preview,
                "transaction_preview": [],
                "frequent_itemsets": [],
                "association_rules": [],
                "message": "No frequent itemsets found. Try lowering minimum support.",
                "stats": {
                    "rows_after_cleaning": 0,
                    "transactions": transaction_count,
                    "items": 0,
                },
            }

        item_count = int(df[item_col].nunique())
        if item_count > MAX_ITEMS:
            raise HTTPException(
                status_code=422,
                detail=(
                    f"Too many distinct items ({item_count}) for Apriori on this machine. "
                    f"Try increasing `min_support` or reducing the dataset. Limit is {MAX_ITEMS} items."
                ),
            )

        matrix_cells = transaction_count * item_count
        if matrix_cells > MAX_MATRIX_CELLS:
            raise HTTPException(
                status_code=422,
                detail=(
                    f"Dataset is too dense for safe local processing ({matrix_cells:,} matrix cells). "
                    "Try a higher minimum support or a smaller dataset."
                ),
            )

        basket_sets = pd.crosstab(df[transaction_col], df[item_col]).gt(0)

        frequent_itemsets = apriori(
            basket_sets,
            min_support=min_support,
            use_colnames=True,
            max_len=MAX_ITEMSET_SIZE,
            low_memory=True,
        )

        preview = df.head(5).to_dict(orient="records")
        columns = df.columns.tolist()

        if frequent_itemsets.empty:
            return {
                "columns": columns,
                "preview": preview,
                "transaction_preview": transaction_preview,
                "frequent_itemsets": [],
                "association_rules": [],
                "message": "No frequent itemsets found with the given minimum support.",
                "stats": {
                    "rows_after_cleaning": int(len(df)),
                    "transactions": transaction_count,
                    "items": item_count,
                },
            }

        rules = pd.DataFrame()
        if len(frequent_itemsets) >= 2:
            try:
                rules = association_rules(
                    frequent_itemsets,
                    metric="confidence",
                    min_threshold=min_confidence,
                )
            except ValueError:
                rules = pd.DataFrame()

        freq_items_list = [
            {"itemset": list(row["itemsets"]), "support": round(row["support"], 4)}
            for _, row in frequent_itemsets.iterrows()
        ]

        rules_list = [
            {
                "antecedents": list(row["antecedents"]),
                "consequents": list(row["consequents"]),
                "support": round(row["support"], 4),
                "confidence": round(row["confidence"], 4),
                "lift": round(row["lift"], 4),
            }
            for _, row in rules.iterrows()
        ] if not rules.empty else []

        return {
            "columns": columns,
            "preview": preview,
            "transaction_preview": transaction_preview,
            "frequent_itemsets": freq_items_list[:MAX_RESULTS],
            "association_rules": rules_list[:MAX_RESULTS],
            "message": "Apriori algorithm executed successfully.",
            "stats": {
                "rows_after_cleaning": int(len(df)),
                "transactions": transaction_count,
                "items": item_count,
                "preview_transactions": len(transaction_preview),
                "frequent_itemsets_total": int(len(freq_items_list)),
                "association_rules_total": int(len(rules_list)),
                "max_itemset_size": MAX_ITEMSET_SIZE,
            },
        }

    except HTTPException:
        raise
    except MemoryError:
        raise HTTPException(
            status_code=500,
            detail="Not enough memory for Apriori on this file. Try a smaller CSV or higher minimum support.",
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

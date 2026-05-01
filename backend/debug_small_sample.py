import io
import json
import pandas as pd
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

with open('tiny_debug_sample.csv', 'rb') as f:
    response = client.post(
        '/apriori',
        files={'file': ('tiny_debug_sample.csv', f, 'text/csv')},
        data={
            'transaction_col': 'InvoiceNo',
            'item_col': 'Description',
            'min_support': '0.2',
            'min_confidence': '0.5',
        },
    )

print('STATUS:', response.status_code)
print(json.dumps(response.json(), indent=2))

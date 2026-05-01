import json
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

with open('presentation_sample.csv', 'rb') as f:
    response = client.post(
        '/apriori',
        files={'file': ('presentation_sample.csv', f, 'text/csv')},
        data={
            'transaction_col': 'InvoiceNo',
            'item_col': 'Description',
            'min_support': '0.2',
            'min_confidence': '0.5',
        },
    )

print('STATUS:', response.status_code)
result = response.json()
print('TRANSACTIONS:', result.get('stats', {}).get('transactions'))
print('ITEMS:', result.get('stats', {}).get('items'))
print('PREVIEW TRANSACTIONS:', result.get('stats', {}).get('preview_transactions'))
print('FREQUENT ITEMSETS:', result.get('stats', {}).get('frequent_itemsets_total'))
print('ASSOCIATION RULES:', result.get('stats', {}).get('association_rules_total'))
print('\nGROUPED PREVIEW:')
for row in result.get('transaction_preview', []):
    print(f"- {row['transaction_id']}: {', '.join(row['items'])}")
print('\nTOP RULES:')
for rule in result.get('association_rules', [])[:5]:
    print(f"- {', '.join(rule['antecedents'])} -> {', '.join(rule['consequents'])} | support={rule['support']} confidence={rule['confidence']} lift={rule['lift']}")

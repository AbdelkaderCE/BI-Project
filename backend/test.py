import requests

files = {'file': open('../sample_data.csv', 'rb')}
data = {
    'transaction_col': 'InvoiceNo',
    'item_col': 'Description',
    'min_support': '0.01',
    'min_confidence': '0.5'
}

response = requests.post('http://127.0.0.1:8000/apriori', files=files, data=data)
print(response.status_code)
print(response.text)

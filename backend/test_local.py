import pandas as pd
from mlxtend.frequent_patterns import apriori, association_rules

try:
    df = pd.read_csv('../sample_data.csv')

    transaction_col = 'InvoiceNo'
    item_col = 'Description'

    basket = (df.groupby([transaction_col, item_col])[item_col]
                .count().unstack().reset_index().fillna(0)
                .set_index(transaction_col))

    def encode_units(x):
        if x <= 0: return False
        if x >= 1: return True
        return False

    if hasattr(basket, "map"):
        basket_sets = basket.map(encode_units)
    else:
        basket_sets = basket.applymap(encode_units)

    frequent_itemsets = apriori(basket_sets, min_support=0.01, use_colnames=True)
    
    rules = association_rules(frequent_itemsets, metric="confidence", min_threshold=0.5, num_itemsets=len(frequent_itemsets))
    print("Success")
except Exception as e:
    import traceback
    traceback.print_exc()

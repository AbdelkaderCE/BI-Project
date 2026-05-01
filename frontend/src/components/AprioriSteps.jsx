import React, { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import './apriori-steps.css';

function summarizeTransactions(preview, transactionCol, itemCol, maxPreview = 6) {
  if (!preview || !transactionCol || !itemCol) return { transactions: [], stats: {} };

  const txMap = new Map();
  for (const row of preview) {
    const tx = row[transactionCol];
    const item = row[itemCol];
    if (!tx) continue;
    if (!txMap.has(tx)) txMap.set(tx, new Set());
    if (item) txMap.get(tx).add(String(item));
  }

  const transactions = Array.from(txMap.entries()).map(([id, set]) => ({ id, items: Array.from(set) }));
  const counts = transactions.map((t) => t.items.length);
  const uniqueItems = new Set(transactions.flatMap((t) => t.items));

  return {
    transactions: transactions.slice(0, maxPreview),
    stats: {
      totalTransactions: transactions.length,
      uniqueItems: uniqueItems.size,
      avgItemsPerTransaction: counts.length ? (counts.reduce((a, b) => a + b, 0) / counts.length).toFixed(2) : 0,
    },
  };
}

function computeL1(transactions) {
  const counts = new Map();
  for (const tx of transactions) {
    for (const item of tx.items) {
      counts.set(item, (counts.get(item) || 0) + 1);
    }
  }
  const total = transactions.length || 1;
  return Array.from(counts.entries())
    .map(([item, count]) => ({ item, count, support: count / total }))
    .sort((a, b) => b.support - a.support);
}

function generateCandidates(prevLevelItems, k) {
  // prevLevelItems: array of arrays (itemsets of length k-1)
  const candidates = new Set();
  const arr = prevLevelItems.map((s) => s.slice().sort());
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      const a = arr[i];
      const b = arr[j];
      if (a.slice(0, k - 2).join('|') === b.slice(0, k - 2).join('|')) {
        const cand = Array.from(new Set([...a, ...b])).sort();
        if (cand.length === k) candidates.add(cand.join('|'));
      }
    }
  }
  return Array.from(candidates).map((s) => s.split('|'));
}

function countSupportForCandidates(transactions, candidates) {
  return candidates.map((cand) => {
    const c = transactions.reduce((acc, tx) => (cand.every((x) => tx.items.includes(x)) ? acc + 1 : acc), 0);
    return { itemset: cand, count: c };
  });
}

export default function AprioriSteps({ results, transactionCol, itemCol, associationRules, usedMinSupport }) {
  const preview = results?.preview || [];
  const [open, setOpen] = useState(false);

  const { transactions, stats } = useMemo(() => summarizeTransactions(preview, transactionCol, itemCol), [preview, transactionCol, itemCol]);

  const allTransactions = useMemo(() => {
    // Build full transaction list (if results.preview is only a sample this is best-effort)
    const txMap = new Map();
    for (const row of preview) {
      const tx = row[transactionCol];
      const item = row[itemCol];
      if (!tx) continue;
      if (!txMap.has(tx)) txMap.set(tx, new Set());
      if (item) txMap.get(tx).add(String(item));
    }
    return Array.from(txMap.entries()).map(([id, set]) => ({ id, items: Array.from(set) }));
  }, [preview, transactionCol, itemCol]);

  const L1 = useMemo(() => computeL1(allTransactions), [allTransactions]);

  // Build C2 from top L1 items (limit for performance)
  const topItemsForCandidates = L1.slice(0, 12).map((r) => r.item);
  const candidatePairs = useMemo(() => {
    const pairs = [];
    for (let i = 0; i < topItemsForCandidates.length; i++) {
      for (let j = i + 1; j < topItemsForCandidates.length; j++) {
        pairs.push([topItemsForCandidates[i], topItemsForCandidates[j]]);
      }
    }
    return pairs;
  }, [topItemsForCandidates]);

  const C2Counts = useMemo(() => countSupportForCandidates(allTransactions, candidatePairs), [allTransactions, candidatePairs]);

  const usedSupport = usedMinSupport ?? (results?.stats?.adaptive_min_support ?? results?.stats?.used_min_support ?? 0.01);

  const L2 = useMemo(() => C2Counts.filter((c) => (allTransactions.length ? c.count / allTransactions.length : 0) >= usedSupport).map((c) => ({ itemset: c.itemset, count: c.count, support: allTransactions.length ? c.count / allTransactions.length : 0 })), [C2Counts, allTransactions, usedSupport]);

  // Simple C3 generation from L2 itemsets
  const C3Candidates = useMemo(() => {
    const prev = L2.map((l) => l.itemset);
    return generateCandidates(prev, 3);
  }, [L2]);

  const C3Counts = useMemo(() => countSupportForCandidates(allTransactions, C3Candidates), [allTransactions, C3Candidates]);

  const L3 = useMemo(() => C3Counts.filter((c) => (allTransactions.length ? c.count / allTransactions.length : 0) >= usedSupport).map((c) => ({ itemset: c.itemset, count: c.count, support: allTransactions.length ? c.count / allTransactions.length : 0 })), [C3Counts, allTransactions, usedSupport]);

  return (
    <div className="apriori-steps">
      <div className="apriori-header">
        <div>
          <h3 className="title-md">Apriori — Step-by-step</h3>
          <p className="muted">Interactive walkthrough: transactions → itemsets → rules</p>
        </div>
        <div>
          <button className="button button-ghost" onClick={() => setOpen((s) => !s)}>{open ? 'Hide details' : 'Show details'}</button>
        </div>
      </div>

      {open && (
        <>
          <div className="step">
        <h4>1. Data Preparation (Transactions)</h4>
        <div className="step-row">
          <div className="step-left">
            <p className="muted">Preview of transactions (grouped by <strong>{transactionCol || 'TransactionCol'}</strong>)</p>
            <div className="tx-preview">
              <table>
                <thead>
                  <tr><th>Transaction</th><th>Items (sample)</th></tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr key={t.id}><td>{t.id}</td><td>{t.items.slice(0,6).join(', ')}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="step-right">
            <div className="stat">Transactions: <strong>{stats.totalTransactions ?? 0}</strong></div>
            <div className="stat">Unique Items: <strong>{stats.uniqueItems ?? 0}</strong></div>
            <div className="stat">Avg Items / Tx: <strong>{stats.avgItemsPerTransaction}</strong></div>
            <button className="button button-ghost"><Download size={14} /> Export Transactions</button>
          </div>
        </div>
      </div>

      <div className="step">
        <h4>2. Frequent 1-itemsets (L1)</h4>
        <div className="step-row">
          <div className="step-left">
            <div className="table-shell small">
              <table>
                <thead><tr><th>Item</th><th>Count</th><th>Support</th></tr></thead>
                <tbody>
                  {L1.slice(0,20).map((r) => (
                    <tr key={r.item}>
                      <td className="item-cell">{r.item}</td>
                      <td>{r.count}</td>
                      <td>
                        <div className="sparkline" aria-hidden>
                          <div className="sparkbar" style={{ width: `${Math.min(100, Math.round(r.support * 100))}%` }} />
                        </div>
                        <div className="support-num">{(r.support).toFixed(3)}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="step-right">
            <div className="stat">L1 Items: <strong>{L1.length}</strong></div>
            <div className="muted">Highlight items below min support: <strong>{(usedSupport ?? 0).toFixed(3)}</strong></div>
          </div>
        </div>
      </div>

      <div className="step">
        <h4>3. Candidate Generation (C2, C3...)</h4>
        <div className="muted">Showing generated candidate pairs (C2) from top L1 items and candidate triples (C3) derived from L2.</div>
        <div className="table-shell small">
          <table>
            <thead><tr><th>Candidate</th><th>Count</th><th>Support</th></tr></thead>
            <tbody>
              {C2Counts.slice(0,50).map((c, idx) => (
                <tr key={idx}><td>{c.itemset.join(', ')}</td><td>{c.count}</td><td>{(allTransactions.length ? (c.count / allTransactions.length).toFixed(3) : '0.000')}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="step">
        <h4>4. Pruning (Apriori principle)</h4>
        <div className="muted">Candidates are pruned if any (k-1)-subset is not frequent. Below shows counts pruned vs kept for C2 → L2 and C3 → L3.</div>
        <div className="prune-stats">
          <div>Generated C2: <strong>{candidatePairs.length}</strong></div>
          <div>Kept L2: <strong>{L2.length}</strong></div>
          <div>Generated C3: <strong>{C3Candidates.length}</strong></div>
          <div>Kept L3: <strong>{L3.length}</strong></div>
        </div>
      </div>

      <div className="step">
        <h4>5. Frequent Itemsets (L2, L3...)</h4>
        <div className="muted">Final frequent itemsets for each level (support ≥ selected min_support).</div>
        <div className="table-shell small">
          <thead></thead>
          <table>
            <thead><tr><th>Level</th><th>Itemset</th><th>Count</th><th>Support</th></tr></thead>
            <tbody>
              {L2.map((l, i) => (<tr key={`l2-${i}`}><td>L2</td><td>{l.itemset.join(', ')}</td><td>{l.count}</td><td>{l.support.toFixed(3)}</td></tr>))}
              {L3.map((l, i) => (<tr key={`l3-${i}`}><td>L3</td><td>{l.itemset.join(', ')}</td><td>{l.count}</td><td>{l.support.toFixed(3)}</td></tr>))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="step">
        <h4>6. Association Rule Generation</h4>
        <div className="muted">Rules generated by the Apriori algorithm (server-side). Use filters to adjust `min_confidence` and `min_lift`.</div>
        <div className="table-shell small">
          <table>
            <thead><tr><th>Rule</th><th>Support</th><th>Confidence</th><th>Lift</th></tr></thead>
            <tbody>
              {(associationRules || []).slice(0,50).map((r) => (
                <tr key={r.id}><td>{(r.antecedents || []).join(', ')} → {(r.consequents || []).join(', ')}</td><td>{(r.support).toFixed(3)}</td><td>{(r.confidence).toFixed(3)}</td><td>{(r.lift).toFixed(3)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
        </>
      )}
    </div>
  );
}

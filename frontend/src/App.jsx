import { useState } from 'react';
import axios from 'axios';
import { ArrowRight, BarChart2, Menu, Search, Settings, Sparkles, Upload } from 'lucide-react';
import './index.css';

const MAX_UPLOAD_MB = 25;
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

function App() {
  const [file, setFile] = useState(null);
  const [transactionCol, setTransactionCol] = useState('');
  const [itemCol, setItemCol] = useState('');
  const [minSupport, setMinSupport] = useState(0.01);
  const [minConfidence, setMinConfidence] = useState(0.5);
  
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [statusText, setStatusText] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      const sizeMb = selected.size / (1024 * 1024);
      if (sizeMb > MAX_UPLOAD_MB) {
        setFile(null);
        setError(`File is too large (${sizeMb.toFixed(2)} MB). Maximum supported size is ${MAX_UPLOAD_MB} MB.`);
        return;
      }
      setFile(selected);
      setError(null);
      setStatusText(`Ready: ${selected.name} (${sizeMb.toFixed(2)} MB)`);
    }
  };

  const navItems = ['Overview', 'Upload', 'Results'];

  const handleRunAlgorithm = async (e) => {
    e.preventDefault();
    if (!file || !transactionCol || !itemCol) {
      setError("Please provide a file and both column names.");
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);
    setStatusText('Uploading file and preparing Apriori analysis...');

    const formData = new FormData();
    formData.append("file", file);
    formData.append("transaction_col", transactionCol);
    formData.append("item_col", itemCol);
    formData.append("min_support", minSupport);
    formData.append("min_confidence", minConfidence);

    try {
      const response = await axios.post(`${API_URL}/apriori`, formData, {
        timeout: 60000,
        headers: { "Content-Type": "multipart/form-data" }
      });
      setResults(response.data);
      setStatusText(response.data?.message || 'Processing finished successfully.');
    } catch (err) {
      if (err.code === 'ECONNABORTED') {
        setError('Request timed out after 60s. Try a smaller CSV or increase minimum support.');
      } else {
        setError(err.response?.data?.detail || "An error occurred during Apriori processing.");
      }
      setStatusText('Processing stopped. Please adjust settings and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <nav className="top-nav">
        <div className="top-nav-brand">
          <span className="brand-mark" aria-hidden="true">*</span>
          <span className="title-md">Apriori Analytics</span>
        </div>
        <div className="top-nav-links" aria-label="Primary navigation">
          {navItems.map((item) => (
            <a key={item} href={`#${item.toLowerCase()}`} className="nav-link">
              {item}
            </a>
          ))}
        </div>
        <div className="top-nav-actions">
          <button className="button button-text-link" type="button">
            Sign in
          </button>
          <button className="button button-primary" onClick={() => document.getElementById('upload')?.scrollIntoView({ behavior: 'smooth' })}>
            Try Apriori
          </button>
          <button className="icon-button mobile-only" type="button" aria-label="Open menu">
            <Menu size={18} />
          </button>
        </div>
      </nav>

      <main>
        <section id="overview" className="container hero-band">
          <div className="hero-copy">
            <span className="badge-coral">Association analysis</span>
            <h1 className="display-xl hero-title">Discover hidden patterns in your data.</h1>
            <p className="body-md hero-lead">
              Upload your transaction dataset, configure the Apriori algorithm, and instantly find frequent itemsets and association rules. Powered by a warm, editorial interface.
            </p>
            <div className="hero-actions">
              <a href="#upload" className="button button-primary">Start Analysis <ArrowRight size={16} /></a>
              <a href="#features" className="button button-secondary">Learn More</a>
            </div>
            <div className="hero-meta">
              <span className="pill"><Sparkles size={14} /> Fast CSV workflow</span>
              <span className="pill"><Search size={14} /> Preview + rules</span>
            </div>
          </div>
          
          <div className="card-dark code-window-card">
            <div className="code-window-header">
              <div className="window-dots" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
              <span className="caption">apriori-engine.py</span>
            </div>
            <div className="code-window-inner">
              <span className="code-token code-keyword">import</span> pandas <span className="code-token code-keyword">as</span> pd<br />
              <span className="code-token code-keyword">from</span> mlxtend.frequent_patterns <span className="code-token code-keyword">import</span> apriori<br /><br />
              <span className="code-token code-comment"># Generating association rules...</span><br />
              frequent_itemsets = apriori(df, min_support=0.01)<br />
              rules = association_rules(frequent_itemsets)<br />
              <span className="code-token code-accent">print</span>(rules.head())
            </div>
          </div>
        </section>

        <section id="features" className="container feature-grid">
          <article className="feature-card">
            <BarChart2 size={24} className="feature-icon" />
            <h2 className="title-md">Frequent itemsets</h2>
            <p className="body-md">See the strongest product relationships detected from your transactions.</p>
          </article>
          <article className="feature-card">
            <Settings size={24} className="feature-icon" />
            <h2 className="title-md">Tune thresholds</h2>
            <p className="body-md">Adjust support and confidence to control how strict the analysis is.</p>
          </article>
          <article className="feature-card">
            <Upload size={24} className="feature-icon" />
            <h2 className="title-md">Quick CSV flow</h2>
            <p className="body-md">Upload a file, set columns, and get results without extra setup.</p>
          </article>
        </section>

        <section id="upload" className="container section-padding">
          <div className="card">
            <div className="section-kicker">
              <Settings size={20} color="var(--colors-primary)" />
              <span className="badge-coral">Configuration</span>
            </div>
            <h2 className="display-md section-title">Setup your algorithm</h2>
            
            <form onSubmit={handleRunAlgorithm} className="form-grid">
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="caption" style={{ display: 'block', marginBottom: '8px' }}>Upload CSV Dataset</label>
                <div className="upload-dropzone">
                  <Upload size={32} color="var(--colors-primary)" style={{ marginBottom: '8px' }} />
                  <p className="body-md upload-name">{file ? file.name : "Drag & drop or click to upload"}</p>
                  <input type="file" accept=".csv" onChange={handleFileChange} style={{ display: 'none' }} id="file-upload" />
                  <label htmlFor="file-upload" className="button button-secondary">Select File</label>
                </div>
              </div>

              <div>
                <label className="caption" style={{ display: 'block', marginBottom: '8px' }}>Transaction Column Name</label>
                <input type="text" className="text-input" value={transactionCol} onChange={e => setTransactionCol(e.target.value)} placeholder="e.g. InvoiceNo" required />
              </div>

              <div>
                <label className="caption" style={{ display: 'block', marginBottom: '8px' }}>Item Column Name</label>
                <input type="text" className="text-input" value={itemCol} onChange={e => setItemCol(e.target.value)} placeholder="e.g. Description" required />
              </div>

              <div>
                <label className="caption" style={{ display: 'block', marginBottom: '8px' }}>Minimum Support</label>
                <input type="number" step="0.001" className="text-input" value={minSupport} onChange={e => setMinSupport(parseFloat(e.target.value))} required />
              </div>

              <div>
                <label className="caption" style={{ display: 'block', marginBottom: '8px' }}>Minimum Confidence</label>
                <input type="number" step="0.01" className="text-input" value={minConfidence} onChange={e => setMinConfidence(parseFloat(e.target.value))} required />
              </div>

              <div style={{ gridColumn: '1 / -1', marginTop: '16px' }}>
                <button type="submit" className="button button-primary" style={{ width: '100%' }} disabled={loading}>
                  {loading ? 'Processing...' : 'Run Apriori'} <ArrowRight size={16} />
                </button>
              </div>
            </form>

            {statusText && (
              <div style={{ marginTop: '16px', padding: '12px 14px', backgroundColor: 'var(--colors-surface-soft)', borderRadius: 'var(--rounded-md)', color: 'var(--colors-body-strong)' }}>
                {statusText}
              </div>
            )}
            
            {error && (
              <div style={{ marginTop: '24px', padding: '16px', backgroundColor: 'rgba(198, 69, 69, 0.1)', color: 'var(--colors-error)', borderRadius: 'var(--rounded-md)' }}>
                {error}
              </div>
            )}
          </div>
        </section>

        {results && (
          <section id="results" className="container section-padding">
            <h2 className="display-md section-title">Analysis Results</h2>
            {results.message && (
              <div style={{ marginBottom: '20px', padding: '12px 14px', backgroundColor: 'var(--colors-surface-soft)', borderRadius: 'var(--rounded-md)', color: 'var(--colors-body-strong)' }}>
                {results.message}
              </div>
            )}
            {results.stats && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                <div className="pill">Rows: {results.stats.rows_after_cleaning ?? '-'}</div>
                <div className="pill">Transactions: {results.stats.transactions ?? '-'}</div>
                <div className="pill">Items: {results.stats.items ?? '-'}</div>
                <div className="pill">Itemsets: {results.stats.frequent_itemsets_total ?? results.frequent_itemsets?.length ?? 0}</div>
              </div>
            )}
            
            <div className="results-grid">
              <div>
                <h3 className="title-lg section-subtitle">Dataset Preview</h3>
                <div className="table-shell">
                  <table>
                    <thead>
                      <tr>
                        {results.columns?.map(col => <th key={col}>{col}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {results.preview?.map((row, idx) => (
                        <tr key={idx}>
                          {results.columns?.map(col => <td key={col}>{row[col]}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="title-lg section-subtitle">Frequent Itemsets</h3>
                {results.frequent_itemsets?.length > 0 ? (
                  <div className="table-shell">
                    <table>
                      <thead>
                        <tr>
                          <th>Itemset</th>
                          <th>Support</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.frequent_itemsets.map((item, idx) => (
                          <tr key={idx}>
                            <td>{item.itemset.join(', ')}</td>
                            <td>{item.support}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="body-md">No frequent itemsets found. Try lowering the minimum support.</p>
                )}
              </div>

              <div>
                <h3 className="title-lg section-subtitle">Association Rules</h3>
                {results.association_rules?.length > 0 ? (
                  <div className="table-shell table-shell-soft">
                    <table>
                      <thead>
                        <tr>
                          <th>Antecedents</th>
                          <th>Consequents</th>
                          <th>Support</th>
                          <th>Confidence</th>
                          <th>Lift</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.association_rules.map((rule, idx) => (
                          <tr key={idx}>
                            <td>{rule.antecedents.join(', ')}</td>
                            <td>{rule.consequents.join(', ')}</td>
                            <td>{rule.support}</td>
                            <td>{rule.confidence}</td>
                            <td>{rule.lift}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="body-md">No rules generated. Try adjusting support or confidence thresholds.</p>
                )}
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="footer-band">
        <div className="container">
          <div className="top-nav-brand footer-brand">
            <span className="brand-mark brand-mark-dark" aria-hidden="true">*</span>
            <span className="title-md footer-title">Apriori Analytics</span>
          </div>
          <p className="body-sm">Designed with the cream, coral, and dark-surface system from `DESIGN.agent.md`.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;

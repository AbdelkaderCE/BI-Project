import { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { ArrowRight, BarChart2, BookOpen, Lightbulb, Link2, Menu, Search, Settings, Sparkles, Star, Target, Upload } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import './index.css';
import AprioriSteps from './components/AprioriSteps';
import AprioriDocumentation from './components/AprioriDocumentation';

const MAX_UPLOAD_MB = 25;
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const cardContainerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.08,
    },
  },
};

const cardItemVariants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.2 } },
};

function getConfidenceClass(confidence) {
  if (confidence >= 0.8) {
    return 'confidence-high';
  }
  if (confidence >= 0.6) {
    return 'confidence-medium';
  }
  return 'confidence-low';
}

// Extract category from product name (e.g., "ALARM CLOCK" → "ALARM")
function extractCategory(itemName) {
  const name = String(itemName).toUpperCase();
  const keywords = ['ALARM', 'CLOCK', 'BAG', 'BOX', 'SET', 'LANTERN', 'HEART', 'COAT', 'HANGER', 'BOTTLE', 'HAND', 'WARMER', 'BIRD', 'ORNAMENT', 'DOLL', 'POPPY', 'MUG', 'COSY', 'TEASPOON', 'JIGSAW', 'BLOCK', 'JAM', 'RACK', 'PARIS', 'CHARLOTTE', 'DOLLY', 'GIRL', 'FLOATING', 'POLITICAL', 'GLOBE', 'INFLATABLE', 'LUNCH', 'BOX', 'CIRCUS', 'PARADE'];
  for (const keyword of keywords) {
    if (name.includes(keyword)) {
      return keyword;
    }
  }
  return name.split(' ')[0] || 'ITEM';
}

// Map categories to distinct hues
function getCategoryColor(category) {
  const colorMap = {
    'ALARM': '#e8a55a',      // amber
    'CLOCK': '#d4a017',      // warm amber
    'BAG': '#cc785c',        // coral
    'BOX': '#c9876f',        // soft coral
    'SET': '#b8956a',        // warm brown
    'LANTERN': '#e8a55a',    // amber
    'HEART': '#ff9999',      // warm red
    'COAT': '#cc785c',       // coral
    'HANGER': '#9d7e6e',     // taupe
    'BOTTLE': '#8fb3a1',     // sage
    'HAND': '#c9876f',       // soft coral
    'WARMER': '#d4a017',     // warm amber
    'BIRD': '#7eb8a0',       // teal
    'ORNAMENT': '#e8a55a',   // amber
    'DOLL': '#cc785c',       // coral
    'POPPY': '#ff99bb',      // warm pink
    'MUG': '#8fb3a1',        // sage
    'COSY': '#c9876f',       // soft coral
    'TEASPOON': '#9d7e6e',   // taupe
    'JIGSAW': '#b8956a',     // warm brown
    'BLOCK': '#8fb3a1',      // sage
    'JAM': '#e8a55a',        // amber
    'RACK': '#b8956a',       // warm brown
    'PARIS': '#cc785c',      // coral
  };
  return colorMap[category] || '#5db8a6'; // default teal
}

const nodeVariants = {
  hidden: { opacity: 0, scale: 0.75 },
  visible: (index) => ({
    opacity: 1,
    scale: 1,
    transition: {
      delay: index * 0.05,
      duration: 0.55,
      ease: [0.16, 1, 0.3, 1],
    },
  }),
};

function createNodeLayout(nodes, width, height) {
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) * 0.32;

  const hashString = (value) => {
    let hash = 0;
    for (let index = 0; index < value.length; index += 1) {
      hash = (hash * 31 + value.charCodeAt(index)) % 1000;
    }
    return hash / 1000;
  };

  return new Map(
    nodes.map((node, index) => {
      const stableJitter = (hashString(node.name) - 0.5) * 0.28;
      const angle = (2 * Math.PI * index) / Math.max(nodes.length, 1) + stableJitter;
      return [
        node.name,
        {
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle),
        },
      ];
    })
  );
}

function buildRelationshipMapData(rules, topN = 10) {
  const topRules = rules.slice(0, topN);
  const nodeMap = new Map(); // item name → { support, category, color, connections }
  const edges = [];

  topRules.forEach((rule, index) => {
    const antecedents = Array.isArray(rule.antecedents) ? rule.antecedents : [];
    const consequents = Array.isArray(rule.consequents) ? rule.consequents : [];

    antecedents.forEach((antecedent) => {
      if (!nodeMap.has(antecedent)) {
        const category = extractCategory(antecedent);
        nodeMap.set(antecedent, {
          name: antecedent,
          support: rule.support || 0,
          category,
          color: getCategoryColor(category),
          connections: { inbound: [], outbound: [] },
        });
      }
    });

    consequents.forEach((consequent) => {
      if (!nodeMap.has(consequent)) {
        const category = extractCategory(consequent);
        nodeMap.set(consequent, {
          name: consequent,
          support: rule.support || 0,
          category,
          color: getCategoryColor(category),
          connections: { inbound: [], outbound: [] },
        });
      }
    });

    antecedents.forEach((antecedent) => {
      consequents.forEach((consequent) => {
        const edgeId = `${index}-${antecedent}-${consequent}`;
        edges.push({
          id: edgeId,
          from: antecedent,
          to: consequent,
          lift: Number(rule.lift) || 0,
          confidence: Number(rule.confidence) || 0,
          support: Number(rule.support) || 0,
        });

        nodeMap.get(antecedent).connections.outbound.push(consequent);
        nodeMap.get(consequent).connections.inbound.push(antecedent);
      });
    });
  });

  const nodes = Array.from(nodeMap.values());
  return { nodes, edges, totalRules: rules.length, displayedRules: topRules.length };
}

function Tooltip({ content, x, y }) {
  return (
    <motion.div
      className="map-tooltip"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.2 }}
      style={{
        position: 'absolute',
        left: `${x}px`,
        top: `${y}px`,
      }}
    >
      {content}
    </motion.div>
  );
}

function InsightsSidebar({ selectedNode, edges, nodes }) {
  if (!selectedNode) {
    return (
      <motion.div
        className="insights-sidebar"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ duration: 0.3 }}
      >
        <p className="body-sm insights-placeholder">Hover or click a node to see insights</p>
      </motion.div>
    );
  }

  // Find all rules involving this node
  const relatedEdges = edges.filter((e) => e.from === selectedNode.name || e.to === selectedNode.name);
  const avgLift = relatedEdges.length > 0 ? (relatedEdges.reduce((sum, e) => sum + e.lift, 0) / relatedEdges.length).toFixed(2) : 0;
  const maxConfidence = relatedEdges.length > 0 ? Math.max(...relatedEdges.map((e) => e.confidence)).toFixed(2) : 0;
  const inboundCount = relatedEdges.filter((e) => e.to === selectedNode.name).length;
  const outboundCount = relatedEdges.filter((e) => e.from === selectedNode.name).length;

  let insight = '';
  let title = 'Insights';
  let Icon = Lightbulb;

  if (avgLift > 1.5 && outboundCount > inboundCount) {
    insight = `Strong driver in bundles. When customers buy ${selectedNode.name.toLowerCase()}, they're ${(avgLift * 100).toFixed(0)}% more likely to buy related items.`;
    title = 'Bundling Opportunity';
    Icon = Target;
  } else if (avgLift > 1.5 && inboundCount > outboundCount) {
    insight = `Frequently paired with other items. ${selectedNode.name.toLowerCase()} appears in ${inboundCount} high-confidence rules.`;
    title = 'Popular Pairing';
    Icon = Link2;
  } else if (maxConfidence > 0.8) {
    insight = `High-confidence associations. Customers buying this item consistently buy complementary products (${(maxConfidence * 100).toFixed(0)}% confidence).`;
    title = 'High Confidence';
    Icon = Star;
  } else {
    insight = `Moderate associations detected. Consider promoting this item alongside related products for cross-selling opportunities.`;
    title = 'Cross-Sell Ready';
  }

  return (
    <motion.div
      className="insights-sidebar insights-active"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
    >
      <h4 className="insights-title">
        <Icon size={16} strokeWidth={2} className="insight-icon" aria-hidden="true" />
        <span>{title}</span>
      </h4>
      <p className="insights-content">{insight}</p>
      <div className="insights-stats">
        <div className="insights-stat">
          <span className="insights-label">Avg Lift</span>
          <span className="insights-value">{avgLift}</span>
        </div>
        <div className="insights-stat">
          <span className="insights-label">Max Conf.</span>
          <span className="insights-value">{maxConfidence}</span>
        </div>
        <div className="insights-stat">
          <span className="insights-label">Related Rules</span>
          <span className="insights-value">{relatedEdges.length}</span>
        </div>
      </div>
    </motion.div>
  );
}

function RelationshipMap({ rules, maxRulesToShow = 10 }) {
  const { nodes, edges, totalRules, displayedRules } = useMemo(
    () => buildRelationshipMapData(rules, maxRulesToShow),
    [rules, maxRulesToShow]
  );

  const width = 920;
  const height = 480;

  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [tooltipData, setTooltipData] = useState(null);
  const mapShellRef = useRef(null);
  const [mapShellSize, setMapShellSize] = useState({ width: width, height: height });
  const [nodePositions, setNodePositions] = useState(() => createNodeLayout(nodes, width, height));

  useEffect(() => {
    setNodePositions(createNodeLayout(nodes, width, height));
  }, [nodes, width, height]);

  const maxLift = Math.max(...edges.map((edge) => edge.lift), 1);
  const maxSupport = Math.max(...nodes.map((n) => n.support), 0.01);

  useEffect(() => {
    const updateShellSize = () => {
      if (!mapShellRef.current) {
        return;
      }

      const rect = mapShellRef.current.getBoundingClientRect();
      if (rect.width && rect.height) {
        setMapShellSize({ width: rect.width, height: rect.height });
      }
    };

    updateShellSize();
    window.addEventListener('resize', updateShellSize);

    return () => {
      window.removeEventListener('resize', updateShellSize);
    };
  }, []);

  const clampPosition = (value, min, max) => Math.min(Math.max(value, min), max);

  const getClampedTooltipPosition = (nodeX, nodeY) => {
    const renderedWidth = mapShellSize.width || width;
    const renderedHeight = mapShellSize.height || height;
    const scaleX = renderedWidth / width;
    const scaleY = renderedHeight / height;
    const tooltipWidth = 220;
    const tooltipHeight = 72;
    const padding = 12;

    const desiredLeft = nodeX * scaleX + 16;
    const desiredTop = nodeY * scaleY - 12;

    return {
      x: clampPosition(desiredLeft, padding, Math.max(padding, renderedWidth - tooltipWidth - padding)),
      y: clampPosition(desiredTop, padding, Math.max(padding, renderedHeight - tooltipHeight - padding)),
    };
  };

  const updateNodePosition = (nodeName, deltaX, deltaY) => {
    setNodePositions((currentPositions) => {
      const currentPoint = currentPositions.get(nodeName);
      if (!currentPoint) {
        return currentPositions;
      }

      const node = nodes.find((item) => item.name === nodeName);
      const nodeRadius = node ? 12 + (node.support / maxSupport) * 14 : 18;
      const padding = nodeRadius + 24;

      const nextX = clampPosition(currentPoint.x + deltaX, padding, width - padding);
      const nextY = clampPosition(currentPoint.y + deltaY, padding, height - padding);

      const nextPositions = new Map(currentPositions);
      nextPositions.set(nodeName, { x: nextX, y: nextY });
      return nextPositions;
    });
  };

  const handleNodeHover = (nodeName, x, y) => {
    setHoveredNode(nodeName);
    const tooltipPosition = getClampedTooltipPosition(x, y);
    setTooltipData({
      x: tooltipPosition.x,
      y: tooltipPosition.y,
      content: nodes.find((n) => n.name === nodeName)?.name || nodeName,
    });
  };

  const handleNodeLeave = () => {
    setHoveredNode(null);
    setTooltipData(null);
  };

  const handleNodeClick = (node) => {
    setSelectedNode(selectedNode?.name === node.name ? null : node);
  };

  if (!nodes.length || !edges.length) {
    return <p className="body-md">Not enough connected rules to draw a relationship map.</p>;
  }

  return (
    <div className="relationship-map-container">
      <div className="map-info-row">
        <p className="caption">Showing <strong>top {displayedRules}</strong> of {totalRules} rules by Lift</p>
      </div>
      <div className="relationship-map-wrapper">
        <div className="relationship-map-shell" ref={mapShellRef}>
          <svg viewBox={`0 0 ${width} ${height}`} className="relationship-map" role="img" aria-label="Visual relationship map of item associations">
            <defs>
              <marker id="arrowHead" markerWidth="8" markerHeight="5" refX="7" refY="2.5" orient="auto">
                <polygon points="0 0, 8 2.5, 0 5" fill="#cc785c" />
              </marker>
            </defs>

            {edges.map((edge) => {
              const from = nodePositions.get(edge.from);
              const to = nodePositions.get(edge.to);
              if (!from || !to) {
                return null;
              }

              const strokeWidth = 1 + (edge.lift / maxLift) * 6;
              const baseOpacity = 0.3 + (edge.lift / maxLift) * 0.6;
              const isRelatedToHovered = hoveredNode && (edge.from === hoveredNode || edge.to === hoveredNode);
              const isRelatedToSelected = selectedNode && (edge.from === selectedNode.name || edge.to === selectedNode.name);
              
              let opacity = baseOpacity;
              if ((hoveredNode || selectedNode) && !isRelatedToHovered && !isRelatedToSelected) {
                opacity *= 0.15;
              }

              return (
                <motion.line
                  key={edge.id}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke="#cc785c"
                  strokeOpacity={opacity}
                  strokeWidth={strokeWidth}
                  markerEnd="url(#arrowHead)"
                  initial={{ opacity: 0 }}
                  animate={{ opacity }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                />
              );
            })}

            {nodes.map((node, idx) => {
              const point = nodePositions.get(node.name);
              if (!point) {
                return null;
              }

              const nodeRadius = 12 + (node.support / maxSupport) * 14;
              const isHovered = hoveredNode === node.name;
              const isSelected = selectedNode?.name === node.name;

              return (
                <motion.g
                  key={node.name}
                  variants={nodeVariants}
                  custom={idx}
                  initial="hidden"
                  animate="visible"
                  whileHover={{ scale: 1.08, y: -2, transition: { duration: 0.22, ease: 'easeOut' } }}
                  whileTap={{ scale: 0.98, transition: { duration: 0.16, ease: 'easeOut' } }}
                  onPan={(event, info) => updateNodePosition(node.name, info.delta.x, info.delta.y)}
                  onPanStart={() => setSelectedNode(node)}
                  onHoverStart={() => handleNodeHover(node.name, point.x, point.y)}
                  onHoverEnd={handleNodeLeave}
                  onClick={() => handleNodeClick(node)}
                  style={{ cursor: 'grab' }}
                >
                  <motion.circle
                    cx={point.x}
                    cy={point.y}
                    r={nodeRadius}
                    fill={node.color}
                    stroke={isSelected ? '#141413' : '#e6dfd8'}
                    strokeWidth={isSelected ? 3 : 2}
                    animate={{
                      r: isHovered || isSelected ? nodeRadius * 1.3 : nodeRadius,
                      filter: isHovered || isSelected ? 'drop-shadow(0 8px 18px rgba(20,23,21,0.16))' : 'drop-shadow(0 0px 0px rgba(0,0,0,0))',
                    }}
                    transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                  />
                  <motion.text
                    x={point.x}
                    y={point.y + nodeRadius + 26}
                    textAnchor="middle"
                    className="map-node-label"
                    animate={{
                      opacity: isHovered || isSelected ? 1 : 0.7,
                      fontSize: isHovered || isSelected ? 13 : 12,
                      y: point.y + nodeRadius + (isHovered || isSelected ? 28 : 26),
                    }}
                    transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                  >
                    {node.name.length > 20 ? `${node.name.slice(0, 20)}…` : node.name}
                  </motion.text>
                </motion.g>
              );
            })}
          </svg>

          <AnimatePresence>
            {tooltipData && (
              <Tooltip x={tooltipData.x} y={tooltipData.y} content={tooltipData.content} />
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          <InsightsSidebar selectedNode={selectedNode} edges={edges} nodes={nodes} />
        </AnimatePresence>
      </div>
    </div>
  );
}

function App() {
  const [currentView, setCurrentView] = useState('home'); // 'home', 'documentation', 'upload', 'results'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [transactionCol, setTransactionCol] = useState('');
  const [itemCol, setItemCol] = useState('');
  const [minSupport, setMinSupport] = useState(0.01);
  const [minConfidence, setMinConfidence] = useState(0.5);
  
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [statusText, setStatusText] = useState('');
  const [supportFilter, setSupportFilter] = useState(0);

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
      setSupportFilter(Number(response.data?.stats?.adaptive_min_support ?? response.data?.stats?.used_min_support ?? 0));
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

  const associationRules = useMemo(() => {
    const source = results?.association_rules || [];
    return source
      .map((rule, index) => ({
        ...rule,
        id: `${index}-${(rule.antecedents || []).join('|')}-${(rule.consequents || []).join('|')}`,
        support: Number(rule.support) || 0,
        confidence: Number(rule.confidence) || 0,
        lift: Number(rule.lift) || 0,
      }))
      .sort((a, b) => b.lift - a.lift || b.confidence - a.confidence || b.support - a.support);
  }, [results]);

  const filteredRules = useMemo(() => {
    return associationRules.filter((rule) => rule.support >= supportFilter);
  }, [associationRules, supportFilter]);

  // Render documentation view if selected
  if (currentView === 'documentation') {
    return (
      <div className="App">
        <nav className="top-nav">
          <div className="top-nav-brand">
            <span className="brand-mark" aria-hidden="true">*</span>
            <span className="title-md">Apriori Analytics</span>
          </div>
          <div className="top-nav-links" aria-label="Primary navigation">
            <button 
              className="nav-link" 
              onClick={() => setCurrentView('home')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              Overview
            </button>
            <button 
              className="nav-link" 
              onClick={() => setCurrentView('documentation')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 600, color: 'var(--colors-primary)' }}
            >
              Learn
            </button>
            <button 
              className="nav-link" 
              onClick={() => setCurrentView('home')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              Upload
            </button>
          </div>
          <div className="top-nav-actions">
            <button className="button button-primary" onClick={() => { setCurrentView('home'); setMobileMenuOpen(false); }}>
              Try Apriori
            </button>
            <button
              className="icon-button mobile-only"
              type="button"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
              onClick={() => setMobileMenuOpen((s) => !s)}
            >
              <Menu size={18} />
            </button>
          </div>
          <div id="mobile-menu" className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`} role="region" aria-hidden={!mobileMenuOpen}>
            <div className="mobile-menu-inner">
              <button className="mobile-link" onClick={() => { setCurrentView('home'); setMobileMenuOpen(false); }}>Overview</button>
              <button className="mobile-link" onClick={() => { setCurrentView('documentation'); setMobileMenuOpen(false); }}>Learn</button>
              <button className="mobile-link" onClick={() => { setCurrentView('home'); setMobileMenuOpen(false); }}>Upload</button>
              <button className="mobile-link primary" onClick={() => { window.getElementById('upload')?.scrollIntoView({ behavior: 'smooth' }); setMobileMenuOpen(false); }}>Try Apriori</button>
            </div>
          </div>
        </nav>
        <main>
          <AprioriDocumentation />
        </main>
      </div>
    );
  }

  return (
    <div className="App">
      <nav className="top-nav">
        <div className="top-nav-brand">
          <span className="brand-mark" aria-hidden="true">*</span>
          <span className="title-md">Apriori Analytics</span>
        </div>
        <div className="top-nav-links" aria-label="Primary navigation">
          <button 
            className="nav-link" 
            onClick={() => { setCurrentView('home'); setMobileMenuOpen(false); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            Overview
          </button>
          <button 
            className="nav-link" 
            onClick={() => { setCurrentView('documentation'); setMobileMenuOpen(false); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            Learn
          </button>
          <button 
            className="nav-link" 
            onClick={() => { window.getElementById('upload')?.scrollIntoView({ behavior: 'smooth' }); setMobileMenuOpen(false); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            Upload
          </button>
        </div>
        <div className="top-nav-actions">
          <button className="button button-primary" onClick={() => { window.getElementById('upload')?.scrollIntoView({ behavior: 'smooth' }); setMobileMenuOpen(false); }}>
            Try Apriori
          </button>
          <button
            className="icon-button mobile-only"
            type="button"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMobileMenuOpen((s) => !s)}
          >
            <Menu size={18} />
          </button>
        </div>
        <div id="mobile-menu" className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`} role="region" aria-hidden={!mobileMenuOpen}>
          <div className="mobile-menu-inner">
            <button className="mobile-link" onClick={() => { setCurrentView('home'); setMobileMenuOpen(false); }}>Overview</button>
            <button className="mobile-link" onClick={() => { setCurrentView('documentation'); setMobileMenuOpen(false); }}>Learn</button>
            <button className="mobile-link" onClick={() => { window.getElementById('upload')?.scrollIntoView({ behavior: 'smooth' }); setMobileMenuOpen(false); }}>Upload</button>
            <button className="mobile-link primary" onClick={() => { window.getElementById('upload')?.scrollIntoView({ behavior: 'smooth' }); setMobileMenuOpen(false); }}>Try Apriori</button>
          </div>
        </div>
      </nav>

      <main>
        <motion.section 
          id="overview" 
          className="container hero-band"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <div className="hero-copy">
            <motion.span 
              className="badge-coral"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
            >
              Association analysis
            </motion.span>
            <motion.h1 
              className="display-xl hero-title"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              Discover hidden patterns in your data.
            </motion.h1>
            <motion.p 
              className="body-md hero-lead"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.5 }}
            >
              Upload your transaction dataset, configure the Apriori algorithm, and instantly find frequent itemsets and association rules. Powered by a warm, editorial interface.
            </motion.p>
            <motion.div 
              className="hero-actions"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <button onClick={() => window.getElementById('upload')?.scrollIntoView({ behavior: 'smooth' })} className="button button-primary">Start Analysis <ArrowRight size={16} /></button>
              <button onClick={() => setCurrentView('documentation')} className="button button-secondary">Learn More</button>
            </motion.div>
            <motion.div 
              className="hero-meta"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35, duration: 0.4 }}
            >
              <span className="pill"><Sparkles size={14} /> Fast CSV workflow</span>
              <span className="pill"><Search size={14} /> Preview + rules</span>
            </motion.div>
          </div>
          
          <motion.div 
            className="card-dark code-window-card"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25, duration: 0.5 }}
          >
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
          </motion.div>
        </motion.section>

        <motion.section 
          id="features" 
          className="container feature-grid"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <motion.article 
            className="feature-card"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            viewport={{ once: true }}
          >
            <BarChart2 size={24} className="feature-icon" />
            <h2 className="title-md">Frequent itemsets</h2>
            <p className="body-md">See the strongest product relationships detected from your transactions.</p>
          </motion.article>
          <motion.article 
            className="feature-card"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            viewport={{ once: true }}
          >
            <Settings size={24} className="feature-icon" />
            <h2 className="title-md">Tune thresholds</h2>
            <p className="body-md">Adjust support and confidence to control how strict the analysis is.</p>
          </motion.article>
          <motion.article 
            className="feature-card"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            viewport={{ once: true }}
            onClick={() => setCurrentView('documentation')} 
            style={{ cursor: 'pointer' }}
          >
            <BookOpen size={24} className="feature-icon" />
            <h2 className="title-md">Learn Apriori</h2>
            <p className="body-md">Understand definitions, algorithm steps, and calculation examples with interactive tooltips.</p>
          </motion.article>
        </motion.section>

        <motion.section 
          id="upload" 
          className="container section-padding"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <motion.div 
            className="card"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            viewport={{ once: true }}
          >
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
          </motion.div>
        </motion.section>

        {results && (
          <motion.section 
            id="results" 
            className="container section-padding"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <motion.h2 
              className="display-md section-title"
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              viewport={{ once: true }}
            >
              Analysis Results
            </motion.h2>
            <motion.div 
              style={{ marginBottom: 12 }}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              viewport={{ once: true }}
            >
              <div className="card">
                <AprioriSteps
                  results={results}
                  transactionCol={transactionCol}
                  itemCol={itemCol}
                  associationRules={associationRules}
                  usedMinSupport={results?.stats?.adaptive_min_support ?? results?.stats?.used_min_support}
                />
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              viewport={{ once: true }}
            >
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
            </motion.div>
            
            <motion.div 
              className="results-grid"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              viewport={{ once: true }}
            >
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
                <div className="rules-header-row">
                  <h3 className="title-lg section-subtitle">Association Rule Cards</h3>
                  <div className="support-filter-shell">
                    <label htmlFor="support-filter" className="caption">Filter by Support ≥ {supportFilter.toFixed(2)}</label>
                    <input
                      id="support-filter"
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={supportFilter}
                      onChange={(event) => setSupportFilter(Number(event.target.value))}
                    />
                  </div>
                </div>

                {associationRules.length > 0 ? (
                  <>
                    <motion.div
                      className="rule-cards-grid"
                      variants={cardContainerVariants}
                      initial="hidden"
                      animate="show"
                    >
                      <AnimatePresence mode="popLayout">
                        {filteredRules.map((rule) => (
                          <motion.article
                            key={rule.id}
                            className="rule-card"
                            variants={cardItemVariants}
                            initial="hidden"
                            animate="show"
                            exit="exit"
                            layout
                          >
                            <div className="rule-card-top">
                              <span className="badge-coral">Lift {rule.lift.toFixed(2)}</span>
                              <span className="caption">Support {rule.support.toFixed(2)}</span>
                            </div>
                            <p className="rule-direction">
                              <strong>{(rule.antecedents || []).join(', ')}</strong>
                              <span>→</span>
                              <strong>{(rule.consequents || []).join(', ')}</strong>
                            </p>
                            <div className="confidence-row">
                              <span className="caption">Confidence {rule.confidence.toFixed(2)}</span>
                              <div className="confidence-track">
                                <motion.div
                                  className={`confidence-fill ${getConfidenceClass(rule.confidence)}`}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${Math.max(0, Math.min(100, rule.confidence * 100))}%` }}
                                  transition={{ duration: 0.6, ease: 'easeOut' }}
                                />
                              </div>
                            </div>
                          </motion.article>
                        ))}
                      </AnimatePresence>
                    </motion.div>

                    {filteredRules.length === 0 && (
                      <p className="body-md">No rules match this support filter. Lower the filter to see more cards.</p>
                    )}

                    <div className="relationship-map-card">
                      <h3 className="title-lg section-subtitle">Visual Relationship Map</h3>
                      <p className="body-sm relationship-map-note">Thicker lines indicate stronger relationships by lift.</p>
                      <RelationshipMap rules={filteredRules} />
                    </div>
                  </>
                ) : (
                  <p className="body-md">No rules generated. Try adjusting support or confidence thresholds.</p>
                )}
              </div>
            </motion.div>
          </motion.section>
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

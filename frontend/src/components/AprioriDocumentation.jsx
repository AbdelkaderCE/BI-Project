import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, HelpCircle, ArrowRight, ChevronDown, Zap, TrendingUp, Target, Link2, Lightbulb, FileText, Search, Link, Scissors, BarChart3, RefreshCw, TrendingUpIcon } from 'lucide-react';
import './apriori-documentation.css';

// Reusable Tooltip Component
function TooltipTerm({ term, definition, children }) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <span
      className="tooltip-term"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onFocus={() => setShowTooltip(true)}
      onBlur={() => setShowTooltip(false)}
      tabIndex="0"
      role="button"
      aria-label={`${term}: ${definition}`}
    >
      {children || term}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            className="tooltip-popup"
            initial={{ opacity: 0, scale: 0.9, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 4 }}
            transition={{ duration: 0.2 }}
          >
            {definition}
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}

// Enhanced Definitions Section
function DefinitionsSection() {
  const definitions = [
    {
      term: 'Support',
      icon: Target,
      definition: 'The proportion of transactions containing an itemset. Measures frequency.',
      formula: 'Support(A) = Count(A) / Total Transactions',
      why: 'Tells you how popular an item or itemset is in your dataset. High support = common pattern.',
      example: 'In 100 transactions, if Milk appears 40 times: Support = 40% (0.40).',
    },
    {
      term: 'Confidence',
      icon: TrendingUp,
      definition: 'How likely B is purchased when A is purchased (conditional probability).',
      formula: 'Confidence(A→B) = Support(A,B) / Support(A)',
      why: 'Shows the strength of a rule. Higher confidence = stronger relationship.',
      example: 'If 80% of Milk buyers also buy Bread: Confidence(Milk→Bread) = 80%.',
    },
    {
      term: 'Lift',
      icon: Zap,
      definition: 'How much more likely B is purchased when A is purchased vs. independently.',
      formula: 'Lift(A→B) = Confidence(A→B) / Support(B)',
      why: 'Shows if items are truly related or just coincidentally frequent. Lift > 1 = positive correlation.',
      example: 'Lift = 1.5 means A buyers are 50% MORE likely to buy B than average.',
    },
    {
      term: 'Itemset',
      icon: Link2,
      definition: 'A collection of items. Can be 1-itemset {A}, 2-itemset {A,B}, or k-itemset.',
      formula: 'Itemset = {Item₁, Item₂, ..., Itemₖ}',
      why: 'The building block of association rules. We find frequent itemsets first.',
      example: '{Milk, Bread, Butter} is a 3-itemset from the same transaction.',
    },
    {
      term: 'Frequent Itemset',
      icon: Lightbulb,
      definition: 'An itemset appearing in ≥ min_support % of transactions.',
      formula: 'Support(Itemset) ≥ min_support threshold',
      why: 'Only frequent itemsets matter for business decisions. Pruning infrequent ones saves time.',
      example: 'If min_support = 5%, only itemsets in 5%+ of transactions are kept.',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  };

  return (
    <motion.section 
      className="documentation-section"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
    >
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
      >
        <h2 className="section-title">Core Concepts</h2>
        <p className="section-intro">Master the 5 essential metrics that power the Apriori algorithm.</p>
      </motion.div>

      <motion.div
        className="definitions-grid"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        {definitions.map((item, idx) => {
          const Icon = item.icon;
          return (
            <motion.article key={idx} className="definition-card enhanced" variants={itemVariants}>
              <div className="definition-icon-wrapper">
                <Icon size={24} className="definition-icon" aria-hidden="true" />
              </div>
              <h3 className="definition-term">{item.term}</h3>
              <p className="definition-text">{item.definition}</p>

              <div className="definition-section">
                <span className="section-label">Formula:</span>
                <div className="formula-box">{item.formula}</div>
              </div>

              <div className="definition-section">
                <span className="section-label">Why it matters:</span>
                <p className="definition-detail">{item.why}</p>
              </div>

              <div className="example-callout enhanced">
                <span className="example-label">Real example:</span>
                <p className="example-text">{item.example}</p>
              </div>
            </motion.article>
          );
        })}
      </motion.div>
    </motion.section>
  );
}

// Algorithm Steps Section
function AlgorithmStepsSection() {
  const steps = [
    {
      icon: FileText,
      title: 'Step 1: Data Preparation',
      description: 'Parse transactions and create a basket of items for each transaction.',
      details: [
        'Group items by transaction ID',
        'Clean missing values and filter outliers',
        'Each row becomes a basket of items',
        'Encode categorical items as identifiers',
      ],
      example: 'Input: Raw CSV with Tx ID and items. Output: Cleaned, basket-formatted data.',
    },
    {
      icon: Search,
      title: 'Step 2: Generate L1 (1-itemsets)',
      description: 'Count single items and filter by min_support.',
      details: [
        'Count occurrences of each item across transactions',
        'Calculate support: count / total_transactions',
        'Keep only items where support ≥ min_support',
        'Discard infrequent items (they can\'t form rules)',
      ],
      example: 'With min_support=30%: Milk (80%), Bread (70%), Beer (60%) → included. Sugar (20%) → discarded.',
    },
    {
      icon: Link,
      title: 'Step 3: Generate C2 (Candidate 2-itemsets)',
      description: 'Generate all possible pairs from L1 items.',
      details: [
        'Use F1F join (self-join of frequent 1-itemsets)',
        'Combine each pair of frequent items',
        'If L1 has 5 items, generate C(5,2) = 10 candidates',
        'Example: {Milk, Bread}, {Milk, Beer}, {Bread, Beer}, ...',
      ],
      example: 'L1 = {A, B, C} → C2 = {AB, AC, BC} (3 candidates)',
    },
    {
      icon: Scissors,
      title: 'Step 4: Prune C2 (Apriori Principle)',
      description: 'Keep only candidates whose subsets are frequent.',
      details: [
        'For each candidate, check all its (k-1)-subsets',
        'Discard if any subset is infrequent',
        'If {A,B} has infrequent subset {A}, discard {A,B}',
        'This is the key efficiency trick of Apriori',
      ],
      example: 'If {Milk} is infrequent, discard all 2-itemsets containing Milk.',
    },
    {
      icon: BarChart3,
      title: 'Step 5: Count & Generate L2',
      description: 'Count pruned candidates in transactions.',
      details: [
        'Scan all transactions once',
        'For each pruned candidate, count matches',
        'Calculate support for each candidate',
        'Keep only itemsets with support ≥ min_support',
      ],
      example: 'L2 = {AB (70%), AC (40%), BC (50%)} after filtering.',
    },
    {
      icon: RefreshCw,
      title: 'Step 6: Repeat for L3, L4, ...',
      description: 'Repeat steps 3–5 until no more itemsets.',
      details: [
        'Generate C3 from L2 using F1F join',
        'Prune C3 using Apriori Principle',
        'Count C3 and generate L3',
        'Stop when Lk is empty (no frequent k-itemsets)',
      ],
      example: 'If L2 has 5 itemsets, might generate 10 3-itemset candidates, prune to 3, find 1 is frequent → L3.',
    },
    {
      icon: TrendingUpIcon,
      title: 'Step 7: Generate Association Rules',
      description: 'Create rules from frequent itemsets.',
      details: [
        'For each frequent itemset with ≥2 items, create rules',
        'From {A,B,C}: Generate A→{B,C}, B→{A,C}, AB→{C}, etc.',
        'Calculate confidence, lift, and other metrics',
        'Filter rules by min_confidence threshold',
      ],
      example: 'From {Milk, Bread, Butter}: "Milk+Bread → Butter" with 85% confidence & 1.5 lift.',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  };

  return (
    <motion.section 
      className="documentation-section"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
    >
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
      >
        <h2 className="section-title">Algorithm Walkthrough</h2>
        <p className="section-intro">The Apriori algorithm unfolds in 7 phases. Click each step to see how it works.</p>
      </motion.div>
      
      <motion.div
        className="steps-list"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        {steps.map((step, idx) => (
          <motion.div key={idx} variants={itemVariants}>
            <StepCard step={step} index={idx + 1} />
          </motion.div>
        ))}
      </motion.div>
    </motion.section>
  );
}

function StepCard({ step, index }) {
  const [expanded, setExpanded] = useState(false);

  const detailsVariants = {
    hidden: { opacity: 0, height: 0 },
    visible: {
      opacity: 1,
      height: 'auto',
      transition: { duration: 0.3, ease: 'easeOut' },
    },
    exit: {
      opacity: 0,
      height: 0,
      transition: { duration: 0.2, ease: 'easeIn' },
    },
  };

  const chevronVariants = {
    collapsed: { rotate: 0 },
    expanded: { rotate: 180 },
  };

  return (
    <motion.article
      className="step-card enhanced"
      onClick={() => setExpanded(!expanded)}
      role="button"
      tabIndex="0"
      onKeyDown={(e) => e.key === 'Enter' && setExpanded(!expanded)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="step-card-header">
        <div className="step-badge">
          {step.icon && <step.icon size={24} className="step-icon" aria-hidden="true" />}
        </div>
        <div className="step-content-left">
          <h4 className="step-title">{step.title}</h4>
          <p className="step-description">{step.description}</p>
        </div>
        <motion.div 
          className="step-toggle"
          variants={chevronVariants}
          animate={expanded ? 'expanded' : 'collapsed'}
          transition={{ duration: 0.3 }}
          aria-hidden="true"
        >
          <ChevronDown size={20} />
        </motion.div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            className="step-details-wrapper"
            variants={detailsVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="step-details">
              <div className="step-details-content">
                <div className="details-list">
                  {step.details.map((detail, idx) => (
                    <motion.div 
                      key={idx} 
                      className="detail-item"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <span className="detail-bullet">→</span>
                      <span className="detail-text">{detail}</span>
                    </motion.div>
                  ))}
                </div>

                <div className="example-section">
                  <span className="example-label">Example:</span>
                  <p className="example-text">{step.example}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

// Calculation Visualization Section
function CalculationVisualizationSection() {
  const exampleData = {
    transactions: [
      { id: 'T1', items: ['Milk', 'Bread', 'Butter'] },
      { id: 'T2', items: ['Milk', 'Bread'] },
      { id: 'T3', items: ['Milk', 'Diapers'] },
      { id: 'T4', items: ['Bread', 'Diapers', 'Beer'] },
      { id: 'T5', items: ['Milk', 'Bread', 'Diapers', 'Beer'] },
      { id: 'T6', items: ['Milk', 'Diapers', 'Beer', 'Eggs'] },
      { id: 'T7', items: ['Bread', 'Diapers', 'Beer'] },
      { id: 'T8', items: ['Milk', 'Bread', 'Diapers', 'Beer'] },
      { id: 'T9', items: ['Milk', 'Diapers', 'Beer'] },
      { id: 'T10', items: ['Bread', 'Diapers'] },
    ],
  };

  const minSupport = 0.3; // 30%
  const minConfidence = 0.6; // 60%

  // Calculate item frequencies
  const itemCounts = {};
  exampleData.transactions.forEach((tx) => {
    tx.items.forEach((item) => {
      itemCounts[item] = (itemCounts[item] || 0) + 1;
    });
  });

  const L1 = Object.entries(itemCounts)
    .map(([item, count]) => ({
      item,
      count,
      support: count / exampleData.transactions.length,
    }))
    .filter((entry) => entry.support >= minSupport)
    .sort((a, b) => b.support - a.support);

  // Example rule calculation
  const exampleRule = {
    antecedent: 'Milk',
    consequent: 'Bread',
    supportMilk: (itemCounts['Milk'] || 0) / exampleData.transactions.length,
    supportBread: (itemCounts['Bread'] || 0) / exampleData.transactions.length,
    supportBoth: exampleData.transactions.filter((tx) => tx.items.includes('Milk') && tx.items.includes('Bread')).length / exampleData.transactions.length,
  };

  exampleRule.confidence = exampleRule.supportBoth / exampleRule.supportMilk;
  exampleRule.lift = exampleRule.confidence / exampleRule.supportBread;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  };

  const formulaRowVariants = {
    hidden: { opacity: 0, x: -15 },
    visible: (custom) => ({
      opacity: 1,
      x: 0,
      transition: { delay: custom * 0.08, duration: 0.4 },
    }),
  };

  return (
    <motion.section 
      className="documentation-section"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
    >
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
      >
        <h2 className="section-title">Calculation Example</h2>
        <p className="section-intro">Real example with 10 grocery transactions. min_support = 30%, min_confidence = 60%.</p>
      </motion.div>

      <motion.div
        className="calculation-grid"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <motion.article className="calculation-card" variants={cardVariants}>
          <h4 className="card-title">Sample Transactions (10 total)</h4>
          <div className="transaction-table">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Items</th>
                </tr>
              </thead>
              <tbody>
                {exampleData.transactions.map((tx) => (
                  <motion.tr 
                    key={tx.id}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ delay: 0.01 }}
                    viewport={{ once: true }}
                  >
                    <td className="tx-id">{tx.id}</td>
                    <td>{tx.items.join(', ')}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="table-caption">Raw data: Transaction IDs with purchased items</p>
        </motion.article>

        <motion.article className="calculation-card" variants={cardVariants}>
          <h4 className="card-title">Frequent 1-Itemsets (L1)</h4>
          <div className="itemset-table">
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Count</th>
                  <th>Support</th>
                  <th>Visual</th>
                </tr>
              </thead>
              <tbody>
                {L1.map((entry, idx) => (
                  <motion.tr 
                    key={entry.item}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    viewport={{ once: true }}
                  >
                    <td className="item-name">{entry.item}</td>
                    <td>{entry.count}</td>
                    <td><strong>{(entry.support * 100).toFixed(0)}%</strong></td>
                    <td>
                      <div className="support-bar-container">
                        <motion.div 
                          className="support-bar"
                          initial={{ width: 0 }}
                          whileInView={{ width: `${entry.support * 100}%` }}
                          transition={{ delay: idx * 0.05 + 0.2, duration: 0.5 }}
                          viewport={{ once: true }}
                        />
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="table-caption">Items with support ≥ 30% (meeting min_support threshold)</p>
        </motion.article>

        <motion.article className="calculation-card full-width" variants={cardVariants}>
          <h4 className="card-title">Rule Calculation: {exampleRule.antecedent} → {exampleRule.consequent}</h4>
          <p className="rule-intro">Here's how we measure the strength of the association rule "{exampleRule.antecedent} then {exampleRule.consequent}"</p>
          
          <div className="formula-section">
            <motion.div 
              className="formula-row"
              custom={0}
              variants={formulaRowVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <div className="formula-label">Support({exampleRule.antecedent}):</div>
              <div className="formula-calc">
                <span className="formula-fraction">{itemCounts['Milk']} / 10</span>
                <span className="formula-equals">=</span>
                <strong className="formula-result">{(exampleRule.supportMilk * 100).toFixed(0)}%</strong>
              </div>
              <p className="formula-note">Percentage of transactions containing {exampleRule.antecedent}</p>
            </motion.div>

            <motion.div 
              className="formula-row"
              custom={1}
              variants={formulaRowVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <div className="formula-label">Support({exampleRule.antecedent} ∩ {exampleRule.consequent}):</div>
              <div className="formula-calc">
                <span className="formula-fraction">{exampleData.transactions.filter((tx) => tx.items.includes('Milk') && tx.items.includes('Bread')).length} / 10</span>
                <span className="formula-equals">=</span>
                <strong className="formula-result">{(exampleRule.supportBoth * 100).toFixed(0)}%</strong>
              </div>
              <p className="formula-note">Percentage of transactions containing <strong>both</strong> items</p>
            </motion.div>

            <motion.div 
              className="formula-row highlight"
              custom={2}
              variants={formulaRowVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <div className="formula-label">Confidence({exampleRule.antecedent}→{exampleRule.consequent}):</div>
              <div className="formula-calc">
                <span className="formula-desc">Support(both) / Support({exampleRule.antecedent})</span>
                <br />
                <span className="formula-fraction">{(exampleRule.supportBoth * 100).toFixed(0)}% / {(exampleRule.supportMilk * 100).toFixed(0)}%</span>
                <span className="formula-equals">=</span>
                <strong className="formula-result">{(exampleRule.confidence * 100).toFixed(0)}%</strong>
              </div>
              <p className="formula-note">If someone buys {exampleRule.antecedent}, what's the chance they also buy {exampleRule.consequent}?</p>
            </motion.div>

            <motion.div 
              className="formula-row highlight"
              custom={3}
              variants={formulaRowVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <div className="formula-label">Lift({exampleRule.antecedent}→{exampleRule.consequent}):</div>
              <div className="formula-calc">
                <span className="formula-desc">Confidence / Support({exampleRule.consequent})</span>
                <br />
                <span className="formula-fraction">{(exampleRule.confidence * 100).toFixed(0)}% / {(exampleRule.supportBread * 100).toFixed(0)}%</span>
                <span className="formula-equals">=</span>
                <strong className="formula-result">{exampleRule.lift.toFixed(2)}x</strong>
              </div>
              <p className="formula-note">Buyers of {exampleRule.antecedent} are {(exampleRule.lift * 100).toFixed(0)}% more likely to buy {exampleRule.consequent} than average!</p>
            </motion.div>
          </div>

          <motion.div 
            className="business-insight"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h5>Business Impact</h5>
            <p>
              This rule is <strong>strong</strong> (confidence {(exampleRule.confidence * 100).toFixed(0)}% {`>`} threshold 60%) and <strong>has positive lift ({exampleRule.lift.toFixed(2)}x)</strong>, meaning it's a real opportunity, not random coincidence. 
              Recommendation: <strong>Bundle {exampleRule.antecedent} with {exampleRule.consequent}</strong> to boost cross-selling.
            </p>
          </motion.div>
        </motion.article>
      </motion.div>
    </motion.section>
  );
}

// Main Documentation Page
export default function AprioriDocumentation() {
  return (
    <div className="apriori-documentation">
      <motion.section 
        className="documentation-hero"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <motion.div 
          className="hero-content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <motion.div 
            className="hero-icon"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.3, duration: 0.5, type: 'spring', stiffness: 100 }}
          >
            <BookOpen size={32} aria-hidden="true" />
          </motion.div>
          <motion.h1 
            className="hero-title"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            Understanding the Apriori Algorithm
          </motion.h1>
          <motion.p 
            className="hero-lead"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            Learn how Apriori discovers frequent itemsets and association rules. Explore definitions, step-by-step walkthroughs, and real
            calculations with interactive examples.
          </motion.p>
        </motion.div>
      </motion.section>

      <div className="documentation-container">
        <DefinitionsSection />
        <AlgorithmStepsSection />
        <CalculationVisualizationSection />

        <section className="documentation-section">
          <div className="final-callout">
            <h2>Ready to try it out?</h2>
            <p>Upload your CSV dataset and run the Apriori algorithm on real data. See these concepts in action with live calculations.</p>
            <a href="#upload" className="button button-primary">
              Run Apriori <ArrowRight size={16} />
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}

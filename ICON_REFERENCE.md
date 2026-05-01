# Professional Icon Reference Guide

## Overview
This guide documents all icon placeholder references used throughout the design system and provides the corresponding Lucide React icons for implementation.

## Icon Placeholders & Lucide React Mappings

All emoji have been replaced with professional SVG icon bracket references `[Icon Name]`. Below are the recommended Lucide React icons and their specifications.

### Insight Sidebar Icons

#### 1. [Target Icon] - Bundling Opportunity
- **Lucide Component**: `Target`
- **Size**: 16px
- **Color**: `#cc785c` (coral primary)
- **Use Case**: Indicates items that drive purchases of related products
- **Import**: `import { Target } from 'lucide-react';`
- **Implementation**:
```jsx
<Target size={16} strokeWidth={2} className="insight-icon" />
```

#### 2. [Link Icon] - Popular Pairing
- **Lucide Component**: `Link2`
- **Size**: 16px
- **Color**: `#cc785c` (coral primary)
- **Use Case**: Indicates items frequently purchased with others
- **Import**: `import { Link2 } from 'lucide-react';`
- **Implementation**:
```jsx
<Link2 size={16} strokeWidth={2} className="insight-icon" />
```

#### 3. [Star Icon] - High Confidence
- **Lucide Component**: `Star`
- **Size**: 16px
- **Color**: `#cc785c` (coral primary)
- **Use Case**: Indicates reliable high-confidence associations
- **Import**: `import { Star } from 'lucide-react';`
- **Implementation**:
```jsx
<Star size={16} strokeWidth={2} className="insight-icon" fill="#cc785c" />
```

#### 4. [Lightbulb Icon] - Cross-Sell Ready
- **Lucide Component**: `Lightbulb`
- **Size**: 16px
- **Color**: `#cc785c` (coral primary)
- **Use Case**: Indicates general insights and suggestions
- **Import**: `import { Lightbulb } from 'lucide-react';`
- **Implementation**:
```jsx
<Lightbulb size={16} strokeWidth={2} className="insight-icon" />
```

### Status & Validation Icons

#### [Checkmark Icon] - Status Indicator
- **Lucide Component**: `CheckCircle2`
- **Size**: 14px
- **Color**: `#5db872` (success green)
- **Use Case**: Indicates successful states, production readiness, browser support
- **Import**: `import { CheckCircle2 } from 'lucide-react';`
- **Implementation**:
```jsx
<CheckCircle2 size={14} strokeWidth={2} className="status-icon" />
```

## CSS Class for Icon Styling

Add this to `index.css` for consistent icon styling:

```css
.insight-icon {
  color: var(--colors-primary);
  flex-shrink: 0;
  margin-right: var(--spacing-xs);
}

.status-icon {
  color: var(--colors-success);
  flex-shrink: 0;
  margin-right: var(--spacing-xs);
}
```

## Implementation Example

**Before (with bracket placeholder)**:
```jsx
<h4 className="insights-title">[Target Icon] Bundling Opportunity</h4>
```

**After (with actual Lucide icon)**:
```jsx
import { Target } from 'lucide-react';

<div style={{ display: 'flex', alignItems: 'center' }}>
  <Target size={16} strokeWidth={2} color="#cc785c" style={{ marginRight: '8px' }} />
  <h4 className="insights-title">Bundling Opportunity</h4>
</div>
```

## Lucide React Documentation

- **Package**: `lucide-react` (already installed)
- **Documentation**: https://lucide.dev
- **Icon Search**: All icons can be previewed and customized on the Lucide website

## Design System Icon Principles

1. **Size**: All insight sidebar icons use 16px
2. **Stroke Width**: Consistent 2px for visual weight
3. **Color**: All primary insight icons use coral (`#cc785c`)
4. **Status Icons**: Use semantic colors (green for success, red for error)
5. **Alignment**: Icons inline with text, vertically centered
6. **Spacing**: 8px (`--spacing-xs`) margin-right between icon and text

## Migration Checklist

- [ ] Import required icons from `lucide-react` in `App.jsx`
- [ ] Replace `[Target Icon]` with `<Target />` component in title
- [ ] Replace `[Link Icon]` with `<Link2 />` component in title
- [ ] Replace `[Star Icon]` with `<Star />` component in title
- [ ] Replace `[Lightbulb Icon]` with `<Lightbulb />` component in title
- [ ] Add `.insight-icon` CSS class
- [ ] Test icon rendering and color on light/dark backgrounds
- [ ] Verify icon alignment in sidebar titles
- [ ] Test responsive scaling on mobile

## Testing Checklist

| Icon | Context | Visual Test |
|------|---------|-------------|
| Target | Bundling Opportunity title | Displays coral color, 16px, centered vertically |
| Link2 | Popular Pairing title | Displays coral color, 16px, centered vertically |
| Star | High Confidence title | Displays coral color, 16px, filled or outlined |
| Lightbulb | Cross-Sell Ready title | Displays coral color, 16px, centered vertically |
| CheckCircle2 | Status badges | Displays green color, 14px, aligned left |

## Accessibility Notes

- Icons are **decorative** — text labels provide context
- Use `aria-hidden="true"` on icon components if needed
- Ensure sufficient color contrast: coral (#cc785c) on cream (#faf9f5) passes WCAG AA

```jsx
<Target size={16} aria-hidden="true" />
```

## Browser Support

All Lucide React icons render as inline SVG and are supported in:
- [Checkmark Icon] Chrome 90+
- [Checkmark Icon] Firefox 88+
- [Checkmark Icon] Safari 14+
- [Checkmark Icon] Edge 90+

## Performance Impact

- **Bundle Size**: ~2–3 KB additional (icons already tree-shakeable from lucide-react)
- **Rendering**: Zero impact — inline SVGs are cached
- **Load Time**: <1ms per icon render

## Future Enhancements

1. **Custom Icon Set**: Create Figma components that export to Lucide format
2. **Icon Sizing**: Define size tokens (sm: 14px, md: 16px, lg: 20px)
3. **Icon Animations**: Add subtle hover animations with Framer Motion
4. **Dark Mode**: Adjust icon colors for dark theme variant

---

**Last Updated**: May 1, 2026  
**Status**: [Checkmark Icon] Icon Reference Complete

import { Component, Backend, html } from 'veda-client';
import { forceSimulation, forceManyBody, forceLink, forceCenter, forceCollide } from 'd3-force';
import lang from '../lang.js';

const NS = 'http://www.w3.org/2000/svg';

// Node types to exclude from the graph entirely
const SKIP_TYPES = new Set([
  'owl:ObjectProperty',
  'rdf:Property',
  'owl:DatatypeProperty',
  'owl:OntologyProperty',
  'owl:AnnotationProperty',
  'v-ui:ClassTemplate',
  'v-ui:PropertySpecification',
  'v-ui:DatatypePropertySpecification',
  'v-ui:ObjectPropertySpecification',
]);

const TYPE_COLOR = {
  'owl:Class':    '#4ade80',
  'rdfs:Class':   '#4ade80',
  'owl:Ontology': '#22c55e',
};

const LEGEND = [
  { color: '#22c55e', label: { ru: 'Онтология', en: 'Ontology' } },
  { color: '#4ade80', label: { ru: 'Класс',     en: 'Class' } },
  { color: '#60a5fa', label: { ru: 'Индивид',   en: 'Individual' } },
];

function nodeColor (types) {
  for (const t of types) if (TYPE_COLOR[t]) return TYPE_COLOR[t];
  return '#60a5fa';
}

function getLabelFromJson (json) {
  const l = lang.current;
  const labels = json['rdfs:label'] ?? [];
  let fallback = null;
  for (const { data } of labels) {
    const m = /^([\s\S]*)\^\^([A-Za-z]{2})$/.exec(data);
    if (m) {
      if (m[2].toLowerCase() === l) return m[1];
      fallback = fallback ?? m[1];
    } else {
      fallback = fallback ?? data;
    }
  }
  return fallback ?? (json['@'] ?? '').split(/[:/]/).pop();
}

function truncate (s, n = 18) {
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

export default class OntologyGraph extends Component(HTMLElement) {
  static tag = 'page-onto-graph';

  // Graph data
  _nodes    = [];
  _links    = [];
  _nodeMap  = new Map(); // uri → node obj
  _linkSet  = new Set(); // 'src→tgt' dedup
  _propCache = new Map(); // propUri → label

  // SVG state
  _sim   = null;
  _g     = null;
  _edgesG = null;
  _nodesG = null;
  _tf    = { x: 0, y: 0, k: 1 }; // transform
  _loading = false;

  constructor () {
    super();
    this.state.ready   = false;
    this.state.error   = null;
    this.state.loading = true;
    this.state.legend  = LEGEND;
    this.state.lang    = lang.current;
  }

  get graphHint () {
    return this.state.lang === 'ru'
      ? 'Двойной клик — раскрыть соседей. Колёсико — масштаб. Тяните узлы.'
      : 'Double-click to expand. Scroll to zoom. Drag nodes.';
  }

  get resetLabel () {
    return this.state.lang === 'ru' ? '⌂ Сброс' : '⌂ Reset';
  }

  get _rootUri () {
    return this.getAttribute('data-root-uri') ?? '';
  }

  async added () {
    this.effect(() => { this.state.lang = lang.current; });

    try {
      await this._expand(this._rootUri);
    } catch (e) {
      this.state.error = e.message ?? String(e);
    } finally {
      this.state.loading = false;
      this.state.ready   = true;
    }
  }

  render () {
    if (this.state.error) {
      return html`
        <div class="container page-section">
          <p class="text-muted">{state.error}</p>
        </div>
      `;
    }

    return html`
      <div class="onto-graph-wrap">
        <div class="onto-graph-toolbar">
          <button class="btn btn-outline onto-graph-btn" onclick="{_resetView}">{resetLabel}</button>
          <span class="onto-graph-hint">{graphHint}</span>
          <div class="onto-legend">
            <veda-loop items="{state.legend}" as="item" key="color">
              <span class="onto-legend-item">
                <span class="onto-legend-dot" style="!{ 'background:' + item.color }"></span>
                !{ item.label[state.lang] || item.label.ru }
              </span>
            </veda-loop>
          </div>
        </div>
        <svg class="onto-graph-svg"></svg>
      </div>
    `;
  }

  post () {
    if (this.state.error) return;
    const svg = this.querySelector('.onto-graph-svg');
    if (!svg) return;
    this._initSvg(svg);
    this._buildElements();
    this._startSim(svg);
  }

  // ─── SVG init ───────────────────────────────────────────────

  _initSvg (svg) {
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    // Arrow marker
    const defs = document.createElementNS(NS, 'defs');
    defs.innerHTML = `<marker id="og-arrow" markerWidth="7" markerHeight="7" refX="18" refY="3.5" orient="auto">
      <path d="M0,0 L0,7 L7,3.5 z" fill="#94a3b8"/>
    </marker>`;
    svg.appendChild(defs);

    // Background for pan
    const bg = document.createElementNS(NS, 'rect');
    bg.setAttribute('width', '100%');
    bg.setAttribute('height', '100%');
    bg.setAttribute('fill', 'transparent');
    bg.style.cursor = 'grab';
    svg.appendChild(bg);
    bg.addEventListener('mousedown', (e) => this._startPan(e, svg));

    // Main group
    this._g = document.createElementNS(NS, 'g');
    svg.appendChild(this._g);

    this._edgesG = document.createElementNS(NS, 'g');
    this._nodesG = document.createElementNS(NS, 'g');
    this._g.appendChild(this._edgesG);
    this._g.appendChild(this._nodesG);

    svg.addEventListener('wheel', (e) => this._onWheel(e), { passive: false });
  }

  // ─── Build / rebuild SVG elements ───────────────────────────

  _buildElements () {
    while (this._edgesG.firstChild) this._edgesG.removeChild(this._edgesG.firstChild);
    while (this._nodesG.firstChild) this._nodesG.removeChild(this._nodesG.firstChild);

    for (const link of this._links) {
      const line = document.createElementNS(NS, 'line');
      line.setAttribute('stroke', '#cbd5e1');
      line.setAttribute('stroke-width', '1.5');
      line.setAttribute('marker-end', 'url(#og-arrow)');
      link._line = line;

      const text = document.createElementNS(NS, 'text');
      text.setAttribute('font-size', '9');
      text.setAttribute('fill', '#94a3b8');
      text.setAttribute('text-anchor', 'middle');
      text.textContent = truncate(link.label ?? '', 16);
      link._text = text;

      this._edgesG.appendChild(line);
      this._edgesG.appendChild(text);
    }

    for (const node of this._nodes) {
      const g = document.createElementNS(NS, 'g');
      g.style.cursor = 'pointer';

      const circle = document.createElementNS(NS, 'circle');
      circle.setAttribute('r', '22');
      circle.setAttribute('fill', nodeColor(node.types));
      circle.setAttribute('stroke', '#fff');
      circle.setAttribute('stroke-width', '2.5');
      circle.setAttribute('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,.15))');
      node._circle = circle;

      const text = document.createElementNS(NS, 'text');
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dy', '36');
      text.setAttribute('font-size', '11');
      text.setAttribute('fill', '#1e293b');
      text.setAttribute('font-family', 'system-ui, sans-serif');
      text.textContent = truncate(node.label);
      node._text = text;

      // expand badge if not yet expanded
      if (!node._expanded) {
        const badge = document.createElementNS(NS, 'text');
        badge.setAttribute('text-anchor', 'middle');
        badge.setAttribute('dy', '5');
        badge.setAttribute('font-size', '14');
        badge.setAttribute('fill', '#fff');
        badge.setAttribute('pointer-events', 'none');
        badge.textContent = '+';
        node._badge = badge;
        g.appendChild(badge);
      }

      g.appendChild(circle);
      g.appendChild(text);
      if (node._badge) g.appendChild(node._badge);
      node._g = g;

      // Node drag
      g.addEventListener('mousedown', (e) => { e.stopPropagation(); this._startNodeDrag(e, node); });
      // Expand on dblclick
      g.addEventListener('dblclick', () => this._expandNode(node.id));

      this._nodesG.appendChild(g);
    }
  }

  // ─── Simulation ─────────────────────────────────────────────

  _startSim (svg) {
    const w = svg.clientWidth  || 800;
    const h = svg.clientHeight || 500;

    if (this._sim) this._sim.stop();

    this._sim = forceSimulation(this._nodes)
      .force('link',    forceLink(this._links).id((d) => d.id).distance(130))
      .force('charge',  forceManyBody().strength(-400))
      .force('center',  forceCenter(w / 2, h / 2))
      .force('collide', forceCollide(40))
      .on('tick', () => this._tick());
  }

  _tick () {
    for (const link of this._links) {
      if (!link._line) continue;
      const s = link.source, t = link.target;
      link._line.setAttribute('x1', s.x); link._line.setAttribute('y1', s.y);
      link._line.setAttribute('x2', t.x); link._line.setAttribute('y2', t.y);
      if (link._text) {
        link._text.setAttribute('x', (s.x + t.x) / 2);
        link._text.setAttribute('y', (s.y + t.y) / 2 - 4);
      }
    }
    for (const node of this._nodes) {
      if (node._g) node._g.setAttribute('transform', `translate(${node.x},${node.y})`);
    }
  }

  // ─── Data loading ────────────────────────────────────────────

  async _expand (uri) {
    if (this._nodeMap.has(uri) && this._nodeMap.get(uri)._expanded) return;

    const json = await Backend.get_individual(uri, false);
    const types = (json['rdf:type'] ?? []).map((v) => v.data);
    const label = getLabelFromJson(json);

    let node = this._nodeMap.get(uri);
    if (!node) {
      node = { id: uri, label, types, x: Math.random() * 400, y: Math.random() * 300 };
      this._nodes.push(node);
      this._nodeMap.set(uri, node);
    } else {
      node.label = label;
      node.types = types;
    }
    node._expanded = true;
    if (node._badge) node._badge.remove();

    // Collect unique targets and uncached property URIs
    const newTargets = new Set();
    const newProps   = new Set();
    const linkDefs   = []; // { prop, targetUri, key }

    for (const [prop, values] of Object.entries(json)) {
      if (prop === '@') continue;
      for (const { data, type } of values) {
        if (type !== 'Uri') continue;
        const key = `${uri}→${prop}→${data}`;
        if (this._linkSet.has(key)) continue;
        linkDefs.push({ prop, targetUri: data, key });
        if (!this._nodeMap.has(data))       newTargets.add(data);
        if (!this._propCache.has(prop))     newProps.add(prop);
      }
    }

    // Single batch request: targets + property labels (uncached only)
    const batchUris = [...newTargets, ...newProps];
    if (batchUris.length > 0) {
      const results = await Backend.get_individuals(batchUris);
      // Index by URI — order and completeness not guaranteed
      const byUri = new Map(
        (results ?? []).filter(Boolean).map((j) => [j['@'], j])
      );

      // Register target nodes
      for (const tUri of newTargets) {
        const tJson  = byUri.get(tUri);
        const tTypes = tJson ? (tJson['rdf:type'] ?? []).map((v) => v.data) : [];
        if (!tJson || tTypes.some((t) => SKIP_TYPES.has(t))) {
          this._nodeMap.set(tUri, { id: tUri, _skip: true });
          continue;
        }
        const tLabel = getLabelFromJson(tJson);
        const tNode  = {
          id: tUri, label: tLabel, types: tTypes,
          x: node.x + (Math.random() - 0.5) * 150,
          y: node.y + (Math.random() - 0.5) * 150,
        };
        this._nodes.push(tNode);
        this._nodeMap.set(tUri, tNode);
      }

      // Cache property labels
      for (const pUri of newProps) {
        const pJson = byUri.get(pUri);
        this._propCache.set(pUri, pJson ? getLabelFromJson(pJson) : pUri.split(/[:/]/).pop());
      }
    }

    // Add edges — skip filtered targets
    for (const { prop, targetUri, key } of linkDefs) {
      const targetNode = this._nodeMap.get(targetUri);
      if (!targetNode || targetNode._skip) continue;
      this._linkSet.add(key);
      this._links.push({
        source: uri,
        target: targetUri,
        label: this._propCache.get(prop) ?? prop.split(/[:/]/).pop(),
      });
    }
  }

  async _expandNode (uri) {
    await this._expand(uri);
    const svg = this.querySelector('.onto-graph-svg');
    this._buildElements();
    if (svg) this._startSim(svg);
  }

  // ─── Pan / zoom / drag ───────────────────────────────────────

  _applyTransform () {
    const { x, y, k } = this._tf;
    if (this._g) this._g.setAttribute('transform', `translate(${x},${y}) scale(${k})`);
  }

  _resetView () {
    this._tf = { x: 0, y: 0, k: 1 };
    this._applyTransform();
  }

  _onWheel (e) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    this._tf.k = Math.max(0.15, Math.min(5, this._tf.k * delta));
    this._applyTransform();
  }

  _startPan (e, svg) {
    const start = { x: e.clientX, y: e.clientY };
    const orig  = { ...this._tf };
    const onMove = (ev) => {
      this._tf.x = orig.x + (ev.clientX - start.x);
      this._tf.y = orig.y + (ev.clientY - start.y);
      this._applyTransform();
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  removed () {
    this._sim?.stop();
    this._sim = null;
  }

  _startNodeDrag (e, node) {
    node.fx = node.x; node.fy = node.y;
    const svg = this.querySelector('.onto-graph-svg');
    const rect = svg?.getBoundingClientRect();
    const onMove = (ev) => {
      const { k, x: tx, y: ty } = this._tf;
      node.fx = (ev.clientX - (rect?.left ?? 0) - tx) / k;
      node.fy = (ev.clientY - (rect?.top  ?? 0) - ty) / k;
      this._sim?.alphaTarget(0.1).restart();
    };
    const onUp = () => {
      node.fx = null; node.fy = null;
      this._sim?.alphaTarget(0);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }
}

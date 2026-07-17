export default function createLayerFilterIndicators({
  getLegend,
  getViewer,
  layerFilterActiveClass,
  pluginLayerFilterActiveClass
}) {
  function normalizeLegendText(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function getLayerLegendLabels(layer) {
    if (!layer || typeof layer.get !== 'function') return [];
    const displayLabels = [layer.get('title'), layer.get('name')]
      .map(normalizeLegendText)
      .filter(Boolean);
    if (displayLabels.length > 0) return displayLabels;
    return [layer.get('id')].map(normalizeLegendText).filter(Boolean);
  }

  function getLegendIconButton(itemEl) {
    if (!itemEl || typeof itemEl.querySelectorAll !== 'function') return undefined;
    return Array.from(itemEl.querySelectorAll('button')).find(button => (
      button.classList.contains('round')
      && button.classList.contains('compact')
      && button.classList.contains('icon-small')
      && !button.classList.contains('o-layer_search_filter__action-button')
    ));
  }

  function collectLayerLegendIconElements(component, layer, iconElements, seenComponents) {
    if (!component || seenComponents.has(component)) return;
    seenComponents.add(component);

    if (
      typeof component.getLayer === 'function'
      && component.getLayer() === layer
      && typeof component.getId === 'function'
    ) {
      const itemEl = document.getElementById(component.getId());
      const iconEl = getLegendIconButton(itemEl);
      if (iconEl && !iconElements.includes(iconEl)) iconElements.push(iconEl);
    }

    if (typeof component.getComponents === 'function') {
      component.getComponents().forEach(childComponent => collectLayerLegendIconElements(
        childComponent,
        layer,
        iconElements,
        seenComponents
      ));
    }
  }

  function findLayerLegendIconElementsByText(layer) {
    const labels = getLayerLegendLabels(layer);
    if (labels.length === 0) return [];

    const legendItems = Array.from(document.querySelectorAll('.o-legend li'));
    return legendItems.reduce((iconElements, itemEl) => {
      const itemText = normalizeLegendText(itemEl.textContent);
      const isLayerItem = labels.some(label => (
        itemText === label || itemText.indexOf(label) !== -1
      ));
      const iconEl = isLayerItem ? getLegendIconButton(itemEl) : undefined;
      if (iconEl && !iconElements.includes(iconEl)) iconElements.push(iconEl);
      return iconElements;
    }, []);
  }

  function findLayerLegendIconElements(layer) {
    if (typeof document === 'undefined') return [];

    const iconElements = [];
    const seenComponents = new Set();
    const legendControl = getLegend() || (getViewer() && typeof getViewer().getControlByName === 'function'
      ? getViewer().getControlByName('legend')
      : undefined);
    const legendRoots = [legendControl];

    if (legendControl && typeof legendControl.getOverlays === 'function') {
      legendRoots.push(legendControl.getOverlays());
    }
    if (legendControl && typeof legendControl.getLayerSwitcherCmp === 'function') {
      legendRoots.push(legendControl.getLayerSwitcherCmp());
    }

    legendRoots.forEach(rootComponent => collectLayerLegendIconElements(
      rootComponent,
      layer,
      iconElements,
      seenComponents
    ));

    if (iconElements.length > 0) return iconElements;
    return findLayerLegendIconElementsByText(layer);
  }

  function syncLayerFilterLegendIndicators(layer, active) {
    findLayerLegendIconElements(layer).forEach((iconEl) => {
      iconEl.classList.toggle(layerFilterActiveClass, active);
      iconEl.classList.toggle(pluginLayerFilterActiveClass, active);
      if (active) {
        iconEl.setAttribute('data-layer-search-filter-active', 'true');
      } else {
        iconEl.removeAttribute('data-layer-search-filter-active');
      }
    });
  }

  function scheduleLayerFilterLegendIndicatorSync(layer, active) {
    syncLayerFilterLegendIndicators(layer, active);
    if (typeof window !== 'undefined' && typeof window.setTimeout === 'function') {
      window.setTimeout(() => syncLayerFilterLegendIndicators(layer, active), 0);
    }
  }

  function setLayerFilterActive(layer, active) {
    if (layer && typeof layer.set === 'function') {
      layer.set('filterActive', active);
      scheduleLayerFilterLegendIndicatorSync(layer, active);
    }
  }

  return {
    scheduleLayerFilterLegendIndicatorSync,
    setLayerFilterActive
  };
}

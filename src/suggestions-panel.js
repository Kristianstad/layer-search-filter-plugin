import {
  getSearchOperatorFromModes,
  getTextMatchModeForOperator,
  isEqualsSearchOperator,
  normalizeSearchOperator
} from './search-operators.js';

export default function createSuggestionsPanel({
  layerContext,
  localize,
  options,
  runtime,
  services
}) {
  const {
    activateLayerOnSuggestionClick,
    defaultNumericComparisonMode,
    defaultSearchMode,
    defaultTextMatchMode,
    maxZoomLevel,
    noResultsText,
    suggestionsTitle
  } = options;
  const suggestionSlidenavListeners = new Map();
  let suggestionsEl;
  let suggestionsTitleEl;
  let suggestionsStatusEl;
  let suggestionsListEl;
  let suggestionsResultCount;
  let activeSearchInputEl;

  function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function getMatchedAttribute(
    jsonFeature,
    attributes,
    searchText,
    matchMode = defaultTextMatchMode,
    comparisonMode = defaultNumericComparisonMode,
    searchModeValue = defaultSearchMode,
    rangeEndText = '',
    searchOperatorValue = getSearchOperatorFromModes(searchModeValue, matchMode, comparisonMode)
  ) {
    const properties = jsonFeature.properties || {};
    const matchedAttribute = attributes
      .filter(attribute => attribute && Object.prototype.hasOwnProperty.call(properties, attribute.name))
      .find(attribute => services.attributeValueMatchesSearch(
        attribute,
        properties[attribute.name],
        searchText,
        matchMode,
        comparisonMode,
        searchModeValue,
        rangeEndText,
        searchOperatorValue
      ));

    if (!matchedAttribute) return undefined;
    return {
      name: matchedAttribute.name,
      title: services.getAttributeTitle(matchedAttribute),
      displayName: services.getAttributeDisplayName(matchedAttribute),
      type: matchedAttribute.type,
      value: properties[matchedAttribute.name]
    };
  }

  function highlightMatchedValue(
    matchedAttribute,
    searchText,
    matchMode = defaultTextMatchMode,
    searchOperatorValue = getSearchOperatorFromModes(defaultSearchMode, matchMode, defaultNumericComparisonMode)
  ) {
    const value = String(matchedAttribute.value);
    const normalizedSearchText = String(searchText).trim();
    const normalizedSearchOperator = normalizeSearchOperator(searchOperatorValue, defaultSearchMode, matchMode, defaultNumericComparisonMode);

    if (!normalizedSearchText) return escapeHtml(value);

    if (matchedAttribute.type === 'string' || matchedAttribute.type === 'unknown') {
      if (isEqualsSearchOperator(normalizedSearchOperator)) {
        return value === normalizedSearchText
          ? `<strong>${escapeHtml(value)}</strong>`
          : escapeHtml(value);
      }
      const valueLower = value.toLowerCase();
      const searchLower = normalizedSearchText.toLowerCase();
      let matchIndex = valueLower.indexOf(searchLower);
      if (getTextMatchModeForOperator(normalizedSearchOperator, matchMode) === 'startsWith') {
        matchIndex = valueLower.startsWith(searchLower) ? 0 : -1;
      }
      if (matchIndex > -1) {
        const before = value.substring(0, matchIndex);
        const match = value.substring(matchIndex, matchIndex + normalizedSearchText.length);
        const after = value.substring(matchIndex + normalizedSearchText.length);
        return `${escapeHtml(before)}<strong>${escapeHtml(match)}</strong>${escapeHtml(after)}`;
      }
    }

    return `<strong>${escapeHtml(value)}</strong>`;
  }

  function getContainingGroupLayer(layer) {
    const { viewer } = runtime;
    if (!viewer || typeof viewer.getGroupLayers !== 'function') return undefined;
    return viewer.getGroupLayers().find(groupLayer => layerContext.getGroupDescendantLayers(groupLayer).includes(layer));
  }

  function ensureLayerVisible(layer) {
    if (!layer || typeof layer.getVisible !== 'function' || typeof layer.setVisible !== 'function') return;
    const groupLayer = getContainingGroupLayer(layer);
    if (groupLayer && typeof groupLayer.getVisible === 'function' && typeof groupLayer.setVisible === 'function' && !groupLayer.getVisible()) {
      groupLayer.setVisible(true);
    }
    if (!layer.getVisible()) layer.setVisible(true);
  }

  function ensureLayerVisibleForSuggestionClick(layer) {
    if (activateLayerOnSuggestionClick) ensureLayerVisible(layer);
  }

  function showFeatureOnMap(layer, feature) {
    ensureLayerVisibleForSuggestionClick(layer);
    services.setHighlightedFeatures([feature], { force: true });
    services.zoomToFeatures([feature]);
  }

  function showFeature(layer, feature) {
    if (!services.canOpenFeatureInfo(layer)) {
      showFeatureOnMap(layer, feature);
      return;
    }

    services.clearHighlightedFeatures();
    ensureLayerVisibleForSuggestionClick(layer);
    const level = maxZoomLevel || runtime.viewer.getResolutions().length - 2;
    runtime.featureInfo.showFeatureInfo({
      feature: [feature],
      layerName: layer.get('name')
    }, {
      maxZoomLevel: level,
      suppressDialog: false
    });
  }

  function position() {
    if (!suggestionsEl) return;

    const { viewer } = runtime;
    const parentEl = document.getElementById(viewer.getMain().getId()) || viewer.getMap().getTargetElement();
    const anchorEl = activeSearchInputEl && activeSearchInputEl.isConnected
      ? activeSearchInputEl
      : parentEl.querySelector('.o-layer_search_filter__input:focus') || parentEl.querySelector('.o-layer_search_filter__input');
    if (!anchorEl) return;

    const margin = 8;
    const gap = 8;
    const parentRect = parentEl.getBoundingClientRect();
    const anchorRect = anchorEl.getBoundingClientRect();
    const legendEl = parentEl.querySelector('.o-legend') || document.querySelector('.o-legend');
    const suggestionsWidth = Math.max(anchorRect.width, 240);
    const bottom = Math.max(parentRect.bottom - anchorRect.top, margin);

    if (legendEl) {
      const legendRect = legendEl.getBoundingClientRect();
      const availableLeftOfLegend = legendRect.left - parentRect.left - gap - margin;
      if (availableLeftOfLegend >= suggestionsWidth) {
        const legendBottom = Math.max(parentRect.bottom - legendRect.bottom, margin);
        suggestionsEl.style.right = `${Math.max(parentRect.right - legendRect.left + gap, margin)}px`;
        suggestionsEl.style.bottom = `${legendBottom}px`;
        suggestionsEl.style.width = `${suggestionsWidth}px`;
        return;
      }
    }

    suggestionsEl.style.right = `${Math.max(parentRect.right - anchorRect.right, margin)}px`;
    suggestionsEl.style.bottom = `${bottom}px`;
    suggestionsEl.style.width = `${suggestionsWidth}px`;
  }

  function hide({ clearResults = true } = {}) {
    if (!suggestionsEl) return;
    suggestionsEl.classList.add('hidden');
    if (!clearResults) return;
    suggestionsResultCount = undefined;
    suggestionsListEl.replaceChildren();
    suggestionsStatusEl.replaceChildren();
  }

  function destroy() {
    if (suggestionsEl) {
      window.removeEventListener('resize', position);
      suggestionsEl.remove();
    }
    suggestionsEl = undefined;
    suggestionsTitleEl = undefined;
    suggestionsStatusEl = undefined;
    suggestionsListEl = undefined;
    suggestionsResultCount = undefined;
    activeSearchInputEl = undefined;
  }

  function clearSlidenavListeners() {
    suggestionSlidenavListeners.forEach((listener, slidenavEl) => {
      slidenavEl.removeEventListener('slidenav:slide', listener);
    });
    suggestionSlidenavListeners.clear();
  }

  function ensure() {
    if (suggestionsEl) return suggestionsEl;

    const { viewer } = runtime;
    const targetEl = document.getElementById(viewer.getMain().getId()) || viewer.getMap().getTargetElement();
    suggestionsEl = document.createElement('div');
    suggestionsEl.className = 'o-layer_search_filter-suggestions hidden';
    suggestionsEl.innerHTML = `
      <div class="o-layer_search_filter-suggestions__header">
        <div class="o-layer_search_filter-suggestions__title"></div>
        <button class="o-layer_search_filter-suggestions__close" type="button" aria-label="Stäng sökresultat">×</button>
      </div>
      <div class="o-layer_search_filter-suggestions__status" aria-live="polite"></div>
      <ul class="o-layer_search_filter-suggestions__list"></ul>
    `;
    targetEl.appendChild(suggestionsEl);

    suggestionsTitleEl = suggestionsEl.querySelector('.o-layer_search_filter-suggestions__title');
    suggestionsStatusEl = suggestionsEl.querySelector('.o-layer_search_filter-suggestions__status');
    suggestionsListEl = suggestionsEl.querySelector('.o-layer_search_filter-suggestions__list');
    suggestionsEl.querySelector('.o-layer_search_filter-suggestions__close').addEventListener('click', () => hide());
    window.addEventListener('resize', position);
    return suggestionsEl;
  }

  function bindToSlidenav(targetEl) {
    const slidenavEl = targetEl.closest && targetEl.closest('.slidenav');
    if (!slidenavEl || suggestionSlidenavListeners.has(slidenavEl)) return;

    const onSlidenavSlide = (event) => {
      if (event.detail && event.detail.activeSlide === 'main') hide();
    };
    suggestionSlidenavListeners.set(slidenavEl, onSlidenavSlide);
    slidenavEl.addEventListener('slidenav:slide', onSlidenavSlide);
  }

  function getTitle(layer) {
    const resultCountText = Number.isInteger(suggestionsResultCount) ? ` (${suggestionsResultCount})` : '';
    return `${localize('suggestionsTitle', suggestionsTitle)}: ${layer.get('title') || layer.get('name')}${resultCountText}`;
  }

  function show(layer, resultCount) {
    ensure();
    if (arguments.length > 1) {
      suggestionsResultCount = Number.isInteger(resultCount) ? resultCount : undefined;
    }
    suggestionsTitleEl.replaceChildren(document.createTextNode(getTitle(layer)));
    position();
    suggestionsEl.classList.remove('hidden');
  }

  function setStatus(message, state = '') {
    ensure();
    suggestionsStatusEl.hidden = !message;
    suggestionsStatusEl.setAttribute('class', `o-layer_search_filter-suggestions__status ${state}`.trim());
    suggestionsStatusEl.replaceChildren(document.createTextNode(message));
  }

  function render(
    layer,
    results,
    searchText,
    attributes,
    matchMode = defaultTextMatchMode,
    comparisonMode = defaultNumericComparisonMode,
    searchModeValue = defaultSearchMode,
    rangeEndText = '',
    searchOperatorValue = getSearchOperatorFromModes(searchModeValue, matchMode, comparisonMode),
    renderOptions = {}
  ) {
    const { showPanel = true } = renderOptions;
    ensure();
    suggestionsListEl.replaceChildren();

    results.jsonFeatures.forEach((jsonFeature, index) => {
      const feature = results.features[index];
      const resultLayer = results.layers && results.layers[index] ? results.layers[index] : layer;
      const resultAttributes = results.attributes && results.attributes[index] ? results.attributes[index] : attributes;
      const matchedAttribute = getMatchedAttribute(
        jsonFeature,
        resultAttributes,
        searchText,
        matchMode,
        comparisonMode,
        searchModeValue,
        rangeEndText,
        searchOperatorValue
      );
      if (!matchedAttribute) return;

      const item = document.createElement('li');
      const button = document.createElement('button');
      const resultLayerTitle = resultLayer !== layer ? resultLayer.get('title') || resultLayer.get('name') : '';
      const matchedAttributeDisplayName = matchedAttribute.displayName || matchedAttribute.name;
      const resultDescription = resultLayerTitle
        ? `${matchedAttributeDisplayName} - ${resultLayerTitle}`
        : matchedAttributeDisplayName;
      button.type = 'button';
      button.className = 'o-layer_search_filter__result-button';
      button.innerHTML = `
        <span class="suggestion o-layer_search_filter__result-content">
          <span class="o-layer_search_filter__result-title">${highlightMatchedValue(matchedAttribute, searchText, matchMode, searchOperatorValue)}</span>
          <span class="o-layer_search_filter__result-description">${escapeHtml(resultDescription)}</span>
        </span>
      `;
      button.addEventListener('click', () => {
        hide({ clearResults: false });
        showFeature(resultLayer, feature);
      });
      item.appendChild(button);
      suggestionsListEl.appendChild(item);
    });

    const resultCount = suggestionsListEl.children.length;
    if (showPanel) {
      show(layer, resultCount);
    } else {
      suggestionsResultCount = resultCount;
    }

    if (resultCount === 0) setStatus(localize('noResultsText', noResultsText), 'empty');
  }

  return {
    bindToSlidenav,
    clearActiveInput(inputEl) {
      if (activeSearchInputEl === inputEl) activeSearchInputEl = undefined;
    },
    clearResults() {
      ensure();
      suggestionsListEl.replaceChildren();
    },
    clearSlidenavListeners,
    destroy,
    ensure,
    hasResults: () => Boolean(suggestionsListEl && suggestionsListEl.children.length > 0),
    hide,
    isActiveInput: inputEl => activeSearchInputEl === inputEl,
    render,
    setActiveInput(inputEl) {
      activeSearchInputEl = inputEl;
    },
    setStatus,
    show
  };
}

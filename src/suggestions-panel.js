import {
  getSearchOperatorFromModes,
  getTextMatchModeForOperator,
  isEqualsSearchOperator,
  normalizeSearchOperator
} from './search-operators.js';

const ALLOWED_RESULT_HTML_ELEMENTS = new Set([
  'abbr',
  'b',
  'br',
  'cite',
  'code',
  'em',
  'i',
  'mark',
  'q',
  's',
  'small',
  'strong',
  'sub',
  'sup',
  'u'
]);
const BLOCKED_RESULT_HTML_ELEMENTS = new Set([
  'base',
  'button',
  'embed',
  'form',
  'iframe',
  'input',
  'link',
  'math',
  'meta',
  'object',
  'option',
  'script',
  'select',
  'style',
  'svg',
  'textarea'
]);

function unwrapElement(element) {
  const { parentNode } = element;
  while (element.firstChild) parentNode.insertBefore(element.firstChild, element);
  parentNode.removeChild(element);
}

function sanitizeResultHtml(parent) {
  Array.from(parent.childNodes).forEach((node) => {
    if (node.nodeType === 3) return;
    if (node.nodeType !== 1) {
      node.remove();
      return;
    }

    const tagName = node.tagName.toLowerCase();
    if (BLOCKED_RESULT_HTML_ELEMENTS.has(tagName)) {
      node.remove();
      return;
    }

    sanitizeResultHtml(node);
    if (!ALLOWED_RESULT_HTML_ELEMENTS.has(tagName)) {
      unwrapElement(node);
      return;
    }

    Array.from(node.attributes).forEach(attribute => node.removeAttribute(attribute.name));
  });
}

function getTextNodeEntries(parent) {
  const entries = [];
  let offset = 0;

  function visit(node) {
    if (node.nodeType === 3) {
      const length = node.data.length;
      entries.push({ length, node, offset });
      offset += length;
      return;
    }
    Array.from(node.childNodes).forEach(visit);
  }

  visit(parent);
  return entries;
}

function emphasizeTextRange(fragment, start, length) {
  const end = start + length;
  getTextNodeEntries(fragment).forEach((entry) => {
    const entryEnd = entry.offset + entry.length;
    const selectionStart = Math.max(start, entry.offset);
    const selectionEnd = Math.min(end, entryEnd);
    if (selectionStart >= selectionEnd) return;

    const localStart = selectionStart - entry.offset;
    const selectionLength = selectionEnd - selectionStart;
    const matchedNode = localStart > 0 ? entry.node.splitText(localStart) : entry.node;
    if (selectionLength < matchedNode.data.length) matchedNode.splitText(selectionLength);
    const strong = document.createElement('strong');
    matchedNode.parentNode.replaceChild(strong, matchedNode);
    strong.appendChild(matchedNode);
  });
}

function emphasizeAll(fragment) {
  const strong = document.createElement('strong');
  strong.append(...Array.from(fragment.childNodes));
  fragment.appendChild(strong);
}

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
    const parser = new document.defaultView.DOMParser();
    const parsedDocument = parser.parseFromString(String(matchedAttribute.value), 'text/html');
    sanitizeResultHtml(parsedDocument.body);
    const fragment = document.createDocumentFragment();
    Array.from(parsedDocument.body.childNodes).forEach((node) => {
      fragment.appendChild(document.importNode(node, true));
    });

    const value = fragment.textContent;
    const normalizedSearchText = String(searchText).trim();
    const normalizedSearchOperator = normalizeSearchOperator(searchOperatorValue, defaultSearchMode, matchMode, defaultNumericComparisonMode);

    if (!normalizedSearchText) return fragment;

    if (matchedAttribute.type === 'string' || matchedAttribute.type === 'unknown') {
      if (isEqualsSearchOperator(normalizedSearchOperator)) {
        if (value === normalizedSearchText) emphasizeAll(fragment);
        return fragment;
      }
      const valueLower = value.toLowerCase();
      const searchLower = normalizedSearchText.toLowerCase();
      let matchIndex = valueLower.indexOf(searchLower);
      if (getTextMatchModeForOperator(normalizedSearchOperator, matchMode) === 'startsWith') {
        matchIndex = valueLower.startsWith(searchLower) ? 0 : -1;
      }
      if (matchIndex > -1) {
        emphasizeTextRange(fragment, matchIndex, normalizedSearchText.length);
        return fragment;
      }
    }

    emphasizeAll(fragment);
    return fragment;
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
      const resultContentEl = document.createElement('span');
      const resultTitleEl = document.createElement('span');
      const resultDescriptionEl = document.createElement('span');
      resultContentEl.className = 'suggestion o-layer_search_filter__result-content';
      resultTitleEl.className = 'o-layer_search_filter__result-title';
      resultDescriptionEl.className = 'o-layer_search_filter__result-description';
      resultTitleEl.appendChild(highlightMatchedValue(matchedAttribute, searchText, matchMode, searchOperatorValue));
      resultDescriptionEl.textContent = resultDescription;
      resultContentEl.append(resultTitleEl, resultDescriptionEl);
      button.appendChild(resultContentEl);
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

import { setPanelStatus } from './search-panel-view.js';

export default function createSearchActivation({
  actions,
  layer,
  localize,
  operatorMenu,
  options,
  searchExecution,
  services,
  state,
  view
}) {
  const {
    attributesEl,
    betweenInputEl,
    featureInfoForResultsButtonEl,
    filterButtonEl,
    inputEl,
    statusEl,
    zoomToResultsButtonEl
  } = view.elements;

  function setSearchControlsDisabled(disabled) {
    inputEl.disabled = disabled;
    if (filterButtonEl) filterButtonEl.disabled = disabled;
    if (zoomToResultsButtonEl) zoomToResultsButtonEl.disabled = disabled;
    if (featureInfoForResultsButtonEl) featureInfoForResultsButtonEl.disabled = disabled;
    operatorMenu.setDisabled(disabled);
    betweenInputEl.disabled = disabled;
  }

  function updateAttributeButtonsState() {
    Array.from(attributesEl.querySelectorAll('.o-layer_search_filter__attribute-button')).forEach((button) => {
      const isSelected = state.selectedAttributeNames.has(button.dataset.attributeName);
      button.classList.toggle('is-selected', isSelected);
      button.setAttribute('aria-pressed', String(isSelected));
    });
  }

  function handleAttributeSelectionChange() {
    const searchText = inputEl.value.trim();
    actions.persistUiState();
    if (searchText) {
      searchExecution.schedule();
      return;
    }

    searchExecution.invalidate();
    services.clearHighlightedFeatures();
    actions.suggestions.hide();
  }

  function renderAttributeButtons(attributes) {
    const attributeNames = new Set(state.discoveredAttributes.map(attribute => attribute.name));
    Array.from(state.selectedAttributeNames).forEach((attributeName) => {
      if (!attributeNames.has(attributeName)) state.selectedAttributeNames.delete(attributeName);
    });
    attributesEl.replaceChildren();

    const visibleAttributes = services.getSearchOperatorAttributes(attributes, state.currentSearchOperator);
    if (visibleAttributes.length === 0) {
      attributesEl.classList.add('hidden');
      actions.persistUiState();
      return;
    }

    const titleEl = document.createElement('div');
    titleEl.className = 'o-layer_search_filter__attributes-title';
    const attributeFilterTitle = `${localize('attributeFilterTitle', options.attributeFilterTitle)} (${visibleAttributes.length})`;
    titleEl.replaceChildren(document.createTextNode(attributeFilterTitle));

    const listEl = document.createElement('div');
    listEl.className = 'o-layer_search_filter__attributes-list';
    listEl.setAttribute('role', 'group');
    listEl.setAttribute('aria-label', attributeFilterTitle);

    visibleAttributes.forEach((attribute) => {
      const attributeButtonEl = document.createElement('button');
      attributeButtonEl.type = 'button';
      attributeButtonEl.className = 'o-layer_search_filter__attribute-button';
      attributeButtonEl.dataset.attributeName = attribute.name;
      attributeButtonEl.setAttribute('aria-pressed', 'false');
      const attributeDisplayName = services.getAttributeDisplayName(attribute);
      if (attributeDisplayName !== attribute.name) attributeButtonEl.setAttribute('title', attribute.name);
      attributeButtonEl.replaceChildren(document.createTextNode(attributeDisplayName));
      attributeButtonEl.addEventListener('click', () => {
        if (state.selectedAttributeNames.has(attribute.name)) {
          state.selectedAttributeNames.delete(attribute.name);
        } else {
          state.selectedAttributeNames.add(attribute.name);
        }
        updateAttributeButtonsState();
        handleAttributeSelectionChange();
      });
      listEl.appendChild(attributeButtonEl);
    });

    attributesEl.appendChild(titleEl);
    attributesEl.appendChild(listEl);
    attributesEl.classList.remove('hidden');
    updateAttributeButtonsState();
    actions.persistUiState();
  }

  function showReadyAttributes(attributes, { restore = false } = {}) {
    if (state.disposed) return;
    if (!state.activationStarted) {
      actions.persistUiState();
      return;
    }
    operatorMenu.updateState();
    renderAttributeButtons(attributes);
    setPanelStatus(statusEl, '');
    setSearchControlsDisabled(false);
    actions.persistUiState();
    if (!restore) inputEl.focus();
    if (searchExecution.hasCurrentSearchableInput(inputEl.value.trim())) searchExecution.schedule();
  }

  function activate({ restore = false } = {}) {
    if (state.disposed || state.activationStarted) return;
    state.activationStarted = true;
    view.elements.activateButtonEl.classList.add('hidden');
    view.elements.activateButtonEl.setAttribute('aria-expanded', 'true');
    view.elements.formEl.classList.remove('hidden');
    actions.updateActionsVisibility();
    actions.updateFooterVisibility();
    actions.persistUiState();
    if (!restore) inputEl.focus();

    services.prewarmFilterDialects(layer);
    if (state.discoveredAttributes.length > 0) {
      showReadyAttributes(state.discoveredAttributes, { restore });
      return;
    }
    if (state.discoveryFailed) {
      state.discoveryFailed = false;
      actions.persistUiState();
    }

    setPanelStatus(statusEl, localize('discoveringAttributesText', options.discoveringAttributesText), 'loading');
    services.discoverAttributes(layer)
      .then((attributes) => {
        if (state.disposed) return;
        state.discoveredAttributes = attributes;
        if (attributes.length === 0) {
          state.discoveryFailed = true;
          const missingLayerDataText = services.hasSearchableLayerData(layer)
            ? localize('noAttributesText', options.noAttributesText)
            : localize('unsupportedLayerText', options.unsupportedLayerText);
          actions.persistUiState();
          if (state.activationStarted) setPanelStatus(statusEl, missingLayerDataText, 'error');
          return;
        }
        state.discoveryFailed = false;
        showReadyAttributes(attributes, { restore });
      })
      .catch((error) => {
        if (state.disposed) return;
        state.discoveryFailed = true;
        actions.persistUiState();
        if (!state.activationStarted) return;
        console.error(`${options.name}: layer attribute discovery failed`, error);
        setPanelStatus(statusEl, localize('noAttributesText', options.noAttributesText), 'error');
      });
  }

  return {
    activate,
    renderAttributeButtons,
    setSearchControlsDisabled
  };
}

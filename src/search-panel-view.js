function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getVerticalScrollContainer(startEl) {
  let parentEl = startEl.parentElement;

  while (parentEl && parentEl !== document.documentElement) {
    const { overflowY } = window.getComputedStyle(parentEl);
    if (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') return parentEl;
    parentEl = parentEl.parentElement;
  }

  return undefined;
}

export function setPanelStatus(statusEl, message, state = '') {
  const visibleMessage = message || '';
  statusEl.toggleAttribute('hidden', !visibleMessage);
  statusEl.setAttribute('class', `o-layer_search_filter__status ${state}`.trim());
  statusEl.replaceChildren(document.createTextNode(visibleMessage));
}

export default function createSearchPanelView({
  cmp,
  layer,
  layerContext,
  localize,
  options
}) {
  const targetEl = document.getElementById(cmp.getId());
  if (!targetEl || targetEl.querySelector('.o-layer_search_filter')) return undefined;

  const hasActivationButtonText = options.buttonText !== null
    && options.buttonText !== undefined
    && String(options.buttonText).trim() !== '';
  const localizedButtonText = hasActivationButtonText ? localize('buttonText', options.buttonText) : '';
  const activationButtonLabel = localizedButtonText === null || localizedButtonText === undefined
    ? ''
    : String(localizedButtonText).trim();
  const activationButtonClass = `o-layer_search_filter__activate-button${activationButtonLabel ? '' : ' o-layer_search_filter__activate-button--icon-only'}`;
  const activationButtonAriaLabel = activationButtonLabel || localize('title', options.title) || 'Sök';
  const activationButtonTextHtml = activationButtonLabel ? `<span>${escapeHtml(activationButtonLabel)}</span>` : '';
  const hasLayerVisibilityButton = options.showLayerVisibilityButton !== false;
  const hasFilterButton = options.showFilterButton !== false;
  const hasZoomToResultsButton = options.showZoomToResultsButton !== false;
  const hasFeatureInfoForResultsButton = options.showFeatureInfoForResultsButton !== false
    && layerContext.hasQueryableSearchTarget(layer);
  const hasCloseSearchButton = options.showCloseSearchButton !== false;
  const hasActionButtons = hasLayerVisibilityButton
    || hasFilterButton
    || hasZoomToResultsButton
    || hasFeatureInfoForResultsButton;
  const layerVisibilityLabel = layerContext.getLayerVisibilityLabel(layer);
  const layerVisibilityButtonHtml = hasLayerVisibilityButton ? `
      <button class="o-layer_search_filter__visibility-button round small icon-smaller no-shrink" type="button" aria-pressed="${String(layer.getVisible())}" aria-label="${escapeHtml(layerVisibilityLabel)}" title="${escapeHtml(layerVisibilityLabel)}">
        <span class="icon grey"><svg class="grey"><use xlink:href="${layerContext.getLayerVisibilityIcon(layer)}"></use></svg></span>
      </button>` : '';
  const filterButtonLabel = localize('filterButtonTitle', options.filterButtonTitle);
  const filterButtonHtml = hasFilterButton ? `
      <button class="o-layer_search_filter__filter-button o-layer_search_filter__action-button round light compact icon-small" type="button" aria-pressed="false" aria-label="${escapeHtml(filterButtonLabel)}" title="${escapeHtml(filterButtonLabel)}">
        <span class="icon grey">
          <svg class="o-layer_search_filter__filter-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M4.25 5.61C6.27 8.2 10 13 10 13v6c0 .55.45 1 1 1h2c.55 0 1-.45 1-1v-6s3.72-4.8 5.74-7.39C20.25 4.95 19.78 4 18.95 4H5.04c-.83 0-1.3.95-.79 1.61z"></path>
          </svg>
        </span>
      </button>` : '';
  const zoomButtonLabel = localize('zoomToResultsButtonTitle', options.zoomToResultsButtonTitle);
  const zoomToResultsButtonHtml = hasZoomToResultsButton ? `
      <button class="o-layer_search_filter__zoom-to-results-button o-layer_search_filter__action-button round light compact icon-small" type="button" aria-label="${escapeHtml(zoomButtonLabel)}" title="${escapeHtml(zoomButtonLabel)}">
        <span class="icon grey">
          <svg class="o-layer_search_filter__zoom-to-results-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M15 3l2.3 2.3-2.89 2.87 1.42 1.42L18.7 6.7 21 9V3h-6zM3 9l2.3-2.3 2.87 2.89 1.42-1.42L6.7 5.3 9 3H3v6zm6 12l-2.3-2.3 2.89-2.87-1.42-1.42L5.3 17.3 3 15v6h6zm12-6l-2.3 2.3-2.87-2.89-1.42 1.42 2.89 2.87L15 21h6v-6z"></path>
          </svg>
        </span>
      </button>` : '';
  const featureInfoButtonLabel = localize('featureInfoForResultsButtonTitle', options.featureInfoForResultsButtonTitle);
  const featureInfoForResultsButtonHtml = hasFeatureInfoForResultsButton ? `
      <button class="o-layer_search_filter__feature-info-results-button o-layer_search_filter__action-button round light compact icon-small" type="button" aria-label="${escapeHtml(featureInfoButtonLabel)}" title="${escapeHtml(featureInfoButtonLabel)}">
        <span class="icon grey">
          <svg class="o-layer_search_filter__feature-info-results-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M11 17h2v-6h-2v6zm1-15C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-11h2V7h-2v2z"></path>
          </svg>
        </span>
      </button>` : '';
  const closeButtonLabel = localize('closeSearchButtonTitle', options.closeSearchButtonTitle);
  const closeSearchButtonHtml = hasCloseSearchButton ? `
      <button class="o-layer_search_filter__close-button o-layer_search_filter__action-button round light compact icon-small" type="button" aria-label="${escapeHtml(closeButtonLabel)}" title="${escapeHtml(closeButtonLabel)}">
        <span class="icon grey"><svg class="grey"><use xlink:href="#ic_close_24px"></use></svg></span>
      </button>` : '';
  const wrapper = document.createElement('div');
  wrapper.className = 'o-layer_search_filter padding-small padding-x text-small';
  wrapper.innerHTML = `
    <button class="${activationButtonClass}" type="button" aria-expanded="false" aria-label="${escapeHtml(activationButtonAriaLabel)}">
      <span class="icon grey"><svg class="grey"><use xlink:href="#ic_search_24px"></use></svg></span>
      ${activationButtonTextHtml}
    </button>
    <form class="o-layer_search_filter__form hidden" aria-label="${escapeHtml(localize('title', options.title))}">
      <div class="o-layer_search_filter__control o-search o-search-false flex row align-center padding-right-small">
        <input class="o-layer_search_filter__input o-search-field form-control text-grey-darker" type="text" autocomplete="off" placeholder="${escapeHtml(localize('placeholder', options.placeholder))}" />
        <button class="o-layer_search_filter__icon-button o-layer_search_filter__search-button o-search-button no-shrink no-grow compact icon-small" type="submit" aria-label="Sök">
          <span class="icon grey"><svg class="grey"><use xlink:href="#ic_search_24px"></use></svg></span>
        </button>
        <button class="o-layer_search_filter__icon-button o-layer_search_filter__clear-button o-search-button-close no-shrink no-grow compact icon-small" type="button" aria-label="Rensa sökning">
          <span class="icon grey"><svg class="grey"><use xlink:href="#ic_close_24px"></use></svg></span>
        </button>
      </div>
      <div class="o-layer_search_filter__between-control hidden">
        <input class="o-layer_search_filter__between-input text-grey-darker" type="text" autocomplete="off" placeholder="${escapeHtml(localize('numericComparisonBetweenEndPlaceholder', options.numericComparisonBetweenEndPlaceholder))}" aria-label="${escapeHtml(localize('numericComparisonBetweenEndPlaceholder', options.numericComparisonBetweenEndPlaceholder))}" />
      </div>
    </form>
    <div class="o-layer_search_filter__actions hidden" role="toolbar" aria-label="${escapeHtml(localize('filterActionsTitle', options.filterActionsTitle))}">
      ${layerVisibilityButtonHtml}
      ${filterButtonHtml}
      ${zoomToResultsButtonHtml}
      ${featureInfoForResultsButtonHtml}
      <div class="o-layer_search_filter__operator hidden">
        <select class="o-layer_search_filter__operator-select" aria-hidden="true" tabindex="-1"></select>
        <button class="o-layer_search_filter__operator-button" type="button" aria-haspopup="listbox" aria-expanded="false" aria-label="${escapeHtml(localize('searchOperatorTitle', options.searchOperatorTitle))}" title="${escapeHtml(localize('searchOperatorTitle', options.searchOperatorTitle))}">
          <span class="o-layer_search_filter__operator-button-text"></span>
        </button>
        <div class="o-layer_search_filter__operator-menu hidden" role="listbox" aria-label="${escapeHtml(localize('searchOperatorTitle', options.searchOperatorTitle))}"></div>
      </div>
    </div>
    <div class="o-layer_search_filter__attributes hidden" aria-label="${escapeHtml(localize('attributeFilterTitle', options.attributeFilterTitle))}"></div>
    <div class="o-layer_search_filter__footer hidden">
      <div class="o-layer_search_filter__status" aria-live="polite" hidden></div>
      ${closeSearchButtonHtml}
    </div>
  `;
  targetEl.appendChild(wrapper);

  const elements = {
    actionsEl: wrapper.querySelector('.o-layer_search_filter__actions'),
    activateButtonEl: wrapper.querySelector('.o-layer_search_filter__activate-button'),
    attributesEl: wrapper.querySelector('.o-layer_search_filter__attributes'),
    betweenControlEl: wrapper.querySelector('.o-layer_search_filter__between-control'),
    betweenInputEl: wrapper.querySelector('.o-layer_search_filter__between-input'),
    clearButtonEl: wrapper.querySelector('.o-layer_search_filter__clear-button'),
    closeSearchButtonEl: wrapper.querySelector('.o-layer_search_filter__close-button'),
    controlEl: wrapper.querySelector('.o-layer_search_filter__control'),
    featureInfoForResultsButtonEl: wrapper.querySelector('.o-layer_search_filter__feature-info-results-button'),
    filterButtonEl: wrapper.querySelector('.o-layer_search_filter__filter-button'),
    footerEl: wrapper.querySelector('.o-layer_search_filter__footer'),
    formEl: wrapper.querySelector('.o-layer_search_filter__form'),
    inputEl: wrapper.querySelector('.o-layer_search_filter__input'),
    layerVisibilityButtonEl: wrapper.querySelector('.o-layer_search_filter__visibility-button'),
    operatorButtonEl: wrapper.querySelector('.o-layer_search_filter__operator-button'),
    operatorButtonTextEl: wrapper.querySelector('.o-layer_search_filter__operator-button-text'),
    operatorEl: wrapper.querySelector('.o-layer_search_filter__operator'),
    operatorMenuEl: wrapper.querySelector('.o-layer_search_filter__operator-menu'),
    operatorSelectEl: wrapper.querySelector('.o-layer_search_filter__operator-select'),
    statusEl: wrapper.querySelector('.o-layer_search_filter__status'),
    zoomToResultsButtonEl: wrapper.querySelector('.o-layer_search_filter__zoom-to-results-button')
  };
  elements.layerVisibilityIconUseEl = elements.layerVisibilityButtonEl
    ? elements.layerVisibilityButtonEl.querySelector('use')
    : undefined;
  const footerScrollContainerEl = getVerticalScrollContainer(targetEl);
  if (footerScrollContainerEl && footerScrollContainerEl.parentElement) {
    footerScrollContainerEl.classList.add('o-layer_search_filter__scroll-container--docked-footer');
    elements.footerEl.classList.add('o-layer_search_filter__footer--docked');
    footerScrollContainerEl.insertAdjacentElement('afterend', elements.footerEl);
  }

  return {
    elements,
    footerScrollContainerEl,
    hasActionButtons,
    layerPanelSlidenavEl: targetEl.closest && targetEl.closest('.slidenav'),
    targetEl,
    wrapper
  };
}

import {
  getNumericComparisonModeForOperator,
  getSearchModeForOperator,
  getSearchOperatorFromModes,
  getTextMatchModeForOperator,
  isBetweenSearchOperator,
  normalizeSearchOperator
} from './search-operators.js';

export default function createSearchOperatorMenu({
  actions,
  localize,
  options,
  searchOperatorOptions,
  services,
  state,
  view
}) {
  const {
    betweenControlEl,
    betweenInputEl,
    inputEl,
    operatorButtonEl,
    operatorButtonTextEl,
    operatorEl,
    operatorMenuEl,
    operatorSelectEl
  } = view.elements;
  const operatorMenuParentEl = operatorMenuEl.parentElement;
  const operatorMenuNextSibling = operatorMenuEl.nextSibling;
  let operatorOutsidePointerDownActive = false;
  let operatorViewportListenersActive = false;

  function getSearchOperatorOption(operator) {
    const normalizedOperator = normalizeSearchOperator(operator);
    return searchOperatorOptions.find(operatorOption => operatorOption.value === normalizedOperator)
      || searchOperatorOptions[0];
  }

  function getSearchOperatorLabel(operator) {
    const operatorOption = getSearchOperatorOption(operator);
    return localize(operatorOption.titleKey, operatorOption.titleFallback);
  }

  function getSearchOperatorOptionText(operator) {
    const operatorOption = getSearchOperatorOption(operator);
    return localize(operatorOption.optionKey, operatorOption.optionFallback);
  }

  function syncCurrentSearchOperatorDetails() {
    state.currentSearchOperator = normalizeSearchOperator(
      state.currentSearchOperator,
      state.currentSearchMode,
      state.currentTextMatchMode,
      state.currentNumericComparisonMode
    );
    state.currentSearchMode = getSearchModeForOperator(state.currentSearchOperator);
    state.currentTextMatchMode = getTextMatchModeForOperator(
      state.currentSearchOperator,
      state.currentTextMatchMode
    );
    state.currentNumericComparisonMode = getNumericComparisonModeForOperator(
      state.currentSearchOperator,
      state.currentNumericComparisonMode
    );
  }

  const getOperatorOptionButtons = () => Array.from(
    operatorMenuEl.querySelectorAll('.o-layer_search_filter__operator-option')
  );

  function scrollOperatorOptionIntoView(optionButtonEl) {
    if (!optionButtonEl) return;
    const optionTop = optionButtonEl.offsetTop;
    const optionBottom = optionTop + optionButtonEl.offsetHeight;
    const menuTop = operatorMenuEl.scrollTop;
    const menuBottom = menuTop + operatorMenuEl.clientHeight;

    if (optionTop < menuTop) {
      operatorMenuEl.scrollTop = optionTop;
    } else if (optionBottom > menuBottom) {
      operatorMenuEl.scrollTop = optionBottom - operatorMenuEl.clientHeight;
    }
  }

  function attachOperatorMenuToBody() {
    if (operatorMenuEl.parentElement !== document.body) document.body.appendChild(operatorMenuEl);
  }

  function restoreOperatorMenuParent() {
    if (operatorMenuEl.parentElement !== operatorMenuParentEl) {
      operatorMenuParentEl.insertBefore(operatorMenuEl, operatorMenuNextSibling);
    }
  }

  function positionOperatorMenu() {
    if (!state.operatorMenuOpen || operatorButtonEl.disabled || operatorMenuEl.children.length === 0) return;

    const buttonRect = operatorButtonEl.getBoundingClientRect();
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const margin = 8;
    const gap = 4;
    const preferredMaxHeight = Math.min(320, Math.max(192, viewportHeight - (margin * 2)));
    const availableBelow = Math.max(0, viewportHeight - buttonRect.bottom - gap - margin);
    const availableAbove = Math.max(0, buttonRect.top - gap - margin);
    const openAbove = availableBelow < Math.min(preferredMaxHeight, 180) && availableAbove > availableBelow;
    const availableHeight = openAbove ? availableAbove : availableBelow;
    const maxHeight = Math.max(96, Math.min(preferredMaxHeight, availableHeight || preferredMaxHeight));
    const menuWidth = Math.max(buttonRect.width, 180);
    const left = Math.min(Math.max(margin, buttonRect.left), Math.max(margin, viewportWidth - menuWidth - margin));

    operatorMenuEl.style.left = `${left}px`;
    operatorMenuEl.style.maxHeight = `${maxHeight}px`;
    operatorMenuEl.style.minWidth = `${buttonRect.width}px`;
    operatorMenuEl.style.top = openAbove
      ? `${Math.max(margin, buttonRect.top - gap - maxHeight)}px`
      : `${Math.min(buttonRect.bottom + gap, viewportHeight - margin - maxHeight)}px`;
    operatorMenuEl.style.width = `${menuWidth}px`;

    const menuHeight = Math.min(operatorMenuEl.scrollHeight, maxHeight);
    if (openAbove) operatorMenuEl.style.top = `${Math.max(margin, buttonRect.top - gap - menuHeight)}px`;
  }

  function handleOperatorOutsidePointerDown(event) {
    if (!operatorEl.contains(event.target) && !operatorMenuEl.contains(event.target)) close();
  }

  function handleOperatorViewportChange() {
    if (state.operatorMenuOpen) positionOperatorMenu();
  }

  function updateMenuVisibility() {
    const menuVisible = state.operatorMenuOpen
      && !operatorButtonEl.disabled
      && operatorMenuEl.children.length > 0;
    if (menuVisible) attachOperatorMenuToBody();
    operatorMenuEl.hidden = !menuVisible;
    operatorMenuEl.classList.toggle('hidden', !menuVisible);
    operatorEl.classList.toggle('is-open', menuVisible);
    operatorButtonEl.setAttribute('aria-expanded', String(menuVisible));
    if (menuVisible) {
      positionOperatorMenu();
    } else {
      operatorMenuEl.removeAttribute('style');
      restoreOperatorMenuParent();
    }
    if (menuVisible && !operatorOutsidePointerDownActive) {
      document.addEventListener('pointerdown', handleOperatorOutsidePointerDown);
      operatorOutsidePointerDownActive = true;
    } else if (!menuVisible && operatorOutsidePointerDownActive) {
      document.removeEventListener('pointerdown', handleOperatorOutsidePointerDown);
      operatorOutsidePointerDownActive = false;
    }
    if (menuVisible && !operatorViewportListenersActive) {
      window.addEventListener('resize', handleOperatorViewportChange);
      window.addEventListener('scroll', handleOperatorViewportChange, true);
      operatorViewportListenersActive = true;
    } else if (!menuVisible && operatorViewportListenersActive) {
      window.removeEventListener('resize', handleOperatorViewportChange);
      window.removeEventListener('scroll', handleOperatorViewportChange, true);
      operatorViewportListenersActive = false;
    }
  }

  function close() {
    state.operatorMenuOpen = false;
    updateMenuVisibility();
  }

  function open() {
    if (operatorButtonEl.disabled || operatorEl.hidden || operatorMenuEl.children.length === 0) return;
    state.operatorMenuOpen = true;
    updateMenuVisibility();
    scrollOperatorOptionIntoView(operatorMenuEl.querySelector('.o-layer_search_filter__operator-option.is-selected'));
  }

  function setDisabled(disabled) {
    operatorSelectEl.disabled = disabled;
    operatorButtonEl.disabled = disabled;
    if (disabled) close();
  }

  function focusOperatorOption(step = 0) {
    const optionButtons = getOperatorOptionButtons();
    if (optionButtons.length === 0) return;
    let activeIndex = optionButtons.indexOf(document.activeElement);
    if (activeIndex < 0) {
      activeIndex = optionButtons.findIndex(optionButton => optionButton.getAttribute('aria-selected') === 'true');
    }
    if (activeIndex < 0) activeIndex = 0;
    const nextIndex = (activeIndex + step + optionButtons.length) % optionButtons.length;
    optionButtons[nextIndex].focus();
    scrollOperatorOptionIntoView(optionButtons[nextIndex]);
  }

  function selectSearchOperator(operatorValue) {
    operatorSelectEl.value = operatorValue;
    operatorSelectEl.dispatchEvent(new Event('change', { bubbles: true }));
    close();
    operatorButtonEl.focus();
  }

  function getOperatorOptionButtonFromEvent(event) {
    const { target } = event;
    if (!target || typeof target.closest !== 'function') return null;
    return target.closest('.o-layer_search_filter__operator-option');
  }

  function getAvailableSearchOperatorOptions() {
    const hasTextAttributes = services.hasTextSearchAttributes(state.discoveredAttributes);
    const hasNumericAttributes = services.hasNumericSearchAttributes(state.discoveredAttributes);

    return searchOperatorOptions.filter((operatorOption) => {
      if (operatorOption.type === 'mixed') return hasTextAttributes || hasNumericAttributes;
      if (operatorOption.type === 'numeric') return hasNumericAttributes;
      return hasTextAttributes;
    });
  }

  function getAvailableSearchOperator(preferredOperator = state.currentSearchOperator) {
    const normalizedOperator = normalizeSearchOperator(
      preferredOperator,
      state.currentSearchMode,
      state.currentTextMatchMode,
      state.currentNumericComparisonMode
    );
    const availableOptions = getAvailableSearchOperatorOptions();
    if (availableOptions.some(operatorOption => operatorOption.value === normalizedOperator)) return normalizedOperator;
    const fallbackOperator = getSearchOperatorFromModes(
      state.currentSearchMode,
      state.currentTextMatchMode,
      state.currentNumericComparisonMode
    );
    if (availableOptions.some(operatorOption => operatorOption.value === fallbackOperator)) return fallbackOperator;
    return availableOptions.length > 0 ? availableOptions[0].value : normalizedOperator;
  }

  function updateBetweenControlState() {
    const isBetween = isBetweenSearchOperator(state.currentSearchOperator);
    const searchPlaceholder = isBetween
      ? localize('numericComparisonBetweenStartPlaceholder', options.numericComparisonBetweenStartPlaceholder)
      : localize('placeholder', options.placeholder);

    inputEl.setAttribute('placeholder', searchPlaceholder);
    betweenControlEl.hidden = !isBetween;
    betweenControlEl.classList.toggle('hidden', !isBetween);
  }

  function updateState() {
    state.currentSearchOperator = getAvailableSearchOperator(state.currentSearchOperator);
    syncCurrentSearchOperatorDetails();

    const availableOptions = getAvailableSearchOperatorOptions();
    operatorSelectEl.replaceChildren();
    operatorMenuEl.replaceChildren();
    availableOptions.forEach((operatorOption) => {
      const optionText = getSearchOperatorOptionText(operatorOption.value);
      const optionLabel = getSearchOperatorLabel(operatorOption.value);
      const selected = operatorOption.value === state.currentSearchOperator;
      const optionEl = document.createElement('option');
      optionEl.value = operatorOption.value;
      optionEl.replaceChildren(document.createTextNode(optionText));
      operatorSelectEl.appendChild(optionEl);

      const optionButtonEl = document.createElement('button');
      optionButtonEl.type = 'button';
      optionButtonEl.className = 'o-layer_search_filter__operator-option';
      optionButtonEl.dataset.searchOperator = operatorOption.value;
      optionButtonEl.setAttribute('role', 'option');
      optionButtonEl.setAttribute('aria-selected', String(selected));
      optionButtonEl.setAttribute('title', optionLabel);
      optionButtonEl.classList.toggle('is-selected', selected);
      optionButtonEl.replaceChildren(document.createTextNode(optionText));
      operatorMenuEl.appendChild(optionButtonEl);
    });

    operatorSelectEl.value = state.currentSearchOperator;
    const currentOperatorLabel = getSearchOperatorLabel(state.currentSearchOperator);
    const currentOperatorText = getSearchOperatorOptionText(state.currentSearchOperator);
    operatorButtonTextEl.replaceChildren(document.createTextNode(currentOperatorText));
    operatorButtonEl.setAttribute('aria-label', `${localize('searchOperatorTitle', options.searchOperatorTitle)}: ${currentOperatorLabel}`);
    operatorButtonEl.setAttribute('title', currentOperatorLabel);
    operatorSelectEl.setAttribute('title', currentOperatorLabel);
    operatorEl.hidden = availableOptions.length === 0;
    operatorEl.classList.toggle('hidden', availableOptions.length === 0);
    if (availableOptions.length === 0) close();
    updateMenuVisibility();
    actions.updateActionsVisibility();
    updateBetweenControlState();
    actions.updateSearchState();
  }

  function bind() {
    operatorButtonEl.addEventListener('click', () => (state.operatorMenuOpen ? close() : open()));
    operatorButtonEl.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        open();
        focusOperatorOption();
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        open();
        focusOperatorOption(-1);
      } else if (event.key === 'Escape') close();
    });
    operatorMenuEl.addEventListener('click', (event) => {
      const optionButtonEl = getOperatorOptionButtonFromEvent(event);
      if (optionButtonEl) selectSearchOperator(optionButtonEl.dataset.searchOperator);
    });
    operatorMenuEl.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        focusOperatorOption(event.key === 'ArrowDown' ? 1 : -1);
      } else if (event.key === 'Home' || event.key === 'End') {
        event.preventDefault();
        const buttons = getOperatorOptionButtons();
        if (buttons.length > 0) buttons[event.key === 'Home' ? 0 : buttons.length - 1].focus();
      } else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        const optionButtonEl = getOperatorOptionButtonFromEvent(event);
        if (optionButtonEl) selectSearchOperator(optionButtonEl.dataset.searchOperator);
      } else if (event.key === 'Escape') {
        event.preventDefault();
        close();
        operatorButtonEl.focus();
      }
    });
    [operatorEl, operatorMenuEl].forEach(element => element.addEventListener('focusout', (event) => {
      if (!operatorEl.contains(event.relatedTarget) && !operatorMenuEl.contains(event.relatedTarget)) close();
    }));
    operatorSelectEl.addEventListener('change', () => {
      state.currentSearchOperator = normalizeSearchOperator(
        operatorSelectEl.value,
        state.currentSearchMode,
        state.currentTextMatchMode,
        state.currentNumericComparisonMode
      );
      updateState();
      actions.renderAttributeButtons(state.discoveredAttributes);
      actions.persistUiState();
      if (inputEl.value.trim() || betweenInputEl.value.trim()) actions.scheduleSearch();
    });
  }

  function destroy() {
    close();
    if (operatorOutsidePointerDownActive) {
      document.removeEventListener('pointerdown', handleOperatorOutsidePointerDown);
      operatorOutsidePointerDownActive = false;
    }
    if (operatorViewportListenersActive) {
      window.removeEventListener('resize', handleOperatorViewportChange);
      window.removeEventListener('scroll', handleOperatorViewportChange, true);
      operatorViewportListenersActive = false;
    }
    if (operatorMenuEl.parentElement === document.body) {
      if (operatorMenuParentEl && operatorMenuParentEl.isConnected) {
        restoreOperatorMenuParent();
      } else {
        operatorMenuEl.remove();
      }
    }
  }

  return {
    bind,
    close,
    destroy,
    setDisabled,
    updateState
  };
}

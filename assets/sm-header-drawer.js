import { Component } from '@theme/component';
import { trapFocus, removeTrapFocus } from '@theme/focus';
import { sectionRenderer } from '@theme/section-renderer';

/**
 * A custom element that manages the mobile and tablet header menu.
 *
 * The menu expands underneath the header instead of sliding in as a drawer.
 * Its markup is not part of the initial document: the header section only renders
 * it when it is requested through the Section Rendering API. The header hydrates
 * itself on idle (see `sections/header.liquid`), so in practice the markup is
 * already in place by the time a visitor taps the toggle. When it is not, it is
 * fetched on demand before the panel expands.
 *
 * @typedef {object} Refs
 * @property {HTMLButtonElement} toggle - The button that expands and collapses the menu.
 * @property {HTMLElement} panel - The expanding panel that holds the menu.
 * @property {HTMLElement} [views] - The container that holds the menu views.
 * @property {HTMLElement[]} [view] - The individual menu views.
 *
 * @extends {Component<Refs>}
 */
class SmHeaderDrawer extends Component {
  requiredRefs = ['toggle', 'panel'];

  /** Matches the breakpoint at which the desktop menu takes over. */
  #desktopQuery = matchMedia('(min-width: 992px)');

  /** @type {Promise<void> | null} */
  #contentRequest = null;

  /** Set when the menu is closed again while its content is still loading. */
  #cancelled = false;

  connectedCallback() {
    super.connectedCallback();

    this.addEventListener('keydown', this.#onKeyDown);
    this.#desktopQuery.addEventListener('change', this.#onBreakpointChange);
    window.addEventListener('resize', this.#onResize);
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    this.removeEventListener('keydown', this.#onKeyDown);
    this.#desktopQuery.removeEventListener('change', this.#onBreakpointChange);
    window.removeEventListener('resize', this.#onResize);

    if (this.isOpen) this.#unlockScroll();
  }

  /**
   * @returns {boolean} Whether the menu is expanded
   */
  get isOpen() {
    return this.hasAttribute('open');
  }

  /**
   * Expands or collapses the menu
   */
  toggle() {
    return this.isOpen ? this.close() : this.open();
  }

  /**
   * Expands the menu, rendering its content first when needed
   */
  async open() {
    if (this.isOpen) return;

    this.#cancelled = false;

    await this.#renderContent();

    if (this.#cancelled) {
      this.#cancelled = false;
      return;
    }

    this.#updateOffset();
    this.setAttribute('open', '');
    this.refs.toggle.setAttribute('aria-expanded', 'true');
    this.refs.toggle.setAttribute('aria-label', this.dataset.labelClose ?? '');
    this.refs.panel.removeAttribute('inert');
    document.documentElement.setAttribute('scroll-lock', '');

    requestAnimationFrame(() => {
      if (!this.isOpen) return;

      trapFocus(this);
      this.#activeView?.focus();
    });
  }

  /**
   * Collapses the menu
   */
  close() {
    if (!this.isOpen) {
      // Cancels an open() call that is still waiting for its content.
      if (this.#contentRequest) this.#cancelled = true;
      return;
    }

    const hadFocus = this.contains(document.activeElement);

    this.removeAttribute('open');
    this.refs.toggle.setAttribute('aria-expanded', 'false');
    this.refs.toggle.setAttribute('aria-label', this.dataset.labelOpen ?? '');
    this.refs.panel.setAttribute('inert', '');
    this.#unlockScroll();
    removeTrapFocus();

    if (hadFocus) this.refs.toggle.focus();

    // Return to the top level once the panel is out of sight.
    setTimeout(() => {
      if (!this.isOpen) this.#setView('root');
    }, 300);
  }

  /**
   * Shows the submenu belonging to the activated menu item
   * @param {Event} event
   */
  openSubmenu(event) {
    const { target } = event;

    if (!(target instanceof HTMLElement) || !target.dataset.submenu) return;

    this.#setView(target.dataset.submenu);
  }

  /**
   * Returns from a submenu to the top level menu
   */
  closeSubmenu() {
    const previous = this.#activeView?.dataset.view;

    this.#setView('root');

    if (!previous) return;

    // Move focus back to the item that opened the submenu.
    const trigger = this.querySelector(`[data-submenu="${CSS.escape(previous)}"]`);

    if (trigger instanceof HTMLElement) trigger.focus();
  }

  /**
   * The view that is currently visible
   * @returns {HTMLElement | undefined}
   */
  get #activeView() {
    const active = this.refs.views?.dataset.activeView ?? 'root';

    return this.#views.find((view) => view.dataset.view === active);
  }

  /**
   * @returns {HTMLElement[]} All rendered menu views
   */
  get #views() {
    const { view } = this.refs;

    if (!view) return [];

    return Array.isArray(view) ? view : [view];
  }

  /**
   * Shows a single view and hides the others
   * @param {string} name - The `data-view` value of the view to show
   */
  #setView(name) {
    const { views } = this.refs;

    if (!views || views.dataset.activeView === name) return;

    views.dataset.activeView = name;

    for (const view of this.#views) {
      const isActive = view.dataset.view === name;

      view.toggleAttribute('inert', !isActive);

      if (isActive && this.isOpen) view.focus();
    }

    for (const trigger of this.querySelectorAll('[data-submenu]')) {
      trigger.setAttribute('aria-expanded', String(trigger.getAttribute('data-submenu') === name));
    }
  }

  /**
   * Fetches and injects the menu markup when it has not been rendered yet
   * @returns {Promise<void>}
   */
  #renderContent() {
    if (this.refs.panel.childElementCount > 0) return Promise.resolve();
    if (this.#contentRequest) return this.#contentRequest;

    const { sectionId } = this.dataset;
    const panelId = this.refs.panel.id;

    if (!sectionId || !panelId) return Promise.resolve();

    this.refs.panel.setAttribute('aria-busy', 'true');

    this.#contentRequest = sectionRenderer
      .getSectionHTML(sectionId, false)
      .then((html) => {
        const source = new DOMParser().parseFromString(html, 'text/html').getElementById(panelId);

        if (!source?.childElementCount) {
          throw new Error(`No menu markup found in the rendered "${sectionId}" section`);
        }

        this.refs.panel.replaceChildren(...source.children);
      })
      .catch((error) => {
        console.error('Could not render the mobile menu', error);
      })
      .finally(() => {
        this.refs.panel.removeAttribute('aria-busy');
        this.#contentRequest = null;
      });

    return this.#contentRequest;
  }

  /**
   * Stores the distance between the top of the viewport and the top of the panel,
   * so the panel fills exactly the space underneath the header.
   */
  #updateOffset() {
    const { top } = this.refs.panel.getBoundingClientRect();

    this.style.setProperty('--sm-header-drawer-offset', `${Math.max(0, Math.round(top))}px`);
  }

  #unlockScroll() {
    document.documentElement.removeAttribute('scroll-lock');
  }

  /**
   * @param {KeyboardEvent} event
   */
  #onKeyDown = (event) => {
    if (event.key !== 'Escape' || !this.isOpen) return;

    event.stopPropagation();

    const activeView = this.refs.views?.dataset.activeView;

    if (activeView && activeView !== 'root') {
      this.closeSubmenu();
    } else {
      this.close();
    }
  };

  #onBreakpointChange = () => {
    if (this.#desktopQuery.matches) this.close();
  };

  #onResize = () => {
    if (this.isOpen) this.#updateOffset();
  };
}

if (!customElements.get('sm-header-drawer')) {
  customElements.define('sm-header-drawer', SmHeaderDrawer);
}

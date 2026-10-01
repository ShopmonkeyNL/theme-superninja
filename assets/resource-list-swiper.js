/**
 * Resource List Swiper Initializer
 * 
 * Initializes Swiper carousels for resource lists.
 * Automatically detects and configures all resource-list-swiper instances on the page.
 */

class ResourceListSwiper {
  constructor() {
    this.swiperInstances = new Map();
    this.domObserver = null;
    this.init();
    this.setupDOMObserver();
  }

  /**
   * Initialize all Swiper carousels on the page
   */
  init() {
    // Wait for Swiper library to be available
    if (typeof Swiper === 'undefined') {
      console.warn('Swiper library not loaded yet, retrying...');
      setTimeout(() => this.init(), 100);
      return;
    }

    // Find all resource list swiper containers
    const containers = document.querySelectorAll('.resource-list-swiper-container');
    
    if (containers.length === 0) {
      console.log('No resource list swiper containers found');
      return;
    }

    console.log(`Found ${containers.length} resource list swiper container(s)`);
    
    containers.forEach(container => {
      const carouselId = container.dataset.carouselId;
      if (!carouselId) {
        console.warn('Container found but no carouselId:', container);
        return;
      }

      // Get configuration from data attribute
      const configScript = document.querySelector(`[data-swiper-config="${carouselId}"]`);
      if (!configScript) {
        console.warn(`No config found for carousel: ${carouselId}`);
        return;
      }

      try {
        const config = JSON.parse(configScript.textContent);
        console.log(`Config for ${carouselId}:`, config);
        this.initSwiper(carouselId, config);
      } catch (error) {
        console.error(`Failed to parse config for ${carouselId}:`, error);
      }
    });
  }

  /**
   * Setup a MutationObserver to detect when new swiper containers are dynamically added
   * (e.g., via Section Rendering API with product recommendations)
   */
  setupDOMObserver() {
    if (this.domObserver) {
      this.domObserver.disconnect();
    }

    this.domObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        // Check if new nodes were added
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            // Skip text nodes
            if (node.nodeType !== 1) return;

            // Check if the added node contains a swiper container
            const newContainers = node.querySelectorAll?.('.resource-list-swiper-container') || [];
            
            // Also check if the node itself is a swiper container
            if (node.classList?.contains('resource-list-swiper-container')) {
              this.initSwiperFromContainer(node);
            }

            // Initialize any swiper containers found in the added nodes
            newContainers.forEach((container) => {
              this.initSwiperFromContainer(container);
            });
          });
        }
      });
    });

    // Start observing the document for changes
    this.domObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false,
      characterData: false,
    });
  }

  /**
   * Initialize a swiper from a container element
   * @param {Element} container - The swiper container element
   */
  initSwiperFromContainer(container) {
    const carouselId = container.dataset.carouselId;
    if (!carouselId) {
      console.warn('Container found but no carouselId:', container);
      return;
    }

    // Get configuration from data attribute
    const configScript = document.querySelector(`[data-swiper-config="${carouselId}"]`);
    if (!configScript) {
      console.warn(`No config found for carousel: ${carouselId}`);
      return;
    }

    try {
      const config = JSON.parse(configScript.textContent);
      this.initSwiper(carouselId, config);
    } catch (error) {
      console.error(`Failed to parse config for ${carouselId}:`, error);
    }
  }

  /**
   * Initialize a single Swiper instance
   * @param {string} carouselId - Unique carousel identifier
   * @param {object} config - Swiper configuration object
   */
  initSwiper(carouselId, config) {
    const element = document.getElementById(carouselId);
    if (!element) {
      console.warn(`Swiper element not found: ${carouselId}`);
      return;
    }

    // Avoid initializing twice
    // if (this.swiperInstances.has(carouselId)) {
    //   console.warn(`Swiper already initialized: ${carouselId}`);
    //   return;
    // }

    // Create Swiper instance
    const swiper = new Swiper(`#${carouselId}`, {
      slidesPerView: config.slidesPerView || 1,
      spaceBetween: config.spaceBetween || 16,
      loop: config.loop || false,
      autoplay: config.autoplay || false,
      breakpoints: config.breakpoints || {},
      navigation: config.navigation || false,
      pagination: config.pagination || false,
      // Performance optimizations
      watchSlidesProgress: true,
      watchSlidesVisibility: true,
      // Accessibility
      a11y: {
        enabled: true,
        prevSlideMessage: 'Previous slide',
        nextSlideMessage: 'Next slide',
        firstSlideMessage: 'This is the first slide',
        lastSlideMessage: 'This is the last slide',
      },
      // Keyboard control
      keyboard: {
        enabled: true,
        onlyInViewport: true,
      }
    });

    // Store instance
    this.swiperInstances.set(carouselId, swiper);

    console.log(`✓ Swiper initialized: ${carouselId}`);
  }

  /**
   * Destroy a specific Swiper instance
   * @param {string} carouselId - Unique carousel identifier
   */
  destroy(carouselId) {
    const swiper = this.swiperInstances.get(carouselId);
    if (swiper) {
      swiper.destroy(true, true);
      this.swiperInstances.delete(carouselId);
      console.log(`✓ Swiper destroyed: ${carouselId}`);
    }
  }

  /**
   * Destroy all Swiper instances
   */
  destroyAll() {
    this.swiperInstances.forEach((swiper, id) => {
      swiper.destroy(true, true);
      console.log(`✓ Swiper destroyed: ${id}`);
    });
    this.swiperInstances.clear();
    
    // Disconnect the DOM observer as well
    if (this.domObserver) {
      this.domObserver.disconnect();
    }
  }

  /**
   * Reinitialize all Swipers (useful for dynamic content updates)
   */
  reinitialize() {
    this.destroyAll();
    this.init();
    this.setupDOMObserver();
  }
}

// Helper function to wait for both DOM and Swiper
function initWhenReady() {
  if (typeof Swiper === 'undefined') {
    console.log('Waiting for Swiper library...');
    setTimeout(initWhenReady, 50);
    return;
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.resourceListSwiper = new ResourceListSwiper();
    });
  } else {
    window.resourceListSwiper = new ResourceListSwiper();
  }
}

// Start initialization
initWhenReady();

// Re-initialize on Shopify section updates (theme editor support)
if (window.Shopify && window.Shopify.designMode) {
  document.addEventListener('shopify:section:load', () => {
    if (window.resourceListSwiper) {
      window.resourceListSwiper.reinitialize();
    }
  });

  document.addEventListener('shopify:section:reorder', () => {
    if (window.resourceListSwiper) {
      window.resourceListSwiper.reinitialize();
    }
  });
}

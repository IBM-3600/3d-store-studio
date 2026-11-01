// frontend/src/core/Router.js
import { EventBus } from './EventBus.js';
import { authService } from '../services/AuthService.js';

export class Router {
  constructor() {
    this.routes = new Map();
    this.guards = [];
    this.currentPage = null;
    this.container = null;
    
    // Listen for popstate (browser back/forward)
    window.addEventListener('popstate', () => this.handleRoute());
    
    // Listen for auth events
    EventBus.on('auth:logout', () => this.navigate('/login'));
    EventBus.on('auth:token_expired', () => this.navigate('/login'));
  }

  setContainer(container) {
    this.container = container;
  }

  addGuard(guard) {
    this.guards.push(guard);
  }

  register(path, pageClass, options = {}) {
    this.routes.set(path, {
      pageClass,
      options,
      pattern: this.pathToRegex(path)
    });
  }

  // pathToRegex(path) {
  //   // Convert /editor/:worldId to regex
  //   const pattern = path
  //     .replace(/:[^\s/]+/g, '([\\w-]+)')
  //     .replace(/\//g, '\\/');
  //   return new RegExp(`^${pattern}$`);
  // }

  pathToRegex(path) {
  const segments = path.split("/");

  const pattern = segments
    .map(segment => {
      if (segment.startsWith(":")) {
        const optional = segment.endsWith("?");

        return optional
          ? "(?:\\/([\\w-]+))?"
          : "\\/([\\w-]+)";
      }

      if (segment === "") return "";

      return "\\/" + segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    })
    .join("");

  return new RegExp(`^${pattern}\\/?$`);
}

  navigate(path, replace = false) {
    if (replace) {
      window.history.replaceState({}, '', path);
    } else {
      window.history.pushState({}, '', path);
    }
    this.handleRoute();
  }

  async handleRoute() {
    const path = window.location.pathname;
    
    // Run guards
    for (const guard of this.guards) {
      const result = await guard(path);
      if (result === false) return;
      if (typeof result === 'string') {
        this.navigate(result, true);
        return;
      }
    }

    // Find matching route
    let matchedRoute = null;
    let params = {};

    for (const [routePath, route] of this.routes.entries()) {
      const match = path.match(route.pattern);
      if (match) {
        matchedRoute = route;
        
        // Extract params
        const paramNames = (routePath.match(/:[^\s/]+/g) || []).map(p => p.slice(1));
        paramNames.forEach((name, index) => {
          params[name] = match[index + 1];
        });
        
        break;
      }
    }

    // Handle 404
    if (!matchedRoute) {
      const notFoundRoute = this.routes.get('/404') || this.routes.get('*');
      if (notFoundRoute) {
        matchedRoute = notFoundRoute;
      } else {
        console.error('[Router] No route found for:', path);
        return;
      }
    }

    // Cleanup current page
    if (this.currentPage && typeof this.currentPage.destroy === 'function') {
      this.currentPage.destroy();
    }

    // Render new page
    try {
      const PageClass = matchedRoute.pageClass;
      this.currentPage = new PageClass(this.container, params, matchedRoute.options);
      
      if (typeof this.currentPage.render === 'function') {
        await this.currentPage.render();
      }
      
      EventBus.emit('router:page_changed', { path, params });
    } catch (error) {
      console.error('[Router] Failed to render page:', error);
    }
  }

  start(initialPath = '/') {
    if (window.location.pathname === '/' && initialPath !== '/') {
      this.navigate(initialPath, true);
    } else {
      this.handleRoute();
    }
  }
}

// Auth guard - redirect to login if not authenticated
export function authGuard(path) {
  const publicPaths = ['/login', '/register', '/forgot-password'];
  
  if (publicPaths.includes(path)) {
    // If already logged in and trying to access login, redirect to dashboard
    if (path === '/login' && authService.isAuthenticated()) {
      return '/dashboard';
    }
    return true;
  }
  
  if (!authService.isAuthenticated()) {
    return '/login';
  }
  
  return true;
}

// Role guard factory
export function roleGuard(allowedRoles) {
  return (path) => {
    if (!authService.isAuthenticated()) {
      return '/login';
    }
    
    if (!authService.hasAnyRole(allowedRoles)) {
      console.warn('[Router] Access denied to:', path);
      return '/dashboard'; // Redirect to dashboard instead of showing error
    }
    
    return true;
  };
}

export const router = new Router();
/*
Copyright 2019 Gravitational, Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

// eslint-disable-next-line import/named
import { createBrowserHistory, History } from 'history';
import { matchPath } from 'react-router';
import cfg from 'teleport/config';

let _inst: History = null;

const history = {
  original() {
    return _inst;
  },

  init(history?: History) {
    _inst = history || createBrowserHistory();
  },

  replace(route = '') {
    route = this.ensureKnownRoute(route);
    _inst.replace(route);
  },

  push(route, withRefresh = false) {
    route = this.ensureKnownRoute(route);
    if (withRefresh) {
      this._pageRefresh(route);
    } else {
      _inst.push(route);
    }
  },

  reload() {
    window.location.reload();
  },

  goBack(number: number) {
    this.original().goBack(number);
  },

  goToLogin(rememberLocation = false) {
    let url = cfg.routes.login;
    if (rememberLocation) {
      let redirectUrl = _inst.createHref(_inst.location);
      redirectUrl = this.ensureKnownRoute(redirectUrl);
      redirectUrl = this.ensureBaseUrl(redirectUrl);
      url = `${url}?redirect_uri=${redirectUrl}`;
    }

    this._pageRefresh(url);
  },

  createRedirect(location /* location || string */) {
    let route = _inst.createHref(location);
    let knownRoute = this.ensureKnownRoute(route);
    return this.ensureBaseUrl(knownRoute);
  },

  getRedirectParam() {
    return getUrlParameter(
      'redirect_uri',
      this.original().location.search,
      true /* preserve filter query values */
    );
  },

  ensureKnownRoute(url = '') {
    url = this._canPush(url) ? url : cfg.routes.root;
    return url;
  },

  ensureBaseUrl(url: string) {
    url = url || '';
    if (url.indexOf(cfg.baseUrl) !== 0) {
      url = withBaseUrl(url);
    }

    return url;
  },

  getRoutes() {
    return Object.getOwnPropertyNames(cfg.routes).map(p => cfg.routes[p]);
  },

  getLocation() {
    return this.original().location;
  },

  _canPush(route: string) {
    route = route || '';
    let routes = this.getRoutes();
    if (route.indexOf(cfg.baseUrl) === 0) {
      route = route.replace(cfg.baseUrl, '');
    }

    return routes.some(match(route));
  },

  _pageRefresh(route: string) {
    window.location.href = this.ensureBaseUrl(route);
  },
};

const withBaseUrl = (url: string) => cfg.baseUrl + url;

const match = (url: string) => (route: string) => {
  return matchPath(url, {
    path: route,
    exact: true,
  });
};

export default history;

// regexFilterQueryParam is a regex to split a path into two groups.
// First group captures anything before the filter param as the path we will search
// for the target query param. The second group captures the first filter param and
// anything else following it we assume is part of the filter.
const regexFilterQueryParam = /(?<pathToSearch>.+?)(?<pathWithFilter>\?filter=.*)/;

export function getUrlParameter(name = '', path = '', preserveFilter = false) {
  let pathToSearch = path;
  let pathWithFilter = '';

  // We preserve the filter b/c it contains un-encoded char seperator's
  // that we use to determine different filters. Running it through
  // URLSearchParams will decode encoded values and other unexpected
  // changes like "+" is converted to space.
  if (preserveFilter) {
    const match = regexFilterQueryParam.exec(path);
    pathToSearch = match?.groups.pathToSearch ?? path;
    pathWithFilter = match?.groups.pathWithFilter ?? '';
  }

  const params = new URLSearchParams(pathToSearch);
  const foundValue = params.get(name);

  if (preserveFilter && foundValue && pathWithFilter) {
    return `${foundValue}${pathWithFilter}`;
  }

  return foundValue || '';
}

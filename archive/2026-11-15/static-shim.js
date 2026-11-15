/* Medusa static-snapshot shim: maps the backend's /api/* calls to pre-rendered
   JSON files next to this script, so the site works from any (sub-)path. */
(function () {
  var me = document.currentScript && document.currentScript.src;
  var base = me ? me.replace(/[^/]*$/, '') : '';
  window.__MEDUSA_BASE__ = base;
  function safe(s) {
    return String(s).replace(/[^A-Za-z0-9._-]/g, function (c) {
      var h = c.charCodeAt(0).toString(16).toUpperCase();
      return '_' + (h.length < 2 ? '0' + h : h);
    });
  }
  function map(url) {
    var u;
    try { u = new URL(url, location.href); } catch (e) { return null; }
    if (u.origin !== location.origin) return null;
    var p = u.pathname, m, q = u.searchParams;
    var i = p.indexOf('/api/');
    if (i < 0) return null;
    p = p.slice(i);
    if (p === '/api/bootstrap') return 'bootstrap.json';
    if (p === '/api/topics') return 'topics.json';
    if (p === '/api/page3/index') return 'page3/index.json';
    if ((m = p.match(/^\/api\/cards\/(.+)$/))) return 'cards/' + safe(decodeURIComponent(m[1])) + '.json';
    if ((m = p.match(/^\/api\/page3\/articles\/(.+)$/))) return 'page3/articles/' + safe(decodeURIComponent(m[1])) + '.json';
    if (p === '/api/asset/quote') return 'asset/quote/' + safe(q.get('symbols') || '') + '.json';
    if (p === '/api/asset/history') return 'asset/history/' + safe(q.get('symbol') || '') + '/' + safe(q.get('window') || '1D') + '.json';
    return '__unsupported__';
  }
  var realFetch = window.fetch.bind(window);
  window.fetch = function (input, init) {
    var url = typeof input === 'string' ? input : (input && input.url) || String(input);
    var target = map(url);
    if (target === null) return realFetch(input, init);
    if (target === '__unsupported__') {
      return Promise.resolve(new Response(JSON.stringify({detail: 'not available in static snapshot'}),
        {status: 404, headers: {'Content-Type': 'application/json'}}));
    }
    return realFetch(base + 'data/api/' + target, {headers: {Accept: 'application/json'}});
  };
})();

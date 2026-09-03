// A fixed, Cortex-authored instrumentation script — never AI-generated —
// injected into a prototype's HTML only when serving it for an A/B test
// session. The stored PrototypeVersion.content is never mutated.
//
// The iframe stays sandbox="allow-scripts" with no "allow-same-origin";
// postMessage works across that boundary regardless, so this reports timing
// and interaction data to the parent test-session page without weakening
// the sandbox at all.

const TELEMETRY_SCRIPT = `
<script>
(function() {
  var start = Date.now();
  var interactions = 0;
  document.addEventListener('click', function(){ interactions++; }, true);
  document.addEventListener('input', function(){ interactions++; }, true);
  window.CortexTest = {
    complete: function() {
      window.parent.postMessage({ source: 'cortex-prototype', type: 'complete', ms: Date.now() - start, interactions: interactions }, '*');
    }
  };
  window.addEventListener('beforeunload', function() {
    window.parent.postMessage({ source: 'cortex-prototype', type: 'heartbeat', ms: Date.now() - start, interactions: interactions }, '*');
  });
})();
</script>
`;

export function injectTelemetryScript(html: string): string {
  if (html.includes("</body>")) {
    return html.replace("</body>", `${TELEMETRY_SCRIPT}</body>`);
  }
  return `${html}${TELEMETRY_SCRIPT}`;
}

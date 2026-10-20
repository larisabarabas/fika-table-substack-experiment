// One-time entrance reveal gate: hides the animated elements (via CSS
// scoped to this attribute) until the reveal sequence runs and removes
// it. Motion-reduced users never get the attribute, so they see the
// finished page immediately with no flash of hidden content.
if (window.matchMedia('(prefers-reduced-motion: no-preference)').matches) {
  document.documentElement.setAttribute('data-reveal', '');
}

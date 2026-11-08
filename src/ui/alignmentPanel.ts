export function renderAlignmentPanel(): string {
  return `      <section class="alignment-panel" aria-labelledby="alignment-heading">
        <div class="geometry-heading"><h2 id="alignment-heading">Calculated Alignment</h2><span>Current suspension position</span></div>
        <div class="alignment-grid">
          <article class="alignment-card">
            <h3>Toe</h3>
            <strong id="toe-total">—</strong>
            <small id="toe-sides">Left — mm · Right — mm</small>
          </article>
          <article class="alignment-card">
            <h3>Camber</h3>
            <strong id="camber-values">Left —° · Right —°</strong>
            <small>Wheel inclination from vertical</small>
          </article>
          <article class="alignment-card">
            <h3>Caster</h3>
            <strong id="caster-values">Left —° · Right —°</strong>
            <small>Steering axis angle from vertical</small>
          </article>
          <article class="alignment-card">
            <h3>Scrub Radius</h3>
            <strong id="scrub-radius-values">Left — mm · Right — mm</strong>
            <small>Tire centerline to steering-axis ground intersection</small>
          </article>
          <article class="alignment-card">
            <h3>Motion Ratio</h3>
            <strong id="motion-ratio-values">Left — · Right —</strong>
            <small>Strut travel ÷ vertical wheel travel</small>
          </article>
          <article class="alignment-card">
            <h3>Wheel Rate</h3>
            <strong id="wheel-rate-values">Left — N/mm · Right — N/mm</strong>
            <small>Spring rate × motion ratio²</small>
          </article>
        </div>
      </section>
`;
}


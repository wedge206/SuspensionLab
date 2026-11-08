export function renderFrontSidebar(): string {
  return `          <div class="tab-pane active" id="tab-front">
      <section class="build-sequence">
        <div class="geometry-heading"><h2>Front chassis</h2><span>Left & right</span></div>
        <label class="dimension-field" for="pickup-width">
          <span><strong>Front Control Arm Front Mount Location</strong><small>Vehicle centerline to each point</small></span>
          <span class="dimension-input"><input id="pickup-width" type="number" min="1" step="1" /> <small>mm</small></span>
        </label>
        <label class="dimension-field" for="pickup-rear-width">
          <span><strong>Front Control Arm Rear Mount Location</strong><small>Vehicle centerline to each point</small></span>
          <span class="dimension-input"><input id="pickup-rear-width" type="number" min="1" step="1" /> <small>mm</small></span>
        </label>
        <label class="dimension-field" for="control-arm-depth">
          <span><strong>Front Control Arm Depth</strong><small>Distance between front and rear mounts</small></span>
          <span class="dimension-input"><input id="control-arm-depth" type="number" min="1" step="1" /> <small>mm</small></span>
        </label>
        <label class="dimension-field" for="pickup-front-height">
          <span><strong>Front Control Arm Front Mount Height</strong><small>Height from ground plane</small></span>
          <span class="dimension-input"><input id="pickup-front-height" type="number" min="1" step="1" /> <small>mm</small></span>
        </label>
        <label class="dimension-field" for="pickup-rear-height">
          <span><strong>Front Control Arm Rear Mount Height</strong><small>Height from ground plane</small></span>
          <span class="dimension-input"><input id="pickup-rear-height" type="number" min="1" step="1" /> <small>mm</small></span>
        </label>
        <label class="dimension-field" for="top-mount-height">
          <span><strong>Top Mount Height</strong><small>Height from ground plane</small></span>
          <span class="dimension-input"><input id="top-mount-height" type="number" min="1" step="1" /> <small>mm</small></span>
        </label>
        <label class="dimension-field" for="top-mount-width">
          <span><strong>Top Mount Width</strong><small>Distance between left and right points</small></span>
          <span class="dimension-input"><input id="top-mount-width" type="number" min="1" step="1" /> <small>mm</small></span>
        </label>
        <label class="dimension-field" for="top-mount-offset">
          <span><strong>Top Mount Offset</strong><small>Rearward from front mount location</small></span>
          <span class="dimension-input"><input id="top-mount-offset" type="number" min="0" step="1" /> <small>mm</small></span>
        </label>
        <p class="point-spacing">Front subframe width <strong id="front-point-spacing">— mm</strong></p>
      </section>
      <section class="build-sequence">
        <div class="geometry-heading"><h2>Front Control Arm</h2><span>Left & right</span></div>
        <label class="dimension-field" for="control-arm-length">
          <span><strong>Control Arm Length</strong><small>Outward from front mount</small></span>
          <span class="dimension-input"><input id="control-arm-length" type="number" min="1" step="1" /> <small>mm</small></span>
        </label>
        <label class="dimension-field" for="ball-joint-offset">
          <span><strong>Ball Joint Offset</strong><small>Rearward from front mount</small></span>
          <span class="dimension-input"><input id="ball-joint-offset" type="number" min="0" step="1" /> <small>mm</small></span>
        </label>
      </section>
      <section class="build-sequence">
        <div class="geometry-heading"><h2>Steering Rack</h2><span>Left & right</span></div>
        <label class="dimension-field" for="steering-rack-width">
          <span><strong>Steering Rack Width</strong><small>Distance between pivot points</small></span>
          <span class="dimension-input"><input id="steering-rack-width" type="number" min="1" step="1" /> <small>mm</small></span>
        </label>
        <label class="dimension-field" for="steering-rack-height">
          <span><strong>Steering Rack Centerline Height</strong><small>Height from ground plane</small></span>
          <span class="dimension-input"><input id="steering-rack-height" type="number" min="1" step="1" /> <small>mm</small></span>
        </label>
        <label class="dimension-field" for="steering-rack-offset">
          <span><strong>Steering Rack Centerline Offset</strong><small>Rearward from front mount location</small></span>
          <span class="dimension-input"><input id="steering-rack-offset" type="number" min="0" step="1" /> <small>mm</small></span>
        </label>
        <label class="dimension-field" for="steering-housing-width">
          <span><strong>Steering Housing Width</strong><small>Width of the rack cylinder</small></span>
          <span class="dimension-input"><input id="steering-housing-width" type="number" min="1" step="1" /> <small>mm</small></span>
        </label>
        <label class="dimension-field" for="steering-limiter">
          <span><strong>Steering Limiter</strong><small>Extra stop clearance at each end of the housing</small></span>
          <span class="dimension-input"><input id="steering-limiter" type="number" min="0" step="1" /> <small>mm</small></span>
        </label>
        <label class="dimension-field" for="tie-rod-length">
          <span><strong>Tie Rod Length</strong><small>Fixed length from rack pivot to steering pivot</small></span>
          <span class="dimension-input"><input id="tie-rod-length" type="number" min="1" step="0.1" /> <small>mm</small></span>
        </label>
      </section>
      <section class="build-sequence">
        <div class="geometry-heading"><h2>Hub &amp; Knuckle</h2><span>Left &amp; right</span></div>
        <label class="dimension-field" for="steering-pivot-height">
          <span><strong>Steering Pivot Height</strong><small>Above ball joint pivot point</small></span>
          <span class="dimension-input"><input id="steering-pivot-height" type="number" min="1" step="1" /> <small>mm</small></span>
        </label>
        <label class="dimension-field" for="steering-pivot-depth">
          <span><strong>Steering Pivot Depth</strong><small>Rearward from ball joint pivot point</small></span>
          <span class="dimension-input"><input id="steering-pivot-depth" type="number" min="0" step="1" /> <small>mm</small></span>
        </label>
        <label class="dimension-field" for="steering-pivot-offset">
          <span><strong>Steering Pivot Offset</strong><small>In/out from ball joint pivot point</small></span>
          <span class="dimension-input"><input id="steering-pivot-offset" type="number" step="1" /> <small>mm</small></span>
        </label>
        <label class="dimension-field" for="strut-mount-height">
          <span><strong>Strut Mount Height</strong><small>Above ball joint pivot point</small></span>
          <span class="dimension-input"><input id="strut-mount-height" type="number" min="1" step="1" /> <small>mm</small></span>
        </label>
        <label class="dimension-field" for="strut-mount-offset">
          <span><strong>Strut Mount Offset</strong><small>Front/rear from ball joint pivot point</small></span>
          <span class="dimension-input"><input id="strut-mount-offset" type="number" step="1" /> <small>mm</small></span>
        </label>
        <label class="dimension-field" for="strut-mount-location">
          <span><strong>Strut Mount Location</strong><small>In/out from ball joint pivot point</small></span>
          <span class="dimension-input"><input id="strut-mount-location" type="number" step="1" /> <small>mm</small></span>
        </label>
        <label class="dimension-field" for="strut-mount-angle">
          <span><strong>Strut Mount Angle</strong><small>Mount orientation from vertical (front view)</small></span>
          <span class="dimension-input"><input id="strut-mount-angle" type="number" step="1" /> <small>deg</small></span>
        </label>
        <label class="dimension-field" for="strut-max-length">
          <span><strong>Strut Max Length</strong><small>Maximum distance between strut mount and top mount</small></span>
          <span class="dimension-input"><input id="strut-max-length" type="number" min="1" step="1" /> <small>mm</small></span>
        </label>
        <label class="dimension-field" for="strut-min-length">
          <span><strong>Strut Min Length</strong><small>Minimum distance between strut mount and top mount</small></span>
          <span class="dimension-input"><input id="strut-min-length" type="number" min="1" step="1" /> <small>mm</small></span>
        </label>
        <label class="dimension-field" for="strut-static-length">
          <span><strong>Strut Static Length</strong><small>Initial and reset strut length</small></span>
          <span class="dimension-input"><input id="strut-static-length" type="number" min="1" step="1" /> <small>mm</small></span>
        </label>
        <label class="dimension-field" for="hub-height">
          <span><strong>Hub Height</strong><small>Distance along the strut-side hub-face edge</small></span>
          <span class="dimension-input"><input id="hub-height" type="number" min="1" step="1" /> <small>mm</small></span>
        </label>
        <label class="dimension-field" for="hub-spacing">
          <span><strong>Hub Spacing</strong><small>Perpendicular distance from the virtual hub face</small></span>
          <span class="dimension-input"><input id="hub-spacing" type="number" min="1" step="1" /> <small>mm</small></span>
        </label>
      </section>
      <section class="build-sequence">
        <div class="geometry-heading"><h2>Wheel &amp; Tire</h2><span>Wheel assembly</span></div>
        <label class="dimension-field" for="wheel-offset">
          <span><strong>Wheel Offset</strong><small>Offset from the hub mounting face</small></span>
          <span class="dimension-input"><input id="wheel-offset" type="number" step="1" /> <small>mm</small></span>
        </label>
        <label class="dimension-field" for="wheel-diameter">
          <span><strong>Wheel Diameter</strong><small>Rim diameter</small></span>
          <span class="dimension-input"><input id="wheel-diameter" type="number" min="1" step="0.5" /> <small>in</small></span>
        </label>
        <label class="dimension-field" for="tire-section-width">
          <span><strong>Tire Section Width</strong><small>Nominal tire width</small></span>
          <span class="dimension-input"><input id="tire-section-width" type="number" min="1" step="1" /> <small>mm</small></span>
        </label>
        <label class="dimension-field" for="tire-aspect-ratio">
          <span><strong>Tire Aspect Ratio</strong><small>Sidewall height as a percentage of section width</small></span>
          <span class="dimension-input"><input id="tire-aspect-ratio" type="number" min="1" step="1" /> <small>%</small></span>
        </label>
      </section>
      <section class="build-sequence">
        <div class="geometry-heading"><h2>Suspension</h2><span>Spring setup</span></div>
        <label class="dimension-field" for="spring-rate">
          <span><strong>Spring Rate</strong><small>Spring stiffness</small></span>
          <span class="dimension-input"><input id="spring-rate" type="number" min="0.1" step="0.1" /> <small>N/mm</small></span>
        </label>
      </section>
      <p class="sidebar-footnote">Front and rear mount pairs are mirrored equally across the centerline; each mount station has its own height. Strut lengths run from the moving strut mounts to the fixed top mounts and are checked against the configured travel limits.</p>
          </div>
`;
}


export function renderRearSidebar(): string {
  return `          <div class="tab-pane" id="tab-rear">
            <section class="build-sequence">
              <div class="geometry-heading"><h2>Rear Subframe</h2><span>Control arm mounts</span></div>
              <label class="dimension-field" for="rear-camber-arm-inner-mount-height">
                <span><strong>Camber Arm Inner Mount Height</strong><small>Height above the ground plane</small></span>
                <span class="dimension-input"><input id="rear-camber-arm-inner-mount-height" type="number" min="1" step="1" /> <small>mm</small></span>
              </label>
              <label class="dimension-field" for="rear-camber-arm-inner-mount-forward-offset">
                <span><strong>Camber Arm Inner Mount Forward Offset</strong><small>Forward from the rear main arm inner mount</small></span>
                <span class="dimension-input"><input id="rear-camber-arm-inner-mount-forward-offset" type="number" min="1" step="1" /> <small>mm</small></span>
              </label>
              <label class="dimension-field" for="rear-camber-arm-inner-mount-width">
                <span><strong>Camber Arm Inner Mount Width</strong><small>Distance between left and right inner mounts</small></span>
                <span class="dimension-input"><input id="rear-camber-arm-inner-mount-width" type="number" min="1" step="1" /> <small>mm</small></span>
              </label>
              <label class="dimension-field" for="rear-main-arm-inner-mount-width">
                <span><strong>Main arm inner mount width</strong><small>Distance between left and right inner mounts</small></span>
                <span class="dimension-input"><input id="rear-main-arm-inner-mount-width" type="number" min="1" step="1" /> <small>mm</small></span>
              </label>
              <label class="dimension-field" for="rear-main-arm-inner-mount-height">
                <span><strong>Main arm inner mount height</strong><small>Height above the ground plane</small></span>
                <span class="dimension-input"><input id="rear-main-arm-inner-mount-height" type="number" min="1" step="1" /> <small>mm</small></span>
              </label>
              <label class="dimension-field" for="rear-front-to-rear-length">
                <span><strong>Front to Rear length</strong><small>Rearward from front control arm front mounts</small></span>
                <span class="dimension-input"><input id="rear-front-to-rear-length" type="number" min="1" step="1" /> <small>mm</small></span>
              </label>
              <label class="dimension-field" for="rear-toe-arm-inner-mount-width">
                <span><strong>Toe arm inner mount width</strong><small>Distance between left and right inner mounts</small></span>
                <span class="dimension-input"><input id="rear-toe-arm-inner-mount-width" type="number" min="1" step="1" /> <small>mm</small></span>
              </label>
              <label class="dimension-field" for="rear-toe-arm-inner-mount-height">
                <span><strong>Toe arm inner mount height</strong><small>Height above the ground plane</small></span>
                <span class="dimension-input"><input id="rear-toe-arm-inner-mount-height" type="number" min="1" step="1" /> <small>mm</small></span>
              </label>
              <label class="dimension-field" for="rear-toe-arm-main-arm-width">
                <span><strong>Toe arm Main arm width</strong><small>Forward from rear main arm inner mounts</small></span>
                <span class="dimension-input"><input id="rear-toe-arm-main-arm-width" type="number" min="1" step="1" /> <small>mm</small></span>
              </label>
              <label class="dimension-field" for="rear-main-arm-length">
                <span><strong>Rear Main Arm Length</strong><small>Fixed distance between main arm mounts</small></span>
                <span class="dimension-input"><input id="rear-main-arm-length" type="number" min="1" step="1" /> <small>mm</small></span>
              </label>
              <label class="dimension-field" for="rear-toe-arm-length">
                <span><strong>Rear Toe Arm Length</strong><small>Fixed distance between toe arm mounts</small></span>
                <span class="dimension-input"><input id="rear-toe-arm-length" type="number" min="1" step="1" /> <small>mm</small></span>
              </label>
            </section>
            <section class="build-sequence">
              <div class="geometry-heading"><h2>Rear Hub</h2><span>Outer arm mounts</span></div>
              <label class="dimension-field" for="rear-main-arm-outer-mount-static-height">
                <span><strong>Main arm outer mount static height</strong><small>Height above the ground plane</small></span>
                <span class="dimension-input"><input id="rear-main-arm-outer-mount-static-height" type="number" min="1" step="1" /> <small>mm</small></span>
              </label>
              <label class="dimension-field" for="rear-toe-arm-outer-mount-offset">
                <span><strong>Toe arm outer mount offset</strong><small>Offset from the main arm outer mount</small></span>
                <span class="dimension-input"><input id="rear-toe-arm-outer-mount-offset" type="number" min="1" step="1" /> <small>mm</small></span>
              </label>
              <label class="dimension-field" for="rear-toe-arm-outer-mount-height">
                <span><strong>Toe arm outer mount height</strong><small>Height above the ground plane</small></span>
                <span class="dimension-input"><input id="rear-toe-arm-outer-mount-height" type="number" min="1" step="1" /> <small>mm</small></span>
              </label>
              <label class="dimension-field" for="rear-toe-arm-outer-mount-height-offset">
                <span><strong>Toe Arm Outer Mount Height Offset</strong><small>Vertical offset from the main arm outer mount</small></span>
                <span class="dimension-input"><input id="rear-toe-arm-outer-mount-height-offset" type="number" step="1" /> <small>mm</small></span>
              </label>
              <label class="dimension-field" for="rear-toe-arm-outer-mount-forward-offset">
                <span><strong>Toe Arm Outer Mount Forward Offset</strong><small>Forward offset from the main arm outer mount</small></span>
                <span class="dimension-input"><input id="rear-toe-arm-outer-mount-forward-offset" type="number" step="1" /> <small>mm</small></span>
              </label>
              <label class="dimension-field" for="rear-toe-arm-outer-mount-lateral-offset">
                <span><strong>Toe Arm Outer Mount Lateral Offset</strong><small>Inward offset from the main arm outer mount</small></span>
                <span class="dimension-input"><input id="rear-toe-arm-outer-mount-lateral-offset" type="number" step="1" /> <small>mm</small></span>
              </label>
              <label class="dimension-field" for="rear-trailing-arm-length">
                <span><strong>Trailing Arm Length</strong><small>Longitudinal offset for the main arm outer mount</small></span>
                <span class="dimension-input"><input id="rear-trailing-arm-length" type="number" min="1" step="1" /> <small>mm</small></span>
              </label>
              <label class="dimension-field" for="rear-trailing-arm-mount-height">
                <span><strong>Trailing Arm Mount Height</strong><small>Height above the ground plane</small></span>
                <span class="dimension-input"><input id="rear-trailing-arm-mount-height" type="number" min="1" step="1" /> <small>mm</small></span>
              </label>
              <label class="dimension-field" for="rear-trailing-arm-mount-width">
                <span><strong>Trailing Arm Mount Width</strong><small>Distance between left and right mounts</small></span>
                <span class="dimension-input"><input id="rear-trailing-arm-mount-width" type="number" min="1" step="1" /> <small>mm</small></span>
              </label>
              <label class="dimension-field" for="rear-trailing-arm-mount-forward-offset">
                <span><strong>Trailing Arm Mount Forward Offset</strong><small>Forward offset from the rear hub</small></span>
                <span class="dimension-input"><input id="rear-trailing-arm-mount-forward-offset" type="number" min="1" step="1" /> <small>mm</small></span>
              </label>
            </section>
          </div>
`;
}


export function renderSidebar(): string {
  return `    <aside class="sidebar">
      <div class="section-heading">
        <div><p class="eyebrow">Hard chassis points</p><h1>Vehicle frame</h1></div>
        <span class="layout-badge">Front view</span>
      </div>
      <div class="coordinate-note"><span class="axis-icon">XYZ</span><span><strong>Ground-based dimensions</strong><small>Height is measured from the ground plane</small></span></div>
      <div class="tabs-container">
        <div class="tabs-header">
          <button class="tab-button active" data-tab="front">Front</button>
          <button class="tab-button" data-tab="rear">Rear</button>
        </div>
        <div class="tabs-content">
${renderFrontSidebar()}${renderRearSidebar()}        </div>
      </div>
    </aside>
`;
}


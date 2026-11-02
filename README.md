# Suspension Lab

Suspension Lab is a browser-based workbench for building a front suspension model incrementally. The current model contains only a centered, illustrative vehicle chassis frame and the mirrored front lower-control-arm chassis pickup points. No control arms or suspension calculations are included.

## Run locally

Install Node.js 20.19+ or 22.12+, then run:

```powershell
npm install
npm run dev
```

Run the checks and create a static production build with:

```powershell
npm test
npm run build
```

The generated `dist` directory can be deployed to any static web host. Projects are kept in the current browser's local storage. Use **Export JSON** and **Import JSON** to move project files between browsers.

The pickup **Width** is the distance from the vehicle centerline to either point, so the separation is always twice the width. **Height** is measured from the ground plane to the center of each point. Both dimensions can be edited in the sidebar; new or older projects start at 300 mm width and 250 mm height. The frame outline is a centered visual reference, not a dimensioned or calculated chassis.

# Suspension Lab

Suspension Lab is a browser-based workbench for building an editable front suspension geometry model incrementally. It includes mirrored control arms and ball joints, a steering rack with fixed-length tie rods, wheel/knuckle geometry, struts, top mounts, and a centered illustrative chassis frame.

[Open Suspension Lab](https://wedge206.github.io/SuspensionLab/)

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

The front and rear mount locations are independently measured from the vehicle centerline, so each left/right pair is separated by twice its location. **Front Control Arm Depth** sets the front-to-rear distance between the mounts; the front station stays fixed and the rear station moves. Front and rear mount heights are independently measured from the ground plane. Top mounts use their specified total left/right width, height above ground, and rearward offset from the front mount station. The **Front Control Arm** section positions mirrored ball joint points using an outward length from the front mount and a rearward offset; both ball joints remain at the front mount height. Hover over a ball joint to highlight it, then drag vertically to rotate that rigid control-arm triangle around its two chassis mounts. The **Steering Rack** section positions mirrored pivot points at half the rack width on either side of the centerline, at its specified height and rearward offset from the front mount station. The **Wheel & Knuckle** section positions each steering pivot above and rearward from its ball joint, with a signed in/out offset; each strut mount is positioned above and at a signed front/rear and in/out offset from its ball joint. Negative offsets reverse direction from the ball joint. New projects start at 465 mm for both mount locations, 302 mm depth, 250 mm for both mount heights, top mount height 900 mm, width 950 mm and offset 10 mm, 320 mm control arm length, 12 mm ball joint offset, 850 mm steering rack width, 362 mm rack height, and 166 mm rack offset, steering pivot height/depth/offset of 125/210/-24 mm, and strut mount height/offset/location of 130/-10/-89 mm. The strut mount orientation defaults to 10 degrees from vertical in front view; its travel limits default to 450-650 mm. Use **Reset** to restore those defaults for the active project. The frame outline is a centered visual reference, not a dimensioned or calculated chassis.

The virtual hub-face surface is a mirrored triangle on each side. Its corners are the ball joint and the steering pivot and strut mount points extended outward horizontally in the front view. The steering-pivot extension uses the absolute steering pivot offset; the strut-mount extension uses the absolute strut mount location. When the hub steers, the face and both extensions rotate together as a rigid shape, preserving their angles, edge lengths, and right-angle relationships. **Hub Height** (default 60 mm) locates a point along the ball-joint-to-strut-side-face line; **Hub Spacing** (default 94 mm) offsets from that point perpendicular to the virtual face. A 100 mm diameter circle is drawn at the resulting true hub-face center, parallel to the virtual face.

The two extension segments are drawn from the actual steering pivot and strut mount attachment points to their virtual endpoints so the construction and face corners are visible.

The Steering Rack section includes a fixed **Tie Rod Length** (default 341 mm). Each tie rod connects a rack pivot to its steering pivot. The hub is a rigid assembly whose orientation is solved to preserve both tie-rod length and the configured **Strut Mount Angle** relative to the hub. Enter the angle as a positive value (default 15°); the geometry applies it in the negative direction internally. Its fixed strut mount has no pivot marker; the strut telescopes between that mount and the fixed top mount. If those geometric constraints cannot both be satisfied, the viewport reports the geometry error rather than displaying a misleading hub position. The strut length is checked against configured min/max travel, with hard stops during control-arm dragging and a warning for out-of-range geometry.

The **Steering Housing Width** (default 500 mm) sets the width of the steering rack cylinder, centered on the vehicle centerline. Contrasting orange lines mark the steering limiter extensions from the housing to the rack pivots; **Steering Rack Width** continues to set the pivot-to-pivot distance. Drag either steering rack pivot to slide both pivots together while preserving their spacing. The **Steering Limiter** (default 10 mm) sets the additional clearance at either end of the housing and limits total rack travel to the remaining housing clearance.

The **Wheel & Tire** section stores the wheel and tire dimensions: **Wheel Offset** (default -42 mm), **Wheel Diameter** (15 in), **Tire Section Width** (195 mm), and **Tire Aspect Ratio** (65%). The viewport displays an open cylindrical tread band centered on the true hub face shifted along its normal by Wheel Offset. Its width is the Tire Section Width, and its outer diameter is the wheel diameter converted to millimeters plus twice the tire sidewall height (section width times aspect ratio). No wheel rim or sidewall is rendered.

The **Suspension** section sets the spring rate (default 50 N/mm). Calculated values below the 3D viewport include left and right toe in millimeters using the overall tire diameter as the measuring diameter, along with their total; camber is positive when the tire top leans outward, and caster is positive when the top mount is rearward of the ball joint. Scrub radius is the signed lateral distance from the steering-axis ground intersection to the tire centerline, positive when the tire centerline is farther outboard. Motion ratio is the local strut travel divided by vertical tire-center travel, estimated around the current suspension position; wheel rate is calculated as spring rate multiplied by the square of that motion ratio.

The **Rear suspension** section positions a mirrored pair of main arm inner mount points in the 3D viewport. Their width is the distance between the points, their height is measured above the ground plane, and their front to rear length is measured rearward from the front control arm front mount station. The height defaults to 250 mm and the length to 1600 mm, including for previously saved or imported projects that do not yet contain them.

The rear toe arm inner mount points are mirrored across the centerline, separated by the toe arm inner mount width (default 850 mm), and positioned at the toe arm inner mount height above ground (250 mm). They are forward of the rear main arm inner mounts by the toe arm main arm width (190 mm). Existing projects missing these fields receive the same defaults.

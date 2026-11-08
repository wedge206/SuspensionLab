export type FieldConstraint = "positive" | "nonNegative" | "finite";
export type FieldGroup = "front-0" | "front-1" | "front-2" | "front-3" | "front-4" | "front-5" |
    "rear-0" | "rear-1";

export interface FieldUi {
    id: string;
    group: FieldGroup;
    order: number;
    label: string;
    hint: string;
    unit: string;
    min?: string;
    step: string;
    precision?: number;
}

export interface FieldDefinition {
    constraint: FieldConstraint;
    ui?: FieldUi;
}

export const projectFields = {
    frontLowerControlArmPickup: {
        widthMm: {constraint: "positive",
            ui: {
                id: "pickup-width",
                group: "front-0",
                order: 1,
                label: "Front Control Arm Front Mount Location",
                hint: "Vehicle centerline to each point",
                unit: "mm",
                min: "1",
                step: "1"
            }
        },
        rearWidthMm: {constraint: "positive",
            ui: {
                id: "pickup-rear-width",
                group: "front-0",
                order: 2,
                label: "Front Control Arm Rear Mount Location",
                hint: "Vehicle centerline to each point",
                unit: "mm",
                min: "1",
                step: "1"
            }
        },
        controlArmDepthMm: {constraint: "positive",
            ui: {
                id: "control-arm-depth",
                group: "front-0",
                order: 3,
                label: "Front Control Arm Depth",
                hint: "Distance between front and rear mounts",
                unit: "mm",
                min: "1",
                step: "1"
            }
        },
        frontHeightMm: {constraint: "positive",
            ui: {
                id: "pickup-front-height",
                group: "front-0",
                order: 4,
                label: "Front Control Arm Front Mount Height",
                hint: "Height from ground plane",
                unit: "mm",
                min: "1",
                step: "1"
            }
        },
        rearHeightMm: {constraint: "positive",
            ui: {
                id: "pickup-rear-height",
                group: "front-0",
                order: 5,
                label: "Front Control Arm Rear Mount Height",
                hint: "Height from ground plane",
                unit: "mm",
                min: "1",
                step: "1"
            }
        },
    },
    frontControlArm: {
        lengthMm: {constraint: "positive",
            ui: {
                id: "control-arm-length",
                group: "front-1",
                order: 9,
                label: "Control Arm Length",
                hint: "Outward from front mount",
                unit: "mm",
                min: "1",
                step: "1"
            }
        },
        ballJointOffsetMm: {constraint: "nonNegative",
            ui: {
                id: "ball-joint-offset",
                group: "front-1",
                order: 10,
                label: "Ball Joint Offset",
                hint: "Rearward from front mount",
                unit: "mm",
                min: "0",
                step: "1"
            }
        },
        leftRotationRad: {constraint: "finite"},
        rightRotationRad: {constraint: "finite"},
    },
    steeringRack: {
        widthMm: {constraint: "positive",
            ui: {
                id: "steering-rack-width",
                group: "front-2",
                order: 11,
                label: "Steering Rack Width",
                hint: "Distance between pivot points",
                unit: "mm",
                min: "1",
                step: "1"
            }
        },
        centerlineHeightMm: {constraint: "positive",
            ui: {
                id: "steering-rack-height",
                group: "front-2",
                order: 12,
                label: "Steering Rack Centerline Height",
                hint: "Height from ground plane",
                unit: "mm",
                min: "1",
                step: "1"
            }
        },
        centerlineOffsetMm: {constraint: "nonNegative",
            ui: {
                id: "steering-rack-offset",
                group: "front-2",
                order: 13,
                label: "Steering Rack Centerline Offset",
                hint: "Rearward from front mount location",
                unit: "mm",
                min: "0",
                step: "1"
            }
        },
        housingWidthMm: {constraint: "positive",
            ui: {
                id: "steering-housing-width",
                group: "front-2",
                order: 14,
                label: "Steering Housing Width",
                hint: "Width of the rack cylinder",
                unit: "mm",
                min: "1",
                step: "1"
            }
        },
        steeringLimiterMm: {constraint: "nonNegative",
            ui: {
                id: "steering-limiter",
                group: "front-2",
                order: 15,
                label: "Steering Limiter",
                hint: "Extra stop clearance at each end of the housing",
                unit: "mm",
                min: "0",
                step: "1"
            }
        },
        rackTravelMm: {constraint: "finite"},
        tieRodLengthMm: {constraint: "positive",
            ui: {
                id: "tie-rod-length",
                group: "front-2",
                order: 16,
                label: "Tie Rod Length",
                hint: "Fixed length from rack pivot to steering pivot",
                unit: "mm",
                min: "1",
                step: "0.1",
                precision: 1
            }
        },
    },
    frontTopMount: {
        heightMm: {constraint: "positive",
            ui: {
                id: "top-mount-height",
                group: "front-0",
                order: 6,
                label: "Top Mount Height",
                hint: "Height from ground plane",
                unit: "mm",
                min: "1",
                step: "1"
            }
        },
        widthMm: {constraint: "positive",
            ui: {
                id: "top-mount-width",
                group: "front-0",
                order: 7,
                label: "Top Mount Width",
                hint: "Distance between left and right points",
                unit: "mm",
                min: "1",
                step: "1"
            }
        },
        offsetMm: {constraint: "nonNegative",
            ui: {
                id: "top-mount-offset",
                group: "front-0",
                order: 8,
                label: "Top Mount Offset",
                hint: "Rearward from front mount location",
                unit: "mm",
                min: "0",
                step: "1"
            }
        },
    },
    wheelKnuckle: {
        steeringPivotHeightMm: {constraint: "positive",
            ui: {
                id: "steering-pivot-height",
                group: "front-3",
                order: 17,
                label: "Steering Pivot Height",
                hint: "Above ball joint pivot point",
                unit: "mm",
                min: "1",
                step: "1"
            }
        },
        steeringPivotDepthMm: {constraint: "nonNegative",
            ui: {
                id: "steering-pivot-depth",
                group: "front-3",
                order: 18,
                label: "Steering Pivot Depth",
                hint: "Rearward from ball joint pivot point",
                unit: "mm",
                min: "0",
                step: "1"
            }
        },
        steeringPivotOffsetMm: {constraint: "finite",
            ui: {
                id: "steering-pivot-offset",
                group: "front-3",
                order: 19,
                label: "Steering Pivot Offset",
                hint: "In/out from ball joint pivot point",
                unit: "mm",
                step: "1"
            }
        },
        strutMountHeightMm: {constraint: "positive",
            ui: {
                id: "strut-mount-height",
                group: "front-3",
                order: 20,
                label: "Strut Mount Height",
                hint: "Above ball joint pivot point",
                unit: "mm",
                min: "1",
                step: "1"
            }
        },
        strutMountOffsetMm: {constraint: "finite",
            ui: {
                id: "strut-mount-offset",
                group: "front-3",
                order: 21,
                label: "Strut Mount Offset",
                hint: "Front/rear from ball joint pivot point",
                unit: "mm",
                step: "1"
            }
        },
        strutMountLocationMm: {constraint: "finite",
            ui: {
                id: "strut-mount-location",
                group: "front-3",
                order: 22,
                label: "Strut Mount Location",
                hint: "In/out from ball joint pivot point",
                unit: "mm",
                step: "1"
            }
        },
        strutMountAngleDeg: {constraint: "nonNegative",
            ui: {
                id: "strut-mount-angle",
                group: "front-3",
                order: 23,
                label: "Strut Mount Angle",
                hint: "Mount orientation from vertical (front view)",
                unit: "deg",
                step: "1"
            }
        },
        strutMaxLengthMm: {constraint: "positive",
            ui: {
                id: "strut-max-length",
                group: "front-3",
                order: 24,
                label: "Strut Max Length",
                hint: "Maximum distance between strut mount and top mount",
                unit: "mm",
                min: "1",
                step: "1"
            }
        },
        strutMinLengthMm: {constraint: "positive",
            ui: {
                id: "strut-min-length",
                group: "front-3",
                order: 25,
                label: "Strut Min Length",
                hint: "Minimum distance between strut mount and top mount",
                unit: "mm",
                min: "1",
                step: "1"
            }
        },
        strutStaticLengthMm: {constraint: "positive",
            ui: {
                id: "strut-static-length",
                group: "front-3",
                order: 26,
                label: "Strut Static Length",
                hint: "Initial and reset strut length",
                unit: "mm",
                min: "1",
                step: "1"
            }
        },
        hubHeightMm: {constraint: "positive",
            ui: {
                id: "hub-height",
                group: "front-3",
                order: 27,
                label: "Hub Height",
                hint: "Distance along the strut-side hub-face edge",
                unit: "mm",
                min: "1",
                step: "1"
            }
        },
        hubSpacingMm: {constraint: "positive",
            ui: {
                id: "hub-spacing",
                group: "front-3",
                order: 28,
                label: "Hub Spacing",
                hint: "Perpendicular distance from the virtual hub face",
                unit: "mm",
                min: "1",
                step: "1"
            }
        },
    },
    wheelTire: {
        wheelOffsetMm: {constraint: "finite",
            ui: {
                id: "wheel-offset",
                group: "front-4",
                order: 29,
                label: "Wheel Offset",
                hint: "Offset from the hub mounting face",
                unit: "mm",
                step: "1"
            }
        },
        wheelDiameterIn: {constraint: "positive",
            ui: {
                id: "wheel-diameter",
                group: "front-4",
                order: 30,
                label: "Wheel Diameter",
                hint: "Rim diameter",
                unit: "in",
                min: "1",
                step: "0.5"
            }
        },
        tireSectionWidthMm: {constraint: "positive",
            ui: {
                id: "tire-section-width",
                group: "front-4",
                order: 31,
                label: "Tire Section Width",
                hint: "Nominal tire width",
                unit: "mm",
                min: "1",
                step: "1"
            }
        },
        tireAspectRatio: {constraint: "positive",
            ui: {
                id: "tire-aspect-ratio",
                group: "front-4",
                order: 32,
                label: "Tire Aspect Ratio",
                hint: "Sidewall height as a percentage of section width",
                unit: "%",
                min: "1",
                step: "1"
            }
        },
    },
    suspension: {
        springRateNPerMm: {constraint: "positive",
            ui: {
                id: "spring-rate",
                group: "front-5",
                order: 33,
                label: "Spring Rate",
                hint: "Spring stiffness",
                unit: "N/mm",
                min: "0.1",
                step: "0.1"
            }
        },
    },
    rearSuspension: {
        camberArmInnerMountHeightMm: {constraint: "positive",
            ui: {
                id: "rear-camber-arm-inner-mount-height",
                group: "rear-0",
                order: 34,
                label: "Camber Arm Inner Mount Height",
                hint: "Height above the ground plane",
                unit: "mm",
                min: "1",
                step: "1"
            }
        },
        camberArmInnerMountForwardOffsetMm: {constraint: "positive",
            ui: {
                id: "rear-camber-arm-inner-mount-forward-offset",
                group: "rear-0",
                order: 35,
                label: "Camber Arm Inner Mount Forward Offset",
                hint: "Forward from the rear main arm inner mount",
                unit: "mm",
                min: "1",
                step: "1"
            }
        },
        camberArmInnerMountWidthMm: {constraint: "positive",
            ui: {
                id: "rear-camber-arm-inner-mount-width",
                group: "rear-0",
                order: 36,
                label: "Camber Arm Inner Mount Width",
                hint: "Distance between left and right inner mounts",
                unit: "mm",
                min: "1",
                step: "1"
            }
        },
        mainArmInnerMountWidthMm: {constraint: "positive",
            ui: {
                id: "rear-main-arm-inner-mount-width",
                group: "rear-0",
                order: 37,
                label: "Main arm inner mount width",
                hint: "Distance between left and right inner mounts",
                unit: "mm",
                min: "1",
                step: "1"
            }
        },
        mainArmInnerMountHeightMm: {constraint: "positive",
            ui: {
                id: "rear-main-arm-inner-mount-height",
                group: "rear-0",
                order: 38,
                label: "Main arm inner mount height",
                hint: "Height above the ground plane",
                unit: "mm",
                min: "1",
                step: "1"
            }
        },
        frontToRearLengthMm: {constraint: "positive",
            ui: {
                id: "rear-front-to-rear-length",
                group: "rear-0",
                order: 39,
                label: "Front to Rear length",
                hint: "Rearward from front control arm front mounts",
                unit: "mm",
                min: "1",
                step: "1"
            }
        },
        toeArmInnerMountWidthMm: {constraint: "positive",
            ui: {
                id: "rear-toe-arm-inner-mount-width",
                group: "rear-0",
                order: 40,
                label: "Toe arm inner mount width",
                hint: "Distance between left and right inner mounts",
                unit: "mm",
                min: "1",
                step: "1"
            }
        },
        toeArmInnerMountHeightMm: {constraint: "positive",
            ui: {
                id: "rear-toe-arm-inner-mount-height",
                group: "rear-0",
                order: 41,
                label: "Toe arm inner mount height",
                hint: "Height above the ground plane",
                unit: "mm",
                min: "1",
                step: "1"
            }
        },
        toeArmMainArmWidthMm: {constraint: "positive",
            ui: {
                id: "rear-toe-arm-main-arm-width",
                group: "rear-0",
                order: 42,
                label: "Toe arm Main arm width",
                hint: "Forward from rear main arm inner mounts",
                unit: "mm",
                min: "1",
                step: "1"
            }
        },
        mainArmLengthMm: {constraint: "positive",
            ui: {
                id: "rear-main-arm-length",
                group: "rear-0",
                order: 43,
                label: "Rear Main Arm Length",
                hint: "Fixed distance between main arm mounts",
                unit: "mm",
                min: "1",
                step: "1"
            }
        },
        toeArmLengthMm: {constraint: "positive",
            ui: {
                id: "rear-toe-arm-length",
                group: "rear-0",
                order: 44,
                label: "Rear Toe Arm Length",
                hint: "Fixed distance between toe arm mounts",
                unit: "mm",
                min: "1",
                step: "1"
            }
        },
        leftRotationRad: {constraint: "finite"},
        rightRotationRad: {constraint: "finite"},
        leftVerticalOffsetMm: {constraint: "finite"},
        rightVerticalOffsetMm: {constraint: "finite"},
    },
    rearHub: {
        camberArmOuterMountHeightMm: {constraint: "positive",
            ui: {
                id: "rear-camber-arm-outer-mount-height",
                group: "rear-1",
                order: 55,
                label: "Camber Arm Outer Mount Height",
                hint: "Height above the main arm outer mount",
                unit: "mm",
                min: "1",
                step: "1"
            }
        },
        camberArmOuterMountForwardOffsetMm: {constraint: "finite",
            ui: {
                id: "rear-camber-arm-outer-mount-forward-offset",
                group: "rear-1",
                order: 56,
                label: "Camber Arm Outer Mount Forward Offset",
                hint: "Forward offset from the main arm outer mount",
                unit: "mm",
                step: "1"
            }
        },
        camberArmOuterMountLateralOffsetMm: {constraint: "finite",
            ui: {
                id: "rear-camber-arm-outer-mount-lateral-offset",
                group: "rear-1",
                order: 57,
                label: "Camber Arm Outer Mount Lateral Offset",
                hint: "Inward offset from the main arm outer mount (negative is outward)",
                unit: "mm",
                step: "1"
            }
        },
        mainArmOuterMountStaticHeightMm: {constraint: "positive",
            ui: {
                id: "rear-main-arm-outer-mount-static-height",
                group: "rear-1",
                order: 45,
                label: "Main arm outer mount static height",
                hint: "Height above the ground plane",
                unit: "mm",
                min: "1",
                step: "1"
            }
        },
        toeArmOuterMountOffsetMm: {constraint: "positive",
            ui: {
                id: "rear-toe-arm-outer-mount-offset",
                group: "rear-1",
                order: 46,
                label: "Toe arm outer mount offset",
                hint: "Offset from the main arm outer mount",
                unit: "mm",
                min: "1",
                step: "1"
            }
        },
        toeArmOuterMountHeightMm: {constraint: "positive",
            ui: {
                id: "rear-toe-arm-outer-mount-height",
                group: "rear-1",
                order: 47,
                label: "Toe arm outer mount height",
                hint: "Height above the ground plane",
                unit: "mm",
                min: "1",
                step: "1"
            }
        },
        toeArmOuterMountHeightOffsetMm: {constraint: "finite",
            ui: {
                id: "rear-toe-arm-outer-mount-height-offset",
                group: "rear-1",
                order: 48,
                label: "Toe Arm Outer Mount Height Offset",
                hint: "Vertical offset from the main arm outer mount",
                unit: "mm",
                step: "1"
            }
        },
        toeArmOuterMountForwardOffsetMm: {constraint: "finite",
            ui: {
                id: "rear-toe-arm-outer-mount-forward-offset",
                group: "rear-1",
                order: 49,
                label: "Toe Arm Outer Mount Forward Offset",
                hint: "Forward offset from the main arm outer mount",
                unit: "mm",
                step: "1"
            }
        },
        toeArmOuterMountLateralOffsetMm: {constraint: "finite",
            ui: {
                id: "rear-toe-arm-outer-mount-lateral-offset",
                group: "rear-1",
                order: 50,
                label: "Toe Arm Outer Mount Lateral Offset",
                hint: "Inward offset from the main arm outer mount",
                unit: "mm",
                step: "1"
            }
        },
        trailingArmLengthMm: {constraint: "positive",
            ui: {
                id: "rear-trailing-arm-length",
                group: "rear-1",
                order: 51,
                label: "Trailing Arm Length",
                hint: "Longitudinal offset for the main arm outer mount",
                unit: "mm",
                min: "1",
                step: "1"
            }
        },
        trailingArmMountHeightMm: {constraint: "positive",
            ui: {
                id: "rear-trailing-arm-mount-height",
                group: "rear-1",
                order: 52,
                label: "Trailing Arm Mount Height",
                hint: "Height above the ground plane",
                unit: "mm",
                min: "1",
                step: "1"
            }
        },
        trailingArmMountWidthMm: {constraint: "positive",
            ui: {
                id: "rear-trailing-arm-mount-width",
                group: "rear-1",
                order: 53,
                label: "Trailing Arm Mount Width",
                hint: "Distance between left and right mounts",
                unit: "mm",
                min: "1",
                step: "1"
            }
        },
        trailingArmMountForwardOffsetMm: {constraint: "positive",
            ui: {
                id: "rear-trailing-arm-mount-forward-offset",
                group: "rear-1",
                order: 54,
                label: "Trailing Arm Mount Forward Offset",
                hint: "Forward offset from the rear hub",
                unit: "mm",
                min: "1",
                step: "1"
            }
        },
    },
} as const satisfies Record<string, Record<string, FieldDefinition>>;

export type ProjectParameters = {
    -readonly [Section in keyof typeof projectFields]: {
        -readonly [Key in keyof (typeof projectFields)[Section]]: number;
    };
};

export type ProjectSection = keyof ProjectParameters;

export interface ProjectField {
    section: ProjectSection;
    key: string;
    definition: FieldDefinition;
}

export const allProjectFields: ProjectField[] = Object.entries(projectFields).flatMap(([section, fields]) =>
    Object.entries(fields).map(([key, definition]) => ({section: section as ProjectSection, key, definition})),
);

export function isValidFieldValue(value: unknown, constraint: FieldConstraint): value is number {
    return typeof value === "number" && Number.isFinite(value) &&
        (constraint === "finite" || (constraint === "positive" ? value > 0 : value >= 0));
}

export function getFieldValue(project: ProjectParameters, field: ProjectField): number {
    return (project[field.section] as Record<string, number>)[field.key];
}

export function setFieldValue(project: ProjectParameters, field: ProjectField, value: number): void {
    (project[field.section] as Record<string, number>)[field.key] = value;
}

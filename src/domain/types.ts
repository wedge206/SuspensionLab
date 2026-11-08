import type {ProjectParameters} from "./fields";

export type Vec3 = [number, number, number];

export type SuspensionProject = {
    id: string;
    name: string;
} & ProjectParameters;

import type { Vec3 } from "./types";

export const FRONT_PICKUP_STATION_MM = 650;

export function frontLowerControlArmPoints(widthMm: number, heightMm: number): [Vec3, Vec3] {
  return [
    [FRONT_PICKUP_STATION_MM, widthMm, heightMm],
    [FRONT_PICKUP_STATION_MM, -widthMm, heightMm],
  ];
}

export * from "./barbershop";
export * from "./barbershop/actions";
export * from "./cafe";
export * from "./cafe/actions";
export * from "./retail";
export * from "./retail/actions";
export * from "./laundry";
export * from "./laundry/actions";

import { BARBERSHOP_PLUGIN_MANIFEST } from "./barbershop";
import { CAFE_PLUGIN_MANIFEST } from "./cafe";
import { RETAIL_PLUGIN_MANIFEST } from "./retail";
import { LAUNDRY_PLUGIN_MANIFEST } from "./laundry";

export const ALL_PLUGIN_MANIFESTS = [
  BARBERSHOP_PLUGIN_MANIFEST,
  CAFE_PLUGIN_MANIFEST,
  RETAIL_PLUGIN_MANIFEST,
  LAUNDRY_PLUGIN_MANIFEST,
];

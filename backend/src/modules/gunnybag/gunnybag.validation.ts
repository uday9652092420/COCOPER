import { GunnyBagCreateDTO } from "./gunnybag.types.js";

export function validateGunnyBagPayload(
  payload: Partial<GunnyBagCreateDTO>
) {
  const errors: Record<string, string> = {};

  if (!payload.code?.trim()) {
    errors.code = "Gunny Bag code is required";
  }

  if (!payload.name?.trim()) {
    errors.name = "Gunny Bag name is required";
  }

  if (
    payload.rate_per_bag === undefined ||
    payload.rate_per_bag === null ||
    Number(payload.rate_per_bag) < 0
  ) {
    errors.rate_per_bag = "Rate per bag is required";
  }

  return Object.keys(errors).length ? errors : null;
}
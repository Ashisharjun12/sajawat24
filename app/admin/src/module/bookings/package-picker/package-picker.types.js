/**
 * @typedef {Object} PackageSelection
 * @property {string} productId
 * @property {string} productName
 * @property {string} scheduledAt
 * @property {number} quantity
 * @property {string[]} addonIds
 * @property {string} cityId
 * @property {string} cityName
 */

/**
 * @typedef {Object} PackagePickerDialogProps
 * @property {boolean} open
 * @property {(open: boolean) => void} onOpenChange
 * @property {string} [initialCityId]
 * @property {PackageSelection | null} [initialSelection]
 * @property {(selection: PackageSelection) => void} onConfirm
 */

export const EMPTY_DRAFT = {
  productId: "",
  productName: "",
  scheduledAt: "",
  quantity: 1,
  addonIds: [],
}

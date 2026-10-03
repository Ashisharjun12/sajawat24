import { config } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { seedDemoAccess } from "@/db/seeds/demo-access.seed.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
config({ path: path.join(root, ".env") });

const result = await seedDemoAccess();

console.log("Demo access accounts ready (idempotent).");
console.log("");
console.log("Credentials (also in Play Console → App access):");
console.log(`  Customer app:  ${result.credentials.customerPhone}  OTP: ${result.credentials.otp}`);
console.log(`  Vendor owner:  ${result.credentials.vendorOwnerPhone}  OTP: ${result.credentials.otp}`);
console.log(`  Vendor staff:  ${result.credentials.vendorStaffPhone}  OTP: ${result.credentials.otp}`);
console.log("");
console.log(`Vendor shop city: ${result.cityName}`);
console.log("Next: Admin → Settings → Demo credentials → enable demo login toggles.");

import { validatePluginPackage } from "./src/types/plugin-package";
import {
  sanitizePosSlots,
  sanitizeDashboardSlots,
  sanitizeReceiptBlocks,
} from "./src/lib/registry/widget-registry";

import cyberDark from "./src/lib/registry/presets/theme-cyber-dark.json";
import cafeEmerald from "./src/lib/registry/presets/theme-cafe-emerald.json";
import receipt80mm from "./src/lib/registry/presets/receipt-modern-thermal-80mm.json";
import receipt58mm from "./src/lib/registry/presets/receipt-compact-58mm.json";

console.log("=========================================");
console.log("🔍 TESTING QASSA PLUGIN PACKAGE VALIDATOR");
console.log("=========================================\n");

const presets = [
  { name: "theme-cyber-dark.json", data: cyberDark },
  { name: "theme-cafe-emerald.json", data: cafeEmerald },
  { name: "receipt-modern-thermal-80mm.json", data: receipt80mm },
  { name: "receipt-compact-58mm.json", data: receipt58mm },
];

let allPassed = true;

for (const preset of presets) {
  console.log(`Checking [${preset.name}]...`);
  const result = validatePluginPackage(preset.data);

  if (!result.success) {
    console.error(`❌ FAILED: ${result.error}`);
    allPassed = false;
  } else {
    console.log(`✅ VALID: Manifest ID = "${result.package?.manifest.id}", Type = ${result.package?.manifest.type}`);

    // If it has POS layout, test sanitization
    if (result.package?.layouts?.pos?.slots) {
      const sanitized = sanitizePosSlots(result.package.layouts.pos.slots);
      console.log(`   -> POS Slots Validated (${sanitized.length} widgets allowed)`);
    }

    // If it has Dashboard layout, test sanitization
    if (result.package?.layouts?.dashboard?.slots) {
      const sanitized = sanitizeDashboardSlots(result.package.layouts.dashboard.slots);
      console.log(`   -> Dashboard Slots Validated (${sanitized.length} widgets allowed)`);
    }

    // If it has Receipt blocks, test sanitization
    if (result.package?.receipt?.blocks) {
      const sanitized = sanitizeReceiptBlocks(result.package.receipt.blocks);
      console.log(`   -> Receipt Blocks Validated (${sanitized.length} blocks allowed)`);
    }
  }
  console.log("-----------------------------------------");
}

if (allPassed) {
  console.log("\n🎉 ALL PLUGIN PACKAGES & VALIDATIONS PASSED PERFECTLY!");
} else {
  console.error("\n⚠️ SOME PACKAGES FAILED VALIDATION.");
  process.exit(1);
}

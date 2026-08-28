#!/usr/bin/env python3
"""
Replace the root <div className="space-y-4"> with <Card> for the 11
tool files that use a plain div wrapper instead of a Card frame.

For each file:
1. Find the FIRST `return (\n    <div className="space-y-4">` pattern
2. Replace it with `return (\n    <Card>`
3. Find the LAST `</div>` before the closing `)` and replace with `</Card>`

We only touch the ROOT-level div — nested divs are left alone.
"""

import re

FILES = [
    'src/components/agri/nutri-tools/CropRotationPlanner.tsx',
    'src/components/agri/nutri-tools/WeatherRadar.tsx',
    'src/components/agri/nutri-tools/EvapotranspirationTracker.tsx',
    'src/components/agri/nutri-tools/SoilTestHistoryTracker.tsx',
    'src/components/agri/nutri-tools/FinancialDashboard.tsx',
    'src/components/agri/nutri-tools/ReportGenerator.tsx',
    'src/components/agri/nutri-tools/CoordinateConverter.tsx',
    'src/components/agri/nutri-tools/GamificationPanel.tsx',
    'src/components/agri/nutri-tools/FarmerCommunity.tsx',
    'src/components/agri/nutri-tools/Marketplace.tsx',
    'src/components/agri/nutri-tools/WaterHardnessDiagnostic.tsx',
]

for filepath in FILES:
    with open(filepath, 'r') as f:
        content = f.read()

    # Find the first `return (` followed by `<div className="space-y-4">`
    # The pattern: return (\n    <div className="space-y-4">
    # Replace with: return (\n    <Card>

    # Step 1: Replace the opening div
    old_open = 'return (\n    <div className="space-y-4">'
    new_open = 'return (\n    <Card>'

    if old_open in content:
        content = content.replace(old_open, new_open, 1)
        print(f"  ✓ Replaced opening div in {filepath.split('/')[-1]}")
    else:
        # Try with different indentation
        old_open2 = 'return (\n      <div className="space-y-4">'
        new_open2 = 'return (\n      <Card>'
        if old_open2 in content:
            content = content.replace(old_open2, new_open2, 1)
            print(f"  ✓ Replaced opening div (6-indent) in {filepath.split('/')[-1]}")
        else:
            print(f"  ✗ Could not find opening div in {filepath.split('/')[-1]}")
            continue

    # Step 2: Replace the closing </div>
    # Find the LAST `</div>\n  );` or `</div>\n    );` pattern
    # We need to match the closing of the root div

    # Try 4-indent closing
    old_close = '    </div>\n  );'
    new_close = '    </Card>\n  );'

    if old_close in content:
        # Replace the LAST occurrence
        idx = content.rfind(old_close)
        content = content[:idx] + new_close + content[idx + len(old_close):]
        print(f"  ✓ Replaced closing div (4-indent) in {filepath.split('/')[-1]}")
    else:
        # Try 6-indent closing
        old_close2 = '      </div>\n    );'
        new_close2 = '      </Card>\n    );'
        if old_close2 in content:
            idx = content.rfind(old_close2)
            content = content[:idx] + new_close2 + content[idx + len(old_close2):]
            print(f"  ✓ Replaced closing div (6-indent) in {filepath.split('/')[-1]}")
        else:
            print(f"  ⚠ Could not find closing div in {filepath.split('/')[-1]} (manual check needed)")

    with open(filepath, 'w') as f:
        f.write(content)

print("\nDone!")

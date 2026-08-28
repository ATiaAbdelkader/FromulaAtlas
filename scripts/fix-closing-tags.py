#!/usr/bin/env python3
"""
Fix the JSX closing tag mismatch caused by the first script.
The issue: the script replaced the last `</div>\n  );` but that wasn't
always the root div's closing tag — some files have nested structures
where the root `</div>` closes earlier.

Strategy: For each file, find the `<Card>` we added (first occurrence
in a return statement), then scan forward to find its matching closing
tag by tracking div/Card nesting depth. Replace the wrong `</Card>`
back to `</div>` and put `</Card>` at the correct position.
"""

import re

FILES = [
    'src/components/agri/nutri-tools/CropRotationPlanner.tsx',
    'src/components/agri/nutri-tools/WeatherRadar.tsx',
    'src/components/agri/nutri-tools/EvapotranspirationTracker.tsx',
    'src/components/agri/nutri-tools/FinancialDashboard.tsx',
    'src/components/agri/nutri-tools/GamificationPanel.tsx',
    'src/components/agri/nutri-tools/FarmerCommunity.tsx',
    'src/components/agri/nutri-tools/WaterHardnessDiagnostic.tsx',
    'src/components/agri/nutri-tools/CoordinateConverter.tsx',
]

for filepath in FILES:
    with open(filepath, 'r') as f:
        lines = f.readlines()

    # Find the line with `<Card>` (the root opening we added)
    card_open_line = None
    for i, line in enumerate(lines):
        if '<Card>' in line and 'return' in lines[i-1] if i > 0 else False:
            card_open_line = i
            break
        # Also check if <Card> is on the return line itself
        if '<Card>' in line and 'return' in line:
            card_open_line = i
            break

    if card_open_line is None:
        # Try finding the first standalone <Card>
        for i, line in enumerate(lines):
            if line.strip() == '<Card>':
                card_open_line = i
                break

    if card_open_line is None:
        print(f"  ✗ Could not find <Card> in {filepath.split('/')[-1]}")
        continue

    # Now scan forward from card_open_line to find the matching close
    # Track nesting: <Card> +1, </Card> -1, <div +1, </div> -1
    depth = 1  # We start after the opening <Card>
    card_close_line = None

    for i in range(card_open_line + 1, len(lines)):
        line = lines[i]
        # Count opening tags
        opens = len(re.findall(r'<Card[>\s]', line)) + len(re.findall(r'<div[>\s]', line))
        # Count closing tags
        closes = len(re.findall(r'</Card>', line)) + len(re.findall(r'</div>', line))

        depth += opens - closes

        if depth == 0:
            # This line contains the matching close tag
            card_close_line = i
            # Check if this line has </Card> (already correct) or </div> (needs fixing)
            if '</Card>' in line:
                print(f"  ✓ Already correct in {filepath.split('/')[-1]} (line {i+1})")
            elif '</div>' in line:
                # Replace </div> with </Card> on this line
                lines[i] = line.replace('</div>', '</Card>', 1)
                print(f"  ✓ Fixed closing tag in {filepath.split('/')[-1]} (line {i+1})")
            break

    # Now check if there's a stray </Card> that was incorrectly placed
    # (from the first script). Find any </Card> that's NOT at card_close_line
    # and change it back to </div>
    for i in range(len(lines)):
        if i == card_close_line:
            continue
        if '</Card>' in lines[i] and i > card_open_line:
            # This is likely the wrong </Card> from the first script
            lines[i] = lines[i].replace('</Card>', '</div>', 1)
            print(f"  ✓ Reverted stray </Card> to </div> in {filepath.split('/')[-1]} (line {i+1})")
            break

    with open(filepath, 'w') as f:
        f.writelines(lines)

# Handle remaining files that might already be correct
REMAINING = [
    'src/components/agri/nutri-tools/SoilTestHistoryTracker.tsx',
    'src/components/agri/nutri-tools/ReportGenerator.tsx',
    'src/components/agri/nutri-tools/Marketplace.tsx',
]

for filepath in REMAINING:
    with open(filepath, 'r') as f:
        content = f.read()
    # Check if there's a mismatch
    card_opens = content.count('<Card>')
    card_closes = content.count('</Card>')
    if card_opens != card_closes:
        print(f"  ⚠ Mismatch in {filepath.split('/')[-1]}: {card_opens} opens, {card_closes} closes")
    else:
        print(f"  ✓ Balanced in {filepath.split('/')[-1]}: {card_opens} opens, {card_closes} closes")

print("\nDone!")

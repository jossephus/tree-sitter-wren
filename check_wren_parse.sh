#!/bin/bash
total=0
fail=0

while IFS= read -r f; do
  total=$((total + 1))
  output=$(tree-sitter parse "$f" 2>/dev/null)
  errors=$(echo "$output" | grep -c "^ *(ERROR\|^ *(MISSING")
  if [ "$errors" -gt 0 ]; then
    fail=$((fail + 1))
    echo "[$errors errors] $f"
  fi
done < <(find /Users/jossephus/workspace/zigspace/src/wren-lsp/test -name '*.wren' | sort)
# done < <(find  /Users/jossephus/workspace/zigspace/src/wren-lsp/examples/2025.11.1 -name '*.wren' | sort)

echo ""
echo "Total: $total files, $fail with errors, $((total - fail)) clean"

#!/usr/bin/env python3
import sys
import re

def audit_reentrancy(file_path):
    with open(file_path, 'r') as f:
        content = f.read()

    # Simple regex to check for Checks-Effects-Interactions (CEI) violation
    # This looks for .call followed by a state change like balances[...] = 0
    
    call_pos = content.find(".call{")
    state_change_pos = re.search(r'balances\[.*\]\s*=', content)
    
    if call_pos != -1 and state_change_pos:
        if call_pos < state_change_pos.start():
            print(f"FAILED: Reentrancy vulnerability found in {file_path}")
            print("Detail: External call (.call) occurs BEFORE state update (balances[...] =).")
            return False
            
    print(f"PASSED: No obvious reentrancy pattern found in {file_path}")
    return True

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python audit_check.py <file_path>")
        sys.exit(1)
    
    success = audit_reentrancy(sys.argv[1])
    sys.exit(0 if success else 1)

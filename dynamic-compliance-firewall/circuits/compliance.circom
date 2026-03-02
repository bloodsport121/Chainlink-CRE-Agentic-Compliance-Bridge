// Owner: Justin Gramke (jmgramke@gmail.com)
pragma circom 2.0.0;
include "../node_modules/circomlib/circuits/comparators.circom";

// Proves:
// 1. userBankBalance >= requiredBalance
// 2. userJurisdiction == allowedJurisdiction
template ComplianceCheck() {
    signal input userBankBalance; 
    signal input requiredBalance; 
    signal input userJurisdiction;
    signal input allowedJurisdiction;

    signal output isCompliant;

    // Check Balance
    component balanceCheck = GreaterEqThan(64);
    balanceCheck.in[0] <== userBankBalance;
    balanceCheck.in[1] <== requiredBalance;
    balanceCheck.out === 1;

    // Check Jurisdiction
    component jurisdictionCheck = IsEqual();
    jurisdictionCheck.in[0] <== userJurisdiction;
    jurisdictionCheck.in[1] <== allowedJurisdiction;
    jurisdictionCheck.out === 1;

    isCompliant <== 1;
}

// In Groth16, public signals are typically listed in order
component main {public [requiredBalance, allowedJurisdiction]} = ComplianceCheck();

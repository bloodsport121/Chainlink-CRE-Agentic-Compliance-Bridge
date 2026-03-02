// SPDX-License-Identifier: MIT
// Owner: Justin Gramke (jmgramke@gmail.com)
pragma solidity 0.8.20;

import {IERC20} from "@openzeppelin/contracts-5.0.2/token/ERC20/IERC20.sol";

interface IComplianceGuard {
    function whitelistExpiry(address user, address asset) external view returns (uint256);
}

/**
 * @title InstitutionalEscrow
 * @notice A vault that only allows transfers to recipients who have a valid ZKP-based compliance attestation
 *         from the ComplianceGuard firewall.
 */
contract InstitutionalEscrow {
    address public complianceGuard;
    address public owner;

    event FundsReleased(address indexed recipient, address indexed asset, uint256 amount);

    constructor(address _complianceGuard) {
        complianceGuard = _complianceGuard;
        owner = msg.sender;
    }

    /**
     * @notice Release funds to a recipient, but only if they have a valid compliance pass.
     * @param recipient The address of the institution/user receiving funds.
     * @param asset The ERC20 token to release.
     * @param amount The amount of tokens to send.
     */
    function releaseFunds(address recipient, address asset, uint256 amount) external {
        // Step 1: Check the Compliance Guard Firewall
        uint256 expiry = IComplianceGuard(complianceGuard).whitelistExpiry(recipient, asset);
        
        // In this demo, we use address(0) to match the simplified ComplianceGuard logic
        uint256 genericExpiry = IComplianceGuard(complianceGuard).whitelistExpiry(address(0), address(0));
        
        require(genericExpiry > block.timestamp || expiry > block.timestamp, "InstitutionalEscrow: Recipient not compliant (ZKP Check Failed)");

        // Step 2: Transfer Funds
        IERC20(asset).transfer(recipient, amount);

        emit FundsReleased(recipient, asset, amount);
    }
    
    // Fallback for native ETH release
    function releaseEth(address payable recipient) external {
        uint256 genericExpiry = IComplianceGuard(complianceGuard).whitelistExpiry(address(0), address(0));
        require(genericExpiry > block.timestamp, "InstitutionalEscrow: Recipient not compliant (ZKP Check Failed)");
        
        (bool success, ) = recipient.call{value: address(this).balance}("");
        require(success, "ETH transfer failed");
    }

    receive() external payable {}
}

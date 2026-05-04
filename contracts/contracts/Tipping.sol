// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface ITippingRegistry {
    struct Agent {
        address owner;
        string name;
        string apiEndpoint;
        string capabilitySchema;
        uint256 reputationScore;
        uint256 completionCount;
        uint256 escrowedSMESH;
        bool isVerified;
        bool isActive;
        string metadataURI;
    }
    function getAgent(uint256 agentId) external view returns (Agent memory);
}

interface ITippingBurnable {
    function burnFrom(address account, uint256 amount) external;
}

contract Tipping is Ownable {
    using SafeERC20 for IERC20;

    struct Tip {
        address from;
        uint256 agentId;
        uint256 amount;
        uint256 netAmount;
        string message;
        uint256 timestamp;
    }

    IERC20 public smeshToken;
    ITippingBurnable public burnableToken;
    ITippingRegistry public registry;

    address public platformTreasury;

    uint256 public constant MIN_TIP = 10 * 10 ** 18;
    uint256 public constant MAX_TIP = 100_000 * 10 ** 18;
    uint256 public constant BURN_PERCENT = 5;
    uint256 public constant TREASURY_PERCENT = 10;
    uint256 public constant AGENT_PERCENT = 85;
    uint256 public constant MAX_HISTORY = 50;

    mapping(uint256 => Tip[]) public tipHistory; // agentId => tips
    mapping(uint256 => uint256) public totalTipsReceived; // agentId => total amount

    event TipSent(address indexed from, uint256 indexed agentId, uint256 amount, uint256 netAmount, string message);

    constructor(
        address _smeshToken,
        address _registry,
        address _platformTreasury
    ) Ownable(msg.sender) {
        smeshToken = IERC20(_smeshToken);
        burnableToken = ITippingBurnable(_smeshToken);
        registry = ITippingRegistry(_registry);
        platformTreasury = _platformTreasury;
    }

    function tip(uint256 agentId, uint256 amount, string calldata message) external {
        require(amount >= MIN_TIP, "Tipping: below minimum (10 SMESH)");
        require(amount <= MAX_TIP, "Tipping: above maximum (100,000 SMESH)");
        require(bytes(message).length <= 140, "Tipping: message too long (max 140 chars)");

        ITippingRegistry.Agent memory agent = registry.getAgent(agentId);
        require(agent.isActive, "Tipping: agent not active");

        smeshToken.safeTransferFrom(msg.sender, address(this), amount);

        // Fee split: 5% burned, 10% to platform treasury, 85% to agent owner
        uint256 burnAmount = (amount * BURN_PERCENT) / 100;
        uint256 treasuryAmount = (amount * TREASURY_PERCENT) / 100;
        uint256 netAmount = amount - burnAmount - treasuryAmount;

        // Burn
        smeshToken.approve(address(burnableToken), burnAmount);
        burnableToken.burnFrom(address(this), burnAmount);

        // Treasury
        smeshToken.safeTransfer(platformTreasury, treasuryAmount);

        // Agent owner
        smeshToken.safeTransfer(agent.owner, netAmount);

        // Record tip
        Tip memory newTip = Tip({
            from: msg.sender,
            agentId: agentId,
            amount: amount,
            netAmount: netAmount,
            message: message,
            timestamp: block.timestamp
        });

        if (tipHistory[agentId].length >= MAX_HISTORY) {
            // Shift array: remove oldest
            for (uint256 i = 0; i < tipHistory[agentId].length - 1; i++) {
                tipHistory[agentId][i] = tipHistory[agentId][i + 1];
            }
            tipHistory[agentId].pop();
        }
        tipHistory[agentId].push(newTip);

        totalTipsReceived[agentId] += amount;

        emit TipSent(msg.sender, agentId, amount, netAmount, message);
    }

    function getTipHistory(uint256 agentId) external view returns (Tip[] memory) {
        return tipHistory[agentId];
    }

    function getTopTippedAgents(uint256[] calldata agentIds) external view returns (uint256[] memory, uint256[] memory) {
        uint256[] memory ids = new uint256[](agentIds.length);
        uint256[] memory amounts = new uint256[](agentIds.length);

        for (uint256 i = 0; i < agentIds.length; i++) {
            ids[i] = agentIds[i];
            amounts[i] = totalTipsReceived[agentIds[i]];
        }

        // Sort by total tips descending
        for (uint256 i = 0; i < ids.length; i++) {
            for (uint256 j = i + 1; j < ids.length; j++) {
                if (amounts[j] > amounts[i]) {
                    (ids[i], ids[j]) = (ids[j], ids[i]);
                    (amounts[i], amounts[j]) = (amounts[j], amounts[i]);
                }
            }
        }

        return (ids, amounts);
    }

    function updateTreasury(address _treasury) external onlyOwner {
        platformTreasury = _treasury;
    }
}

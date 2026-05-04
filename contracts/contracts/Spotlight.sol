// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface ISpotlightRegistry {
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
    function recordSpotlight(uint256 agentId) external;
}

interface ISpotlightBurnable {
    function burnFrom(address account, uint256 amount) external;
}

contract Spotlight is Ownable {
    using SafeERC20 for IERC20;

    enum Tier { Bronze, Silver, Gold }

    struct SpotlightEntry {
        uint256 agentId;
        address owner;
        Tier tier;
        uint256 startedAt;
        uint256 expiresAt;
        uint256 paidAmount;
        bool isActive;
    }

    IERC20 public smeshToken;
    ISpotlightBurnable public burnableToken;
    ISpotlightRegistry public registry;

    address public platformTreasury;
    address public foundation;

    uint256 public constant MIN_REPUTATION = 400; // 4.00
    uint256 public constant MIN_COMPLETIONS = 50;

    // Tier costs per hour in SMESH (with 18 decimals)
    uint256 public constant BRONZE_COST_PER_HOUR = 100 * 10 ** 18;
    uint256 public constant SILVER_COST_PER_HOUR = 500 * 10 ** 18;
    uint256 public constant GOLD_COST_PER_HOUR = 2000 * 10 ** 18;

    uint256 public nextSpotlightId;
    mapping(uint256 => SpotlightEntry) public spotlights;
    mapping(uint256 => uint256) public agentSpotlightId; // agentId => spotlightId (active)
    uint256[] public activeSpotlightIds;

    event SpotlightActivated(uint256 indexed agentId, Tier tier, uint256 duration, uint256 paidAmount);
    event SpotlightExpired(uint256 indexed agentId);

    constructor(
        address _smeshToken,
        address _registry,
        address _platformTreasury,
        address _foundation
    ) Ownable(msg.sender) {
        smeshToken = IERC20(_smeshToken);
        burnableToken = ISpotlightBurnable(_smeshToken);
        registry = ISpotlightRegistry(_registry);
        platformTreasury = _platformTreasury;
        foundation = _foundation;
    }

    function activate(
        uint256 agentId,
        Tier tier,
        uint256 durationHours
    ) external returns (uint256) {
        ISpotlightRegistry.Agent memory agent = registry.getAgent(agentId);
        require(agent.owner == msg.sender, "Spotlight: not agent owner");
        require(agent.isActive && agent.isVerified, "Spotlight: agent not active/verified");
        require(agent.reputationScore >= MIN_REPUTATION, "Spotlight: reputation too low (need >= 4.0)");
        require(agent.completionCount >= MIN_COMPLETIONS, "Spotlight: not enough completions (need >= 50)");
        require(durationHours > 0 && durationHours <= 720, "Spotlight: duration 1-720 hours");

        // Check no active spotlight for this agent
        uint256 existingId = agentSpotlightId[agentId];
        if (existingId != 0) {
            require(
                !spotlights[existingId].isActive || spotlights[existingId].expiresAt <= block.timestamp,
                "Spotlight: agent already has active spotlight"
            );
        }

        uint256 costPerHour = _tierCost(tier);
        uint256 totalCost = costPerHour * durationHours;

        smeshToken.safeTransferFrom(msg.sender, address(this), totalCost);

        // Fee split: 50% burned, 30% to platform treasury, 20% to Foundation
        uint256 burnAmount = (totalCost * 50) / 100;
        uint256 treasuryAmount = (totalCost * 30) / 100;
        uint256 foundationAmount = totalCost - burnAmount - treasuryAmount;

        smeshToken.approve(address(burnableToken), burnAmount);
        burnableToken.burnFrom(address(this), burnAmount);

        smeshToken.safeTransfer(platformTreasury, treasuryAmount);
        smeshToken.safeTransfer(foundation, foundationAmount);

        uint256 spotlightId = ++nextSpotlightId;
        uint256 expiresAt = block.timestamp + (durationHours * 1 hours);

        spotlights[spotlightId] = SpotlightEntry({
            agentId: agentId,
            owner: msg.sender,
            tier: tier,
            startedAt: block.timestamp,
            expiresAt: expiresAt,
            paidAmount: totalCost,
            isActive: true
        });

        agentSpotlightId[agentId] = spotlightId;
        activeSpotlightIds.push(spotlightId);

        // Record spotlight in registry for analytics
        registry.recordSpotlight(agentId);

        emit SpotlightActivated(agentId, tier, durationHours, totalCost);
        return spotlightId;
    }

    function deactivate(uint256 agentId) external {
        uint256 spotlightId = agentSpotlightId[agentId];
        require(spotlightId != 0, "Spotlight: no spotlight for agent");
        SpotlightEntry storage entry = spotlights[spotlightId];
        require(entry.isActive, "Spotlight: already inactive");
        require(
            msg.sender == entry.owner || msg.sender == owner(),
            "Spotlight: not authorized"
        );

        entry.isActive = false;
        emit SpotlightExpired(agentId);
    }

    function getActiveSpotlights() external view returns (SpotlightEntry[] memory) {
        // Count active entries
        uint256 count = 0;
        for (uint256 i = 0; i < activeSpotlightIds.length; i++) {
            SpotlightEntry storage entry = spotlights[activeSpotlightIds[i]];
            if (entry.isActive && entry.expiresAt > block.timestamp) {
                count++;
            }
        }

        // Collect active entries
        SpotlightEntry[] memory active = new SpotlightEntry[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < activeSpotlightIds.length; i++) {
            SpotlightEntry storage entry = spotlights[activeSpotlightIds[i]];
            if (entry.isActive && entry.expiresAt > block.timestamp) {
                active[idx++] = entry;
            }
        }

        // Sort by tier descending (Gold > Silver > Bronze)
        for (uint256 i = 0; i < active.length; i++) {
            for (uint256 j = i + 1; j < active.length; j++) {
                if (uint256(active[j].tier) > uint256(active[i].tier)) {
                    SpotlightEntry memory temp = active[i];
                    active[i] = active[j];
                    active[j] = temp;
                }
            }
        }

        return active;
    }

    function _tierCost(Tier tier) internal pure returns (uint256) {
        if (tier == Tier.Gold) return GOLD_COST_PER_HOUR;
        if (tier == Tier.Silver) return SILVER_COST_PER_HOUR;
        return BRONZE_COST_PER_HOUR;
    }

    function updateTreasury(address _treasury) external onlyOwner {
        platformTreasury = _treasury;
    }

    function updateFoundation(address _foundation) external onlyOwner {
        foundation = _foundation;
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IAgentRegistry {
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

interface IBurnableToken {
    function burnFrom(address account, uint256 amount) external;
}

contract PromotionAuction is Ownable {
    using SafeERC20 for IERC20;

    struct Bid {
        uint256 agentId;
        address bidder;
        string contextTag;
        uint256 smeshAmount;
        uint256 expiresAt;
        bool isActive;
    }

    IERC20 public smeshToken;
    IBurnableToken public burnableToken;
    IAgentRegistry public registry;

    address public platformTreasury;
    address public foundation;

    uint256 public constant MIN_REPUTATION = 400;   // 4.00
    uint256 public constant MIN_COMPLETIONS = 50;
    uint256 public constant PROMOTED_SLOTS = 2;

    uint256 public nextBidId;
    mapping(uint256 => Bid) public bids;
    mapping(string => uint256[]) public contextBids; // contextTag => bidId[]

    event BidPlaced(uint256 indexed bidId, uint256 indexed agentId, string contextTag, uint256 amount, uint256 expiresAt);
    event BidExpired(uint256 indexed bidId);

    constructor(
        address _smeshToken,
        address _registry,
        address _platformTreasury,
        address _foundation
    ) Ownable(msg.sender) {
        smeshToken = IERC20(_smeshToken);
        burnableToken = IBurnableToken(_smeshToken);
        registry = IAgentRegistry(_registry);
        platformTreasury = _platformTreasury;
        foundation = _foundation;
    }

    function bid(
        uint256 agentId,
        string calldata contextTag,
        uint256 smeshAmount,
        uint256 durationDays
    ) external returns (uint256) {
        IAgentRegistry.Agent memory agent = registry.getAgent(agentId);
        require(agent.owner == msg.sender, "PromotionAuction: not agent owner");
        require(agent.isActive && agent.isVerified, "PromotionAuction: agent not active/verified");
        require(agent.reputationScore >= MIN_REPUTATION, "PromotionAuction: reputation too low");
        require(agent.completionCount >= MIN_COMPLETIONS, "PromotionAuction: not enough completions");
        require(smeshAmount > 0, "PromotionAuction: bid must be > 0");
        require(durationDays > 0 && durationDays <= 30, "PromotionAuction: duration 1-30 days");

        smeshToken.safeTransferFrom(msg.sender, address(this), smeshAmount);

        // Distribute: 50% burn, 30% treasury, 20% foundation
        uint256 burnAmount = (smeshAmount * 50) / 100;
        uint256 treasuryAmount = (smeshAmount * 30) / 100;
        uint256 foundationAmount = smeshAmount - burnAmount - treasuryAmount;

        // Approve and burn
        smeshToken.approve(address(burnableToken), burnAmount);
        burnableToken.burnFrom(address(this), burnAmount);

        smeshToken.safeTransfer(platformTreasury, treasuryAmount);
        smeshToken.safeTransfer(foundation, foundationAmount);

        uint256 bidId = nextBidId++;
        uint256 expiresAt = block.timestamp + (durationDays * 1 days);

        bids[bidId] = Bid({
            agentId: agentId,
            bidder: msg.sender,
            contextTag: contextTag,
            smeshAmount: smeshAmount,
            expiresAt: expiresAt,
            isActive: true
        });

        contextBids[contextTag].push(bidId);

        emit BidPlaced(bidId, agentId, contextTag, smeshAmount, expiresAt);
        return bidId;
    }

    function getPromotedSlots(string calldata contextTag) external view returns (Bid[] memory) {
        uint256[] storage bidIds = contextBids[contextTag];
        uint256 activeCount = 0;

        // Count active bids
        for (uint256 i = 0; i < bidIds.length; i++) {
            if (bids[bidIds[i]].isActive && bids[bidIds[i]].expiresAt > block.timestamp) {
                activeCount++;
            }
        }

        // Collect active bids
        Bid[] memory activeBids = new Bid[](activeCount);
        uint256 idx = 0;
        for (uint256 i = 0; i < bidIds.length; i++) {
            if (bids[bidIds[i]].isActive && bids[bidIds[i]].expiresAt > block.timestamp) {
                activeBids[idx++] = bids[bidIds[i]];
            }
        }

        // Sort by amount descending (simple bubble sort for small arrays)
        for (uint256 i = 0; i < activeBids.length; i++) {
            for (uint256 j = i + 1; j < activeBids.length; j++) {
                if (activeBids[j].smeshAmount > activeBids[i].smeshAmount) {
                    Bid memory temp = activeBids[i];
                    activeBids[i] = activeBids[j];
                    activeBids[j] = temp;
                }
            }
        }

        // Return top PROMOTED_SLOTS
        uint256 returnCount = activeBids.length < PROMOTED_SLOTS ? activeBids.length : PROMOTED_SLOTS;
        Bid[] memory topBids = new Bid[](returnCount);
        for (uint256 i = 0; i < returnCount; i++) {
            topBids[i] = activeBids[i];
        }

        return topBids;
    }

    function expireBids(string calldata contextTag) external {
        uint256[] storage bidIds = contextBids[contextTag];
        for (uint256 i = 0; i < bidIds.length; i++) {
            Bid storage b = bids[bidIds[i]];
            if (b.isActive && b.expiresAt <= block.timestamp) {
                b.isActive = false;
                emit BidExpired(bidIds[i]);
            }
        }
    }

    function updateTreasury(address _treasury) external onlyOwner {
        platformTreasury = _treasury;
    }

    function updateFoundation(address _foundation) external onlyOwner {
        foundation = _foundation;
    }
}

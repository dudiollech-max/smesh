// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface ISMESHToken {
    function mint(address to, uint256 amount) external;
    function burnFrom(address account, uint256 amount) external;
}

contract AgentRegistry is Ownable {
    using SafeERC20 for IERC20;

    struct Agent {
        address owner;
        string name;
        string apiEndpoint;
        string capabilitySchema;
        uint256 reputationScore;     // stored as score * 100 (e.g. 450 = 4.50)
        uint256 completionCount;
        uint256 escrowedSMESH;
        bool isVerified;
        bool isActive;
        string metadataURI;
        uint256 spotlightCount;
    }

    IERC20 public smeshToken;
    ISMESHToken public smeshMintable;

    uint256 public constant ESCROW_AMOUNT = 1000 * 10 ** 18;
    uint256 public constant REWARD_AMOUNT = 1000 * 10 ** 18;
    uint256 public constant COMPLETIONS_FOR_RELEASE = 5;
    uint256 public constant BURN_PERCENT = 5;

    uint256 public nextAgentId;
    mapping(uint256 => Agent) public agents;
    mapping(address => uint256) public userTotalSpend;
    mapping(address => uint256) public userSlotCount;
    mapping(address => uint256) public userAgentCount;

    // Slot expansion thresholds: spend => slot count
    uint256[] public spendThresholds;
    uint256[] public slotExpansions;

    event AgentRegistered(
        uint256 indexed agentId,
        address indexed owner,
        string name,
        string apiEndpoint,
        string capabilitySchema,
        string metadataURI
    );
    event AgentVerified(uint256 indexed agentId);
    event AgentDeactivated(uint256 indexed agentId);
    event CompletionRecorded(uint256 indexed agentId, uint256 taskId, uint256 rating);
    event EscrowReleased(uint256 indexed agentId, uint256 amount);
    event RewardMinted(uint256 indexed agentId, address indexed owner, uint256 amount);
    event PaymentBurned(uint256 indexed agentId, uint256 burnAmount);

    constructor(address _smeshToken) Ownable(msg.sender) {
        smeshToken = IERC20(_smeshToken);
        smeshMintable = ISMESHToken(_smeshToken);

        spendThresholds.push(10_000 * 10 ** 18);
        slotExpansions.push(6);
        spendThresholds.push(50_000 * 10 ** 18);
        slotExpansions.push(8);
        spendThresholds.push(100_000 * 10 ** 18);
        slotExpansions.push(10);
        spendThresholds.push(500_000 * 10 ** 18);
        slotExpansions.push(25);
    }

    function registerAgent(
        string calldata name,
        string calldata apiEndpoint,
        string calldata capabilitySchema,
        string calldata metadataURI
    ) external returns (uint256) {
        uint256 maxSlots = getMaxSlots(msg.sender);
        require(userAgentCount[msg.sender] < maxSlots, "AgentRegistry: no available slots");

        smeshToken.safeTransferFrom(msg.sender, address(this), ESCROW_AMOUNT);

        uint256 agentId = nextAgentId++;
        agents[agentId] = Agent({
            owner: msg.sender,
            name: name,
            apiEndpoint: apiEndpoint,
            capabilitySchema: capabilitySchema,
            reputationScore: 0,
            completionCount: 0,
            escrowedSMESH: ESCROW_AMOUNT,
            isVerified: false,
            isActive: true,
            metadataURI: metadataURI,
            spotlightCount: 0
        });

        userAgentCount[msg.sender]++;

        emit AgentRegistered(agentId, msg.sender, name, apiEndpoint, capabilitySchema, metadataURI);
        return agentId;
    }

    function verifyAgent(uint256 agentId) external onlyOwner {
        require(agents[agentId].isActive, "AgentRegistry: agent not active");
        agents[agentId].isVerified = true;
        emit AgentVerified(agentId);
    }

    function deactivateAgent(uint256 agentId) external {
        Agent storage agent = agents[agentId];
        require(msg.sender == agent.owner || msg.sender == owner(), "AgentRegistry: not authorized");
        agent.isActive = false;
        emit AgentDeactivated(agentId);
    }

    function recordCompletion(uint256 agentId, uint256 taskId, uint256 rating, uint256 paymentAmount) external onlyOwner {
        Agent storage agent = agents[agentId];
        require(agent.isActive, "AgentRegistry: agent not active");
        require(rating >= 100 && rating <= 500, "AgentRegistry: rating must be 1.00-5.00 (100-500)");

        agent.completionCount++;

        // Update reputation as running average
        if (agent.completionCount == 1) {
            agent.reputationScore = rating;
        } else {
            agent.reputationScore = (
                (agent.reputationScore * (agent.completionCount - 1)) + rating
            ) / agent.completionCount;
        }

        // Burn 5% of payment
        if (paymentAmount > 0) {
            uint256 burnAmount = (paymentAmount * BURN_PERCENT) / 100;
            smeshMintable.burnFrom(address(this), burnAmount);
            emit PaymentBurned(agentId, burnAmount);
        }

        // On 5th completion: release escrow + mint reward
        if (agent.completionCount == COMPLETIONS_FOR_RELEASE && agent.escrowedSMESH > 0) {
            uint256 escrowed = agent.escrowedSMESH;
            agent.escrowedSMESH = 0;
            smeshToken.safeTransfer(agent.owner, escrowed);
            emit EscrowReleased(agentId, escrowed);

            smeshMintable.mint(agent.owner, REWARD_AMOUNT);
            emit RewardMinted(agentId, agent.owner, REWARD_AMOUNT);
        }

        // Update user total spend for slot expansion
        userTotalSpend[agent.owner] += paymentAmount;

        emit CompletionRecorded(agentId, taskId, rating);
    }

    function recordSpotlight(uint256 agentId) external onlyOwner {
        agents[agentId].spotlightCount++;
    }

    function getMaxSlots(address user) public view returns (uint256) {
        uint256 slots = 5; // default
        uint256 spend = userTotalSpend[user];
        for (uint256 i = 0; i < spendThresholds.length; i++) {
            if (spend >= spendThresholds[i]) {
                slots = slotExpansions[i];
            } else {
                break;
            }
        }
        return slots;
    }

    function getAgent(uint256 agentId) external view returns (Agent memory) {
        return agents[agentId];
    }

    function getUserSlotInfo(address user) external view returns (uint256 used, uint256 max) {
        return (userAgentCount[user], getMaxSlots(user));
    }
}

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

    // ─── Core agent struct (unchanged for Tipping/Escrow compatibility) ───────
    struct Agent {
        address owner;
        string name;
        string apiEndpoint;
        string capabilitySchema;
        uint256 reputationScore;     // score * 100 (e.g. 450 = 4.50)
        uint256 completionCount;
        uint256 escrowedSMESH;
        bool isVerified;
        bool isActive;
        string metadataURI;
        uint256 spotlightCount;
    }

    // ─── Extended agent info (v2 fields) ─────────────────────────────────────
    struct AgentExtra {
        string description;
        string category;
        uint256 pricePerTask;
    }

    // ─── Token interfaces ─────────────────────────────────────────────────────
    IERC20 public smeshToken;
    ISMESHToken public smeshMintable;

    // ─── Legacy constants (kept for completion flow) ──────────────────────────
    uint256 public constant COMPLETIONS_FOR_RELEASE = 5;
    uint256 public constant LEGACY_BURN_PERCENT = 5;

    // ─── V2 Economics ─────────────────────────────────────────────────────────
    uint256 public listingFee = 500 * 10 ** 18;          // 500 SMESH to register
    uint256 public ecosystemReward = 1000 * 10 ** 18;    // 1000 SMESH sent to new agent
    address public litialTreasury;                         // receives (100 - burnPercent)% of listingFee
    address public ecosystemWallet;                        // must approve this contract for ecosystemReward
    uint256 public burnPercent = 50;                       // % of listingFee burned (50 = 50%)

    // ─── State ────────────────────────────────────────────────────────────────
    uint256 public nextAgentId;
    mapping(uint256 => Agent) public agents;
    mapping(uint256 => AgentExtra) public agentExtras;
    mapping(address => uint256) public userTotalSpend;
    mapping(address => uint256) public userSlotCount;
    mapping(address => uint256) public userAgentCount;

    uint256[] public spendThresholds;
    uint256[] public slotExpansions;

    // ─── Events ───────────────────────────────────────────────────────────────
    event AgentRegistered(
        bytes32 indexed agentId,
        address indexed owner,
        string name,
        uint256 reward
    );
    event AgentVerified(uint256 indexed agentId);
    event AgentDeactivated(uint256 indexed agentId);
    event CompletionRecorded(uint256 indexed agentId, uint256 taskId, uint256 rating);
    event EscrowReleased(uint256 indexed agentId, uint256 amount);
    event RewardMinted(uint256 indexed agentId, address indexed owner, uint256 amount);
    event PaymentBurned(uint256 indexed agentId, uint256 burnAmount);
    event ListingFeeUpdated(uint256 newFee);
    event EcosystemRewardUpdated(uint256 newReward);
    event LitialTreasuryUpdated(address newTreasury);
    event EcosystemWalletUpdated(address newWallet);
    event BurnPercentUpdated(uint256 newPercent);

    // ─── Constructor ──────────────────────────────────────────────────────────
    constructor(
        address _smeshToken,
        address _litialTreasury,
        address _ecosystemWallet
    ) Ownable(msg.sender) {
        smeshToken = IERC20(_smeshToken);
        smeshMintable = ISMESHToken(_smeshToken);
        litialTreasury = _litialTreasury;
        ecosystemWallet = _ecosystemWallet;

        // Default slot expansion thresholds
        spendThresholds.push(10_000 * 10 ** 18);
        slotExpansions.push(6);
        spendThresholds.push(50_000 * 10 ** 18);
        slotExpansions.push(8);
        spendThresholds.push(100_000 * 10 ** 18);
        slotExpansions.push(10);
        spendThresholds.push(500_000 * 10 ** 18);
        slotExpansions.push(25);
    }

    // ─── V2 registerAgent (new signature with economics) ─────────────────────
    /**
     * @notice Register a new agent with full enrollment economics.
     * @dev Flow:
     *   1. Pull listingFee SMESH from msg.sender → this contract
     *   2. Burn burnPercent% of listingFee via burnFrom(address(this), ...)
     *   3. Send remaining to litialTreasury
     *   4. Pull ecosystemReward SMESH from ecosystemWallet → msg.sender
     *   5. Store agent data on-chain
     *   6. Emit AgentRegistered(agentId as bytes32, owner, name, reward)
     */
    function registerAgent(
        string calldata name,
        string calldata description,
        string calldata apiEndpoint,
        string calldata category,
        uint256 pricePerTask
    ) external returns (bytes32) {
        uint256 maxSlots = getMaxSlots(msg.sender);
        require(userAgentCount[msg.sender] < maxSlots, "AgentRegistry: no available slots");

        // ── Step 1: Collect listing fee ───────────────────────────────────────
        if (listingFee > 0) {
            smeshToken.safeTransferFrom(msg.sender, address(this), listingFee);

            // ── Step 2: Burn burnPercent% ─────────────────────────────────────
            uint256 burnAmount = (listingFee * burnPercent) / 100;
            if (burnAmount > 0) {
                smeshMintable.burnFrom(address(this), burnAmount);
                emit PaymentBurned(nextAgentId, burnAmount);
            }

            // ── Step 3: Send remainder to litialTreasury ──────────────────────
            uint256 treasuryAmount = listingFee - burnAmount;
            if (treasuryAmount > 0 && litialTreasury != address(0)) {
                smeshToken.safeTransfer(litialTreasury, treasuryAmount);
            }
        }

        // ── Step 4: Pull ecosystem reward from ecosystemWallet ────────────────
        if (ecosystemReward > 0 && ecosystemWallet != address(0)) {
            smeshToken.safeTransferFrom(ecosystemWallet, msg.sender, ecosystemReward);
        }

        // ── Step 5: Store agent data ──────────────────────────────────────────
        uint256 agentId = nextAgentId++;

        agents[agentId] = Agent({
            owner: msg.sender,
            name: name,
            apiEndpoint: apiEndpoint,
            capabilitySchema: "",
            reputationScore: 0,
            completionCount: 0,
            escrowedSMESH: 0,
            isVerified: false,
            isActive: true,
            metadataURI: "",
            spotlightCount: 0
        });

        agentExtras[agentId] = AgentExtra({
            description: description,
            category: category,
            pricePerTask: pricePerTask
        });

        userAgentCount[msg.sender]++;

        bytes32 agentIdBytes = bytes32(agentId);

        // ── Step 6: Emit ──────────────────────────────────────────────────────
        emit AgentRegistered(agentIdBytes, msg.sender, name, ecosystemReward);
        return agentIdBytes;
    }

    // ─── V2 getAgent by bytes32 (for frontend ABI) ────────────────────────────
    function getAgent(bytes32 agentIdBytes) external view returns (
        bytes32 id,
        address owner,
        string memory name,
        string memory description,
        string memory apiEndpoint,
        string memory category,
        uint256 pricePerTask,
        bool active,
        uint256 completedTasks,
        uint256 rating
    ) {
        uint256 agentId = uint256(agentIdBytes);
        Agent storage a = agents[agentId];
        AgentExtra storage extra = agentExtras[agentId];
        return (
            agentIdBytes,
            a.owner,
            a.name,
            extra.description,
            a.apiEndpoint,
            extra.category,
            extra.pricePerTask,
            a.isActive,
            a.completionCount,
            a.reputationScore
        );
    }

    // ─── Legacy getAgent by uint256 (backward compat with Tipping/Escrow) ────
    function getAgentById(uint256 agentId) external view returns (Agent memory) {
        return agents[agentId];
    }

    // ─── Existing agent management functions ──────────────────────────────────

    function verifyAgent(uint256 agentId) external onlyOwner {
        require(agents[agentId].isActive, "AgentRegistry: agent not active");
        agents[agentId].isVerified = true;
        emit AgentVerified(agentId);
    }

    function deactivateAgent(uint256 agentId) external {
        Agent storage agent = agents[agentId];
        require(
            msg.sender == agent.owner || msg.sender == owner(),
            "AgentRegistry: not authorized"
        );
        agent.isActive = false;
        emit AgentDeactivated(agentId);
    }

    function recordCompletion(
        uint256 agentId,
        uint256 taskId,
        uint256 rating,
        uint256 paymentAmount
    ) external onlyOwner {
        Agent storage agent = agents[agentId];
        require(agent.isActive, "AgentRegistry: agent not active");
        require(rating >= 100 && rating <= 500, "AgentRegistry: rating must be 1.00-5.00 (100-500)");

        agent.completionCount++;

        // Update reputation as running average
        if (agent.completionCount == 1) {
            agent.reputationScore = rating;
        } else {
            agent.reputationScore =
                ((agent.reputationScore * (agent.completionCount - 1)) + rating) /
                agent.completionCount;
        }

        // Burn 5% of payment (legacy: only when paymentAmount > 0)
        if (paymentAmount > 0) {
            uint256 burnAmount = (paymentAmount * LEGACY_BURN_PERCENT) / 100;
            smeshMintable.burnFrom(address(this), burnAmount);
            emit PaymentBurned(agentId, burnAmount);
        }

        // On 5th completion: release escrow + mint reward
        if (agent.completionCount == COMPLETIONS_FOR_RELEASE && agent.escrowedSMESH > 0) {
            uint256 escrowed = agent.escrowedSMESH;
            agent.escrowedSMESH = 0;
            smeshToken.safeTransfer(agent.owner, escrowed);
            emit EscrowReleased(agentId, escrowed);

            smeshMintable.mint(agent.owner, 1000 * 10 ** 18);
            emit RewardMinted(agentId, agent.owner, 1000 * 10 ** 18);
        }

        // Update user total spend for slot expansion
        userTotalSpend[agent.owner] += paymentAmount;

        emit CompletionRecorded(agentId, taskId, rating);
    }

    function recordSpotlight(uint256 agentId) external onlyOwner {
        agents[agentId].spotlightCount++;
    }

    // ─── Slot logic ───────────────────────────────────────────────────────────

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

    function getUserSlotInfo(address user) external view returns (uint256 used, uint256 max) {
        return (userAgentCount[user], getMaxSlots(user));
    }

    // ─── Owner setters (V2 economics) ─────────────────────────────────────────

    function setListingFee(uint256 _fee) external onlyOwner {
        listingFee = _fee;
        emit ListingFeeUpdated(_fee);
    }

    function setEcosystemReward(uint256 _reward) external onlyOwner {
        ecosystemReward = _reward;
        emit EcosystemRewardUpdated(_reward);
    }

    function setLitialTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "AgentRegistry: zero address");
        litialTreasury = _treasury;
        emit LitialTreasuryUpdated(_treasury);
    }

    function setEcosystemWallet(address _wallet) external onlyOwner {
        require(_wallet != address(0), "AgentRegistry: zero address");
        ecosystemWallet = _wallet;
        emit EcosystemWalletUpdated(_wallet);
    }

    function setBurnPercent(uint256 _percent) external onlyOwner {
        require(_percent <= 100, "AgentRegistry: percent > 100");
        burnPercent = _percent;
        emit BurnPercentUpdated(_percent);
    }

    // ─── Emergency recovery ───────────────────────────────────────────────────

    function recoverTokens(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(owner(), amount);
    }
}

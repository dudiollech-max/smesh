// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IEscrowBurnable {
    function burnFrom(address account, uint256 amount) external;
}

interface IEscrowRegistry {
    function recordCompletion(uint256 agentId, uint256 taskId, uint256 rating, uint256 paymentAmount) external;
}

contract Escrow is Ownable {
    using SafeERC20 for IERC20;

    enum EscrowStatus { HELD, RELEASED, REFUNDED }

    struct EscrowRecord {
        uint256 taskId;
        address payer;
        address agentOwner;
        uint256 agentId;
        uint256 amount;
        EscrowStatus status;
    }

    IERC20 public smeshToken;
    IEscrowBurnable public burnableToken;
    IEscrowRegistry public registry;

    uint256 public constant BURN_PERCENT = 5;

    mapping(uint256 => EscrowRecord) public escrows; // taskId => EscrowRecord
    mapping(uint256 => bool) public escrowExists;

    event EscrowHeld(uint256 indexed taskId, address indexed payer, address indexed agentOwner, uint256 amount);
    event EscrowReleased(uint256 indexed taskId, address indexed agentOwner, uint256 netAmount, uint256 burnAmount);
    event EscrowRefunded(uint256 indexed taskId, address indexed payer, uint256 amount);

    constructor(address _smeshToken, address _registry) Ownable(msg.sender) {
        smeshToken = IERC20(_smeshToken);
        burnableToken = IEscrowBurnable(_smeshToken);
        registry = IEscrowRegistry(_registry);
    }

    function hold(
        uint256 taskId,
        address payer,
        address agentOwner,
        uint256 agentId,
        uint256 amount
    ) external onlyOwner {
        require(!escrowExists[taskId], "Escrow: already exists for task");
        require(amount > 0, "Escrow: amount must be > 0");

        smeshToken.safeTransferFrom(payer, address(this), amount);

        escrows[taskId] = EscrowRecord({
            taskId: taskId,
            payer: payer,
            agentOwner: agentOwner,
            agentId: agentId,
            amount: amount,
            status: EscrowStatus.HELD
        });
        escrowExists[taskId] = true;

        emit EscrowHeld(taskId, payer, agentOwner, amount);
    }

    function release(uint256 taskId, uint256 rating) external onlyOwner {
        require(escrowExists[taskId], "Escrow: no escrow for task");
        EscrowRecord storage record = escrows[taskId];
        require(record.status == EscrowStatus.HELD, "Escrow: not in held state");

        record.status = EscrowStatus.RELEASED;

        uint256 burnAmount = (record.amount * BURN_PERCENT) / 100;
        uint256 netAmount = record.amount - burnAmount;

        // Burn 5%
        smeshToken.approve(address(burnableToken), burnAmount);
        burnableToken.burnFrom(address(this), burnAmount);

        // Send remainder to agent owner
        smeshToken.safeTransfer(record.agentOwner, netAmount);

        // Record completion in registry
        registry.recordCompletion(record.agentId, taskId, rating, record.amount);

        emit EscrowReleased(taskId, record.agentOwner, netAmount, burnAmount);
    }

    function refund(uint256 taskId) external onlyOwner {
        require(escrowExists[taskId], "Escrow: no escrow for task");
        EscrowRecord storage record = escrows[taskId];
        require(record.status == EscrowStatus.HELD, "Escrow: not in held state");

        record.status = EscrowStatus.REFUNDED;
        smeshToken.safeTransfer(record.payer, record.amount);

        emit EscrowRefunded(taskId, record.payer, record.amount);
    }

    function getEscrow(uint256 taskId) external view returns (EscrowRecord memory) {
        require(escrowExists[taskId], "Escrow: no escrow for task");
        return escrows[taskId];
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TokenVesting
 * @notice Cliff + linear vesting for SMESH team/advisor allocations.
 *
 *         - Owner is the Foundation multisig (Ownable).
 *         - Each beneficiary can have one or more independent vesting schedules.
 *         - Schedules are revocable by the owner. On revocation:
 *             • Unvested tokens are returned to the owner immediately.
 *             • Tokens already vested but not yet released remain claimable by the beneficiary.
 *
 *         Standard team parameters: 4-year total, 1-year cliff.
 *         Ecosystem/Foundation wallets are NOT managed here — they use multisig governance.
 */
contract TokenVesting is Ownable {
    using SafeERC20 for IERC20;

    // ─── Data structures ─────────────────────────────────────────────────────

    struct VestingSchedule {
        address beneficiary;
        uint256 start;                  // Unix timestamp when vesting begins
        uint256 cliffDuration;          // Seconds before any tokens vest
        uint256 duration;               // Total vesting duration in seconds
        uint256 totalAmount;            // Total tokens committed to this schedule
        uint256 releasedAmount;         // Tokens already claimed by beneficiary
        bool    revoked;                // Whether owner has revoked this schedule
        uint256 vestedAtRevocation;     // Snapshot of vested amount when revoked (0 if not revoked)
    }

    // ─── State ───────────────────────────────────────────────────────────────

    IERC20 public immutable token;

    mapping(bytes32 => VestingSchedule) private _schedules;
    mapping(address => bytes32[])        private _beneficiarySchedules;

    uint256 private _scheduleCount;

    // ─── Events ──────────────────────────────────────────────────────────────

    event VestingCreated(
        bytes32 indexed scheduleId,
        address indexed beneficiary,
        uint256 start,
        uint256 cliffDuration,
        uint256 duration,
        uint256 amount
    );

    event TokensReleased(
        bytes32 indexed scheduleId,
        address indexed beneficiary,
        uint256 amount
    );

    event VestingRevoked(
        bytes32 indexed scheduleId,
        address indexed beneficiary,
        uint256 vestedAtRevocation,
        uint256 refundedToOwner
    );

    // ─── Constructor ─────────────────────────────────────────────────────────

    /**
     * @param _token  Address of the SMESH ERC-20 token
     * @param _owner  Foundation multisig address (takes ownership immediately)
     */
    constructor(address _token, address _owner) Ownable(_owner) {
        require(_token != address(0), "TokenVesting: zero token address");
        token = IERC20(_token);
    }

    // ─── Admin — schedule creation ────────────────────────────────────────────

    /**
     * @notice Create a configurable vesting schedule.
     *         The contract must hold at least `amount` tokens when this is called.
     * @param beneficiary    Recipient of vested tokens
     * @param start          Timestamp at which vesting begins (use block.timestamp for "now")
     * @param cliffDuration  Seconds before any token unlocks (e.g. 365 days)
     * @param duration       Total vest duration in seconds (e.g. 4 * 365 days)
     * @param amount         Total SMESH to vest for this beneficiary (in wei)
     */
    function createVestingSchedule(
        address beneficiary,
        uint256 start,
        uint256 cliffDuration,
        uint256 duration,
        uint256 amount
    ) external onlyOwner returns (bytes32) {
        return _createVestingSchedule(beneficiary, start, cliffDuration, duration, amount);
    }

    /**
     * @notice Shorthand for the standard team allocation: 4-year vest, 1-year cliff.
     * @param beneficiary  Team member or advisor wallet
     * @param amount       Total SMESH allocation for this person (in wei)
     */
    function createTeamVestingSchedule(
        address beneficiary,
        uint256 amount
    ) external onlyOwner returns (bytes32) {
        return _createVestingSchedule(
            beneficiary,
            block.timestamp,
            365 days,       // 1-year cliff
            4 * 365 days,   // 4-year total
            amount
        );
    }

    // ─── Admin — revocation ───────────────────────────────────────────────────

    /**
     * @notice Revoke a vesting schedule.
     *         - Unvested tokens are transferred immediately back to the owner.
     *         - Already-vested-but-unreleased tokens remain in the contract for the beneficiary.
     * @param scheduleId  ID returned when the schedule was created
     */
    function revoke(bytes32 scheduleId) external onlyOwner {
        VestingSchedule storage s = _schedules[scheduleId];
        require(s.beneficiary != address(0), "TokenVesting: schedule not found");
        require(!s.revoked,                  "TokenVesting: already revoked");

        uint256 vestedNow    = _computeVested(s, block.timestamp);
        uint256 refundAmount = s.totalAmount - vestedNow;

        s.revoked              = true;
        s.vestedAtRevocation   = vestedNow;

        if (refundAmount > 0) {
            token.safeTransfer(owner(), refundAmount);
        }

        emit VestingRevoked(scheduleId, s.beneficiary, vestedNow, refundAmount);
    }

    // ─── Beneficiary — claim ──────────────────────────────────────────────────

    /**
     * @notice Release all currently-releasable tokens for a specific schedule.
     *         Either the beneficiary or the owner may call this.
     */
    function release(bytes32 scheduleId) external {
        VestingSchedule storage s = _schedules[scheduleId];
        require(s.beneficiary != address(0),                          "TokenVesting: schedule not found");
        require(msg.sender == s.beneficiary || msg.sender == owner(), "TokenVesting: not authorized");

        uint256 releasable = _computeReleasable(s);
        require(releasable > 0, "TokenVesting: nothing to release");

        s.releasedAmount += releasable;
        token.safeTransfer(s.beneficiary, releasable);

        emit TokensReleased(scheduleId, s.beneficiary, releasable);
    }

    /**
     * @notice Claim all releasable tokens across every schedule belonging to msg.sender.
     */
    function releaseAll() external {
        bytes32[] memory ids = _beneficiarySchedules[msg.sender];
        uint256 len = ids.length;
        for (uint256 i = 0; i < len; i++) {
            VestingSchedule storage s = _schedules[ids[i]];
            uint256 releasable = _computeReleasable(s);
            if (releasable == 0) continue;
            s.releasedAmount += releasable;
            token.safeTransfer(s.beneficiary, releasable);
            emit TokensReleased(ids[i], s.beneficiary, releasable);
        }
    }

    // ─── Views ────────────────────────────────────────────────────────────────

    function getSchedule(bytes32 scheduleId) external view returns (VestingSchedule memory) {
        return _schedules[scheduleId];
    }

    function getScheduleIds(address beneficiary) external view returns (bytes32[] memory) {
        return _beneficiarySchedules[beneficiary];
    }

    /// @notice Returns tokens currently available for release for a given schedule.
    function releasableAmount(bytes32 scheduleId) external view returns (uint256) {
        return _computeReleasable(_schedules[scheduleId]);
    }

    /// @notice Returns total tokens vested so far (including already released) for a schedule.
    function vestedAmount(bytes32 scheduleId) external view returns (uint256) {
        VestingSchedule storage s = _schedules[scheduleId];
        return s.revoked ? s.vestedAtRevocation : _computeVested(s, block.timestamp);
    }

    /// @notice Total number of schedules ever created.
    function scheduleCount() external view returns (uint256) {
        return _scheduleCount;
    }

    // ─── Internal ─────────────────────────────────────────────────────────────

    function _createVestingSchedule(
        address beneficiary,
        uint256 start,
        uint256 cliffDuration,
        uint256 duration,
        uint256 amount
    ) internal returns (bytes32 scheduleId) {
        require(beneficiary != address(0),    "TokenVesting: zero beneficiary");
        require(duration > 0,                 "TokenVesting: zero duration");
        require(amount > 0,                   "TokenVesting: zero amount");
        require(cliffDuration <= duration,    "TokenVesting: cliff exceeds duration");
        require(
            token.balanceOf(address(this)) >= amount,
            "TokenVesting: insufficient contract balance"
        );

        scheduleId = _computeScheduleId(beneficiary, _scheduleCount);
        _scheduleCount++;

        _schedules[scheduleId] = VestingSchedule({
            beneficiary:         beneficiary,
            start:               start,
            cliffDuration:       cliffDuration,
            duration:            duration,
            totalAmount:         amount,
            releasedAmount:      0,
            revoked:             false,
            vestedAtRevocation:  0
        });

        _beneficiarySchedules[beneficiary].push(scheduleId);

        emit VestingCreated(scheduleId, beneficiary, start, cliffDuration, duration, amount);
    }

    /**
     * @dev Amount available to claim: vested − already released.
     *      If revoked, vested is capped at the snapshot taken at revocation time.
     */
    function _computeReleasable(VestingSchedule storage s) internal view returns (uint256) {
        uint256 vested = s.revoked
            ? s.vestedAtRevocation
            : _computeVested(s, block.timestamp);

        if (vested <= s.releasedAmount) return 0;
        return vested - s.releasedAmount;
    }

    /**
     * @dev Standard cliff + linear vesting.
     *      - Before cliff: 0
     *      - After full duration: totalAmount
     *      - In between: linear proportion of time elapsed / total duration
     */
    function _computeVested(
        VestingSchedule storage s,
        uint256 timestamp
    ) internal view returns (uint256) {
        if (timestamp < s.start + s.cliffDuration) {
            return 0;
        }
        if (timestamp >= s.start + s.duration) {
            return s.totalAmount;
        }
        uint256 elapsed = timestamp - s.start;
        return (s.totalAmount * elapsed) / s.duration;
    }

    function _computeScheduleId(address beneficiary, uint256 index) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(beneficiary, index));
    }
}

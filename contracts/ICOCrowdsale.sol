pragma solidity ^0.4.18;

import "./ICOToken.sol";
import "../node_modules/zeppelin-solidity/contracts/crowdsale/FinalizableCrowdsale.sol";
import '../node_modules/zeppelin-solidity/contracts/ownership/Ownable.sol';
import '../node_modules/zeppelin-solidity/contracts/lifecycle/Pausable.sol';

/**
 * @title ICOCrowdsale
 * @dev This is an template of a fully fledged crowdsale.
 * The way to add new features to a base crowdsale is by multiple inheritance.
 * In this example we are providing following extensions:
 * FinalizableCrowdsale - Allows you to implement logic for when the ICO finishes
 * PeriodicCrowdsale - Alows for bonus periods with different rates to be defined
 *
 * After adding multiple features it's good practice to run integration tests
 * to ensure that subcontracts works together as intended.
 */
contract ICOCrowdsale is Ownable, Pausable, FinalizableCrowdsale {

  uint256 constant PRESALE_CAP = 850 ether;
  uint256 constant PRESALE_RATE = 6750;
  uint256 constant PRESALE_DURATION = 14 days;

  uint256 constant BONUS_1_CAP = PRESALE_CAP + 1700 ether;
  uint256 constant BONUS_1_RATE = 6250;

  uint256 constant BONUS_2_CAP = BONUS_1_CAP + 3400 ether;
  uint256 constant BONUS_2_RATE = 5750;

  uint256 constant BONUS_3_CAP = BONUS_2_CAP + 4250 ether;
  uint256 constant BONUS_3_RATE = 5500;

  uint256 constant BONUS_4_CAP = BONUS_3_CAP + 5100 ether;
  uint256 constant BONUS_4_RATE = 5250;

  uint256 constant NORMAL_RATE = 5000;

  event LogBountyTokenMinted(address minter, address beneficiary, uint256 amount);

  function ICOCrowdsale(uint256 _startTime, uint256 _endTime, address _wallet) public
    FinalizableCrowdsale()
    Crowdsale(_startTime, _endTime, NORMAL_RATE, _wallet)
  {
    require((_endTime-_startTime) > (15 * 1 days));
  }

  /**
   * Invoked on initialization of the contract
   */
  function createTokenContract() internal returns (MintableToken) {
    ICOToken _token = new ICOToken();
    // Uncomment this if you (dont) want for the token to be paused upon creation
    _token.pause();
    return _token;
  }

  function finalization() internal {
    super.finalization();

    // Un/Comment this if you have/have not paused the token contract
    ICOToken _token = ICOToken(token);
    _token.unpause();
    _token.transferOwnership(owner);
  }

  function buyTokens(address beneficiary) public payable {
    uint256 minContributionAmount = 100 finney; // 0.1 ETH
    require(msg.value >= minContributionAmount);
    super.buyTokens(beneficiary);
  }

  function getRate() internal constant returns(uint256) {
    // Pre-sale Period
    if (now < (startTime + PRESALE_DURATION)) {
      require(weiRaised <= PRESALE_CAP);
      return PRESALE_RATE;
    }

    // First Bonus Period
    if (weiRaised <= BONUS_1_CAP) {
        return BONUS_1_RATE;
    }

    // Second Bonus Period
    if (weiRaised <= BONUS_2_CAP) {
        return BONUS_2_RATE;
    }

    // Third Bonus Period
    if (weiRaised <= BONUS_3_CAP) {
        return BONUS_3_RATE;
    }

    // Fourth Bonus Period
    if (weiRaised <= BONUS_4_CAP) {
        return BONUS_4_RATE;
    }

    // Default Period
    return rate;
  }

  function getTokenAmount(uint256 weiAmount) internal constant returns(uint256) {
    uint256 _rate = getRate();
    return weiAmount.mul(_rate);
  }

  function createBountyToken(address beneficiary, uint256 amount) public onlyOwner returns(bool) {
    require(!hasEnded());
    token.mint(beneficiary, amount);
    LogBountyTokenMinted(msg.sender, beneficiary, amount);
    return true;
  }

}
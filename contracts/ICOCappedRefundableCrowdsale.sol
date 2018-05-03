pragma solidity ^0.4.23;

import "./ICOCrowdsale.sol";
import "../node_modules/zeppelin-solidity/contracts/crowdsale/RefundableCrowdsale.sol";
import "../node_modules/zeppelin-solidity/contracts/crowdsale/CappedCrowdsale.sol";

/**
 * @title ICOCappedRefundableCrowdsale
 * @dev This is an template of a fully fledged crowdsale with cap and refunds.
 * In this example we are providing following extensions:
 * RefundableCrowdsale - Storing funds in a vault until finalization
 * CappedCrowdsale - Allows for cap of the ICO
 *
 * After adding multiple features it's good practice to run integration tests
 * to ensure that subcontracts works together as intended.
 */
contract ICOCappedRefundableCrowdsale is CappedCrowdsale, ICOCrowdsale, RefundableCrowdsale {


  constructor(uint256 _startTime, uint256 _endTime, uint256 _cap, uint256 _goal, address _wallet) public 
  	FinalizableCrowdsale()
    ICOCrowdsale(_startTime, _endTime, _wallet)
	CappedCrowdsale(_cap)
    RefundableCrowdsale(_goal) 
	{
		require(_goal <= _cap);
	}

}
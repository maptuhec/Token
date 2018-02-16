pragma solidity ^0.4.18;
import '../node_modules/zeppelin-solidity/contracts/ownership/Ownable.sol';
import '../node_modules/zeppelin-solidity/contracts/token/ERC20/ERC20.sol';
import './VestibleToken.sol';

contract Vesting is Ownable {
	address public tokenAddress;
	uint256 public startDate;
	uint256 public tokenBalance;

	//First half of the year is 182 and the second is 183
	uint256 public firstMonth = 10 days;
	uint256 public secondMonth = 11 days;
	uint256 public firstPeriod = firstMonth;
	uint256 public secondPeriod = firstMonth + secondMonth;
	uint256 public thirdPeriod = secondPeriod + firstMonth;
	uint256 public fourthPeriod = thirdPeriod + secondMonth;
	uint256 public fifthPeriod = fourthPeriod + firstMonth;

	event LogTransferSuccessful(address recepient, uint amount);

	function Vesting(address _tokenAddress, uint256 _startDate ) public {
		require(_tokenAddress > address(0));
		require(_startDate > 0);
		tokenAddress = _tokenAddress;
		startDate = _startDate;
	}

	function claim() public payable onlyOwner {
		ERC20 token = ERC20(tokenAddress);
		require(token.balanceOf(this) > 0);
		require(now > startDate);

		if (tokenBalance == 0) {
			tokenBalance = token.balanceOf(this);
			uint256 owedFirstPeriodTokens = (tokenBalance * 20) / 100;
			uint256 owedSecondPeriodTokens = (tokenBalance * 40) / 100;
			uint256 owedThirdPeriodTokens = (tokenBalance * 60) / 100;
			uint256 owedFourthPeriodTokens = (tokenBalance * 80) / 100;
			uint256	owedFifthPeriodTokens = (tokenBalance * 100) / 100;
			uint256 claimedTokens = 0;
		}
		if (now < startDate + firstPeriod) {
			require(owedFirstPeriodTokens > claimedTokens);
			token.transfer(owner, (owedFirstPeriodTokens - claimedTokens));
			LogTransferSuccessful(owner, (owedFirstPeriodTokens - claimedTokens));
			claimedTokens = owedFirstPeriodTokens;
			return;
		}

		if (now < startDate + secondPeriod && now > startDate + firstPeriod ) {
			require(owedSecondPeriodTokens > claimedTokens);
			token.transfer(owner, owedSecondPeriodTokens - claimedTokens);
			LogTransferSuccessful(owner, owedSecondPeriodTokens - claimedTokens);
			claimedTokens = owedSecondPeriodTokens;
			return;
		}

		if (now < startDate + thirdPeriod && now > startDate + secondPeriod) {
			require(owedThirdPeriodTokens > claimedTokens);
			token.transfer(owner, owedThirdPeriodTokens - claimedTokens);
			LogTransferSuccessful(owner, owedThirdPeriodTokens - claimedTokens);
			claimedTokens = owedThirdPeriodTokens;
			return;
		}

		if (now < startDate + fourthPeriod && now > startDate + thirdPeriod) {
			require(owedFourthPeriodTokens > claimedTokens);
			token.transfer(owner, owedFourthPeriodTokens - claimedTokens);
			LogTransferSuccessful(owner, owedFourthPeriodTokens - claimedTokens);
			claimedTokens = owedFourthPeriodTokens;
			return;
		}

		if (now < startDate + fifthPeriod && now > startDate + fourthPeriod) {
			require(owedFifthPeriodTokens > claimedTokens);
			token.transfer(owner, owedFifthPeriodTokens - claimedTokens);
			LogTransferSuccessful(owner, owedFifthPeriodTokens - claimedTokens);
			claimedTokens = owedFifthPeriodTokens;
			return;
		} 
		if (now > startDate + fifthPeriod) {
			tokenBalance = token.balanceOf(this);
			token.transfer(owner, tokenBalance);
			LogTransferSuccessful(owner, tokenBalance);
			claimedTokens = tokenBalance;
			return;
		}
	}
}
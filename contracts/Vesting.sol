pragma solidity ^0.4.23;
import '../node_modules/zeppelin-solidity/contracts/ownership/Ownable.sol';
import '../node_modules/zeppelin-solidity/contracts/token/ERC20/ERC20.sol';

contract Vesting is Ownable {
	address public tokenAddress;
	uint256 public startDate;
	uint256 public tokenBalance;

	//First half of the year is 182 and the second is 183
	uint256 public firstHalf = 182 days;
	uint256 public secondHalf = 183 days;
	uint256 public firstPeriod = firstHalf;
	uint256 public secondPeriod = firstHalf + secondHalf;
	uint256 public thirdPeriod = secondPeriod + firstHalf;
	uint256 public fourthPeriod = thirdPeriod + secondHalf + 1 days; //2020 is leap year and we add one more day
	uint256 public fifthPeriod = fourthPeriod + firstHalf;

	event LogTransferSuccessful(address recepient, uint amount);

	constructor(address _tokenAddress, uint256 _startDate ) public {
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
			emit LogTransferSuccessful(owner, (owedFirstPeriodTokens - claimedTokens));
			claimedTokens = owedFirstPeriodTokens;
			return;
		}

		if (now < startDate + secondPeriod && now > startDate + firstPeriod ) {
			require(owedSecondPeriodTokens > claimedTokens);
			token.transfer(owner, owedSecondPeriodTokens - claimedTokens);
			emit LogTransferSuccessful(owner, owedSecondPeriodTokens - claimedTokens);
			claimedTokens = owedSecondPeriodTokens;
			return;
		}

		if (now < startDate + thirdPeriod && now > startDate + secondPeriod) {
			require(owedThirdPeriodTokens > claimedTokens);
			token.transfer(owner, owedThirdPeriodTokens - claimedTokens);
			emit LogTransferSuccessful(owner, owedThirdPeriodTokens - claimedTokens);
			claimedTokens = owedThirdPeriodTokens;
			return;
		}

		if (now < startDate + fourthPeriod && now > startDate + thirdPeriod) {
			require(owedFourthPeriodTokens > claimedTokens);
			token.transfer(owner, owedFourthPeriodTokens - claimedTokens);
			emit LogTransferSuccessful(owner, owedFourthPeriodTokens - claimedTokens);
			claimedTokens = owedFourthPeriodTokens;
			return;
		}

		if (now < startDate + fifthPeriod && now > startDate + fourthPeriod) {
			require(owedFifthPeriodTokens > claimedTokens);
			token.transfer(owner, owedFifthPeriodTokens - claimedTokens);
			emit LogTransferSuccessful(owner, owedFifthPeriodTokens - claimedTokens);
			claimedTokens = owedFifthPeriodTokens;
			return;
		} 
		if (now > startDate + fifthPeriod) {
			tokenBalance = token.balanceOf(this);
			token.transfer(owner, tokenBalance);
			emit LogTransferSuccessful(owner, tokenBalance);
			claimedTokens = tokenBalance;
			return;
		}
	}
}
const ICOCrowdsale = artifacts.require("./ICOCrowdsale.sol");
const ICOToken = artifacts.require("./ICOToken.sol");
const expectThrow = require('../util').expectThrow;
const timeTravel = require('../util').timeTravel;
const web3FutureTime = require('../util').web3FutureTime;
const BigNumber = require('bignumber.js');

contract('ICOCrowdsale', function (accounts) {

	let crowdsaleInstance;
	let _startTime;
	let _endTime;

	const weiInEther = 1000000000000000000;

	const _owner = accounts[0];
	const _alice = accounts[1];
	const _bob = accounts[2];
	const _carol = accounts[3];
	const _notOwner = accounts[8];
	const _wallet = accounts[9];

	const day = 24 * 60 * 60;
	const sevenDays = 7 * day;
	const sixWeeks = 6 * sevenDays;
	const thirtyDays = 30 * day;
	const fourteenDays = 14 * day;
	const fifteenDays = 15 * day;


	const minWeiAmount = 0.1 * weiInEther;

	const _defaultRate = 5000;

	const _preSalePeriod = {
		BONUS_RATE: 6750,
		CAP: 850
	}

	const _firstPeriod = {
		BONUS_RATE: 6250,
		CAP: _preSalePeriod.CAP + 1700
	}

	const _secondPeriod = {
		BONUS_RATE: 5750,
		CAP: _firstPeriod.CAP + 3400
	}

	const _thirdPeriod = {
		BONUS_RATE: 5500,
		CAP: _secondPeriod.CAP + 4250
	}

	const _fourthPeriod = {
		BONUS_RATE: 5250,
		CAP: _thirdPeriod.CAP + 5100
	}

	describe("initializing crowsale", () => {

		it("should set initial values correctly", async function () {
			await timeTravel(web3, day);
			_startTime = web3FutureTime(web3);
			_endTime = _startTime + sixWeeks;

			crowdsaleInstance = await ICOCrowdsale.new(_startTime, _endTime, _wallet, {
				from: _owner
			});

			let startTime = await crowdsaleInstance.startTime.call();
			let endTime = await crowdsaleInstance.endTime.call();
			let wallet = await crowdsaleInstance.wallet.call();
			let rate = await crowdsaleInstance.rate.call();

			assert(startTime.eq(_startTime), "The start time is incorrect");
			assert(endTime.eq(_endTime), "The end time is incorrect");
			assert(rate.eq(_defaultRate), "The rate is incorrect");
			assert.strictEqual(wallet, _wallet, "The start time is incorrect");

			let token = await crowdsaleInstance.token.call();
			assert(token.length > 0, "Token length is 0");
			assert(token != "0x0");
		})

		it("throw if the end time is less than 15 days", async function () {
			_startTime = web3FutureTime(web3);
			_endTime = _startTime + sevenDays;

			await expectThrow(ICOCrowdsale.new(_startTime, _endTime, _wallet, {
				from: _owner
			}));
		})


	});

	describe("testing token creation", () => {
		let tokenInstance;
		const _symbol = "ARX";

		beforeEach(async function () {

			_startTime = web3FutureTime(web3);
			_endTime = _startTime + sixWeeks;

			crowdsaleInstance = await ICOCrowdsale.new(_startTime, _endTime, _wallet, {
				from: _owner
			});

			let tokenAddress = await crowdsaleInstance.token.call();

			tokenInstance = ICOToken.at(tokenAddress);
		})

		it("should create the correct token", async function () {
			let tokenSymbol = await tokenInstance.symbol.call();
			assert.equal(tokenSymbol, _symbol, "It has not created token with the correct symbol");
		})

		it("should create the token paused", async function () {
			let paused = await tokenInstance.paused.call();
			assert.isTrue(paused, "The token was not created paused");
		})

		it("should create the token owned by the crowdsale", async function () {
			let owner = await tokenInstance.owner.call();
			assert.equal(owner, crowdsaleInstance.address, "The token was with the crowdsale as owner");
		})


	})

	describe("testing crowdsale periods", () => {
		let tokenInstance;

		beforeEach(async function () {
			await timeTravel(web3, day);
			_startTime = web3FutureTime(web3);
			_endTime = _startTime + sixWeeks;

			crowdsaleInstance = await ICOCrowdsale.new(_startTime, _endTime, _wallet, {
				from: _owner
			});

			let tokenAddress = await crowdsaleInstance.token.call();

			tokenInstance = ICOToken.at(tokenAddress);

		})

		it("should throw on wei below min amount", async function () {
			const weiSent = minWeiAmount / 2;
			await expectThrow(crowdsaleInstance.buyTokens(_wallet, {
				value: weiSent,
				from: _wallet
			}))

		})

		it("should convert to presale bonus rate", async function () {
			await timeTravel(web3, day);

			const weiSent = 1 * weiInEther;
			await crowdsaleInstance.buyTokens(_wallet, {
				value: weiSent,
				from: _wallet
			})

			let expected = new BigNumber(_preSalePeriod.BONUS_RATE)
			expected = expected.mul(weiSent);

			let balance = await tokenInstance.balanceOf.call(_wallet);

			assert(balance.eq(expected), "The balance was not correct based on the presale period bonus rate and weiSent");
		})

		it("should throw after pre-sale cap is reached during the presale period", async function () {
			await timeTravel(web3, day);

			let capWei = new BigNumber(_preSalePeriod.CAP);
			capWei = capWei.mul(weiInEther);
			capWei = capWei.plus(1);

			await crowdsaleInstance.buyTokens(_wallet, {
				value: capWei.toString(),
				from: _wallet
			})

			const weiSent = 1 * weiInEther;
			await expectThrow(crowdsaleInstance.buyTokens(_alice, {
				value: weiSent,
				from: _alice
			}))
		})


		it("should convert to first period bonus rate", async function () {
			await timeTravel(web3, fifteenDays);

			let capWei = new BigNumber(_preSalePeriod.CAP + 10);
			capWei = capWei.mul(weiInEther);

			await crowdsaleInstance.buyTokens(_wallet, {
				value: capWei.toString(),
				from: _wallet
			})

			const weiSent = 1 * weiInEther;
			await crowdsaleInstance.buyTokens(_alice, {
				value: weiSent,
				from: _alice
			})

			let expected = new BigNumber(_firstPeriod.BONUS_RATE)
			expected = expected.mul(weiSent);

			let balance = await tokenInstance.balanceOf.call(_alice);

			assert(balance.eq(expected), "The balance was not correct based on the first period bonus rate and weiSent");
		})

		it("should convert to second period bonus rate", async function () {
			await timeTravel(web3, fifteenDays);

			let capWei = new BigNumber(_firstPeriod.CAP + 10);
			capWei = capWei.mul(weiInEther);

			await crowdsaleInstance.buyTokens(_wallet, {
				value: capWei.toString(),
				from: _wallet
			})

			const weiSent = 1 * weiInEther;
			await crowdsaleInstance.buyTokens(_alice, {
				value: weiSent,
				from: _alice
			})

			let expected = new BigNumber(_secondPeriod.BONUS_RATE)
			expected = expected.mul(weiSent);

			let balance = await tokenInstance.balanceOf.call(_alice);

			assert(balance.eq(expected), "The balance was not correct based on the second period bonus rate and weiSent");
		})

		it("should convert to third period bonus rate", async function () {
			await timeTravel(web3, fifteenDays);

			let capWei = new BigNumber(_secondPeriod.CAP + 10);
			capWei = capWei.mul(weiInEther);

			await crowdsaleInstance.buyTokens(_wallet, {
				value: capWei.toString(),
				from: _wallet
			})

			const weiSent = 1 * weiInEther;
			await crowdsaleInstance.buyTokens(_alice, {
				value: weiSent,
				from: _alice
			})

			let expected = new BigNumber(_thirdPeriod.BONUS_RATE)
			expected = expected.mul(weiSent);

			let balance = await tokenInstance.balanceOf.call(_alice);

			assert(balance.eq(expected), "The balance was not correct based on the third period bonus rate and weiSent");
		})

		it("should convert to fourth period bonus rate", async function () {
			await timeTravel(web3, fifteenDays);

			let capWei = new BigNumber(_thirdPeriod.CAP + 10);
			capWei = capWei.mul(weiInEther);

			await crowdsaleInstance.buyTokens(_wallet, {
				value: capWei.toString(),
				from: _wallet
			})

			const weiSent = 1 * weiInEther;
			await crowdsaleInstance.buyTokens(_alice, {
				value: weiSent,
				from: _alice
			})

			let expected = new BigNumber(_fourthPeriod.BONUS_RATE)
			expected = expected.mul(weiSent);

			let balance = await tokenInstance.balanceOf.call(_alice);

			assert(balance.eq(expected), "The balance was not correct based on the fourth period bonus rate and weiSent");
		})

		it("should convert to  default rate", async function () {
			await timeTravel(web3, fifteenDays);

			let capWei = new BigNumber(_fourthPeriod.CAP + 10);
			capWei = capWei.mul(weiInEther);

			await crowdsaleInstance.buyTokens(_wallet, {
				value: capWei.toString(),
				from: _wallet
			})

			const weiSent = 1 * weiInEther;
			await crowdsaleInstance.buyTokens(_alice, {
				value: weiSent,
				from: _alice
			})

			let expected = new BigNumber(_defaultRate)
			expected = expected.mul(weiSent);

			let balance = await tokenInstance.balanceOf.call(_alice);

			assert(balance.eq(expected), "The balance was not correct based on the default rate and weiSent");
		})

	})

	describe("bounty token", () => {
		let tokenInstance;

		beforeEach(async function () {

			_startTime = web3FutureTime(web3);
			_endTime = _startTime + sixWeeks;

			crowdsaleInstance = await ICOCrowdsale.new(_startTime, _endTime, _wallet, {
				from: _owner
			});

			let tokenAddress = await crowdsaleInstance.token.call();

			tokenInstance = ICOToken.at(tokenAddress);
			await timeTravel(web3, thirtyDays);

		})

		it("create bounty tokens", async function () {

			let expectedBalance = new BigNumber(500)
			expectedBalance = expectedBalance.mul(weiInEther);

			crowdsaleInstance.createBountyToken(_alice, expectedBalance.toString(), {
				from: _owner
			})

			let balance = await tokenInstance.balanceOf.call(_alice);

			assert(balance.eq(expectedBalance), "The balance was not correct based on bounty tokens");

		})

		it("should non owner trying to create bounty", async function () {
			const bonusTokens = 500 * weiInEther;

			await expectThrow(crowdsaleInstance.createBountyToken(_alice, bonusTokens, {
				from: _notOwner
			}))

		})

		it("should emit event on change", async function () {

			const expectedEvent = 'LogBountyTokenMinted';

			const bonusTokens = 500 * weiInEther;
			let result = await crowdsaleInstance.createBountyToken(_alice, bonusTokens, {
				from: _owner
			});
			assert.lengthOf(result.logs, 1, "There should be 1 event emitted from setRate!");
			assert.strictEqual(result.logs[0].event, expectedEvent, `The event emitted was ${result.logs[0].event} instead of ${expectedEvent}`);
		});


	})

	describe('finalization', () => {

		beforeEach(async function () {

			_startTime = web3FutureTime(web3);
			_endTime = _startTime + sixWeeks;

			crowdsaleInstance = await ICOCrowdsale.new(_startTime, _endTime, _wallet, {
				from: _owner
			});

			let tokenAddress = await crowdsaleInstance.token.call();

			tokenInstance = ICOToken.at(tokenAddress);

			await timeTravel(web3, thirtyDays);
			const weiSent = 1 * weiInEther;
			await crowdsaleInstance.buyTokens(_wallet, {
				value: weiSent,
				from: _wallet
			})

		})

		it("should transfer ownership of the token correctly on time finish", async function () {
			let initialOwner = await tokenInstance.owner.call();
			await timeTravel(web3, sixWeeks);
			await crowdsaleInstance.finalize();
			let afterOwner = await tokenInstance.owner.call();

			assert(initialOwner != afterOwner, "The owner has not changed");
			assert.equal(afterOwner, _owner, "The owner was not set to the crowdsale owner");
		})

		it("should unpause the token", async function () {
			await timeTravel(web3, sixWeeks);
			await crowdsaleInstance.finalize();
			let paused = await tokenInstance.paused.call();
			assert.isFalse(paused, "The token contract was not unpaused");
		})

	})


});
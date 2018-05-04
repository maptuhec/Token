const ICOCappedRefundableCrowdsale = artifacts.require("./ICOCappedRefundableCrowdsale.sol");
const ICOToken = artifacts.require("./ICOToken.sol");
const expectThrow = require('../util').expectThrow;
const timeTravel = require('../util').timeTravel;
const web3FutureTime = require('../util').web3FutureTime;
const BigNumber = require('bignumber.js');

contract('ICOCappedRefundableCrowdsale', function (accounts) {

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
	const nintyDays = 90 * day;
	const thirtyDays = 30 * day;
	const fourteenDays = 14 * day;
	const sevenDays = 7 * day;

	const minWeiAmount = 0.01 * weiInEther;

	const _defaultRate = 5000;

	let _cap = new BigNumber(17000);
	_cap = _cap.mul(weiInEther);

	let _goal = new BigNumber(1200);
	_goal = _goal.mul(weiInEther);

	describe("initializing crowsale", () => {

		it("should set initial values correctly", async function () {
			await timeTravel(web3, day);
			_startTime = web3FutureTime(web3);
			_endTime = _startTime + nintyDays;

			crowdsaleInstance = await ICOCappedRefundableCrowdsale.new(_startTime, _endTime, _cap.toString(), _goal.toString(), _wallet, {
				from: _owner
			});

			let startTime = await crowdsaleInstance.startTime.call();
			let endTime = await crowdsaleInstance.endTime.call();
			let wallet = await crowdsaleInstance.wallet.call();
			let rate = await crowdsaleInstance.rate.call();
			let cap = await crowdsaleInstance.cap.call();
			let goal = await crowdsaleInstance.goal.call();

			assert(startTime.eq(_startTime), "The start time is incorrect");
			assert(endTime.eq(_endTime), "The end time is incorrect");
			assert(rate.eq(_defaultRate), "The rate is incorrect");
			assert(cap.eq(_cap), "The cap is incorrect");
			assert(goal.eq(_goal), "The goal is incorrect");
			assert.strictEqual(wallet, _wallet, "The start time is incorrect");

			let token = await crowdsaleInstance.token.call();
			assert(token.length > 0, "Token length is 0");
			assert(token != "0x0");
		})

	});

	describe('cap', () => {

		beforeEach(async function () {

			_startTime = web3FutureTime(web3);
			_endTime = _startTime + nintyDays;

			crowdsaleInstance = await ICOCappedRefundableCrowdsale.new(_startTime, _endTime, _cap.toString(), _goal.toString(), _wallet, {
				from: _owner
			});

			let tokenAddress = await crowdsaleInstance.token.call();

			tokenInstance = ICOToken.at(tokenAddress);

			let addressesToWhitelist = [_wallet, _alice]
			await crowdsaleInstance.addAddressesToWhitelist(addressesToWhitelist, {
				from: _owner
			})
		})

		it("should end on reaching cap", async function () {
			let initialOwner = await tokenInstance.owner.call();
			await timeTravel(web3, thirtyDays);

			const weiSent = _cap.toString();
			await crowdsaleInstance.buyTokens(_wallet, {
				value: weiSent,
				from: _wallet
			})


			const hasEnded = await crowdsaleInstance.hasEnded();
			assert(hasEnded, "The crowdsale has not ended on the cap");
		})
	})


	describe('finalization', () => {

		beforeEach(async function () {

			_startTime = web3FutureTime(web3);
			_endTime = _startTime + nintyDays;

			crowdsaleInstance = await ICOCappedRefundableCrowdsale.new(_startTime, _endTime, _cap.toString(), _goal.toString(), _wallet, {
				from: _owner
			});

			let tokenAddress = await crowdsaleInstance.token.call();

			tokenInstance = ICOToken.at(tokenAddress);

			let addressesToWhitelist = [_wallet, _alice]
			await crowdsaleInstance.addAddressesToWhitelist(addressesToWhitelist, {
				from: _owner
			})

		})

		it("should forward the funds if goal is reached", async function () {

			await timeTravel(web3, thirtyDays);
			const weiSent = _goal.toString();
			await crowdsaleInstance.buyTokens(_wallet, {
				value: weiSent,
				from: _wallet
			})

			const initialBalance = web3.eth.getBalance(_wallet);
			await timeTravel(web3, nintyDays);
			await crowdsaleInstance.finalize();
			const finalBalance = web3.eth.getBalance(_wallet);

			assert(finalBalance.eq(initialBalance.plus(_goal)), "The balance was not correct");
		})

		it("should not forward the funds if goal is reached", async function () {

			await timeTravel(web3, thirtyDays);
			const weiSent = _goal.div(2);
			await crowdsaleInstance.buyTokens(_wallet, {
				value: weiSent,
				from: _wallet
			})

			const initialBalance = web3.eth.getBalance(_wallet);
			await timeTravel(web3, nintyDays);
			await crowdsaleInstance.finalize();
			const finalBalance = web3.eth.getBalance(_wallet);

			assert(finalBalance.eq(initialBalance), "The balance was not correct");
		})

		it("can claim refund", async function () {

			await timeTravel(web3, thirtyDays);
			const weiSent = _goal.div(2);
			await crowdsaleInstance.buyTokens(_wallet, {
				value: weiSent,
				from: _wallet
			})

			const initialBalance = web3.eth.getBalance(_wallet);
			await timeTravel(web3, nintyDays);
			await crowdsaleInstance.finalize();
			await crowdsaleInstance.claimRefund({
				from: _wallet
			})
			const finalBalance = web3.eth.getBalance(_wallet);

			assert(finalBalance.gt(initialBalance), "The balance was not correct");
		})

		it("should unpause the token on cap", async function () {

			await timeTravel(web3, nintyDays);
			const weiSent = _cap.toString();
			await crowdsaleInstance.buyTokens(_wallet, {
				value: weiSent,
				from: _wallet
			})
			await crowdsaleInstance.finalize();
			let paused = await tokenInstance.paused.call();
			assert.isFalse(paused, "The token contract was not unpaused");
		})

	})


});
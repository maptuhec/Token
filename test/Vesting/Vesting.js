var VestingToken = artifacts.require("../../ICOToken.sol")
var Vesting = artifacts.require('../../Vesting.sol')
const utils = require('../util.js');
const expectThrow = utils.expectThrow;
const currentTime = utils.web3Now;
const timeTravel = utils.timeTravel

function assertJump(error, search, message) {
	assert.isAbove(error.message.search(search), -1, message);
}


contract('Vesting', function (accounts) {

	var vestingContract;
	var token;
	var amount = 1000
	var tokenOwnerAddress = accounts[0];
	var contractOwnerAddress = accounts[1];
	var tokenInstance;
	var currentTimestamp;
	var futureTimestamp;
	const day = 24 * 60 * 60;
	const firstHalf = 60 * 60 * 24 * 182;
	const secondHalf = 60 * 60 * 24 * 183;
	const firstPeriod = firstHalf;
	const secondPeriod = firstPeriod + secondHalf;
	const thirdPeriod = secondPeriod + firstHalf;
	const fourthPeriod = thirdPeriod + secondHalf + day;
	const fifthPeriod = fourthPeriod + firstHalf;

	describe("All unit tests with start date in the past", () => {

		beforeEach(async function () {

			token = await VestingToken.new({
				from: tokenOwnerAddress
			})

			currentTimestamp = currentTime(web3);
			vestingContract = await Vesting.new(token.address,
				currentTime(web3), {
					from: contractOwnerAddress
				})

			await token.mint(vestingContract.address, amount);
		});

		it("should be owned by owner", async function () {
			let _owner = await vestingContract.owner({
				from: contractOwnerAddress
			});
			assert.strictEqual(_owner, contractOwnerAddress, "contract is not owned by owner");
		});

		// Claim function tests
		it("should transfer the tokens to the owner for the first period", async function () {
			let initialOwnerBalance = await token.balanceOf(vestingContract.address);
			await timeTravel(web3, day);
			await vestingContract.claim({
				from: contractOwnerAddress
			});
			let finalOwnerBalance = await token.balanceOf(vestingContract.address);
			assert(finalOwnerBalance.eq(initialOwnerBalance.minus('200')), "The transfer wasn't successful")
		})

		it("should transfer the tokens to the owner for the second period", async function () {
			let initialOwnerBalance = await token.balanceOf(vestingContract.address);
			await timeTravel(web3, firstPeriod + day);
			await vestingContract.claim({
				from: contractOwnerAddress
			});
			let finalOwnerBalance = await token.balanceOf(vestingContract.address);
			assert(finalOwnerBalance.eq(initialOwnerBalance.minus('400')), "The transfer wasn't successful")
		})

		it("should transfer the tokens to the owner for the third period", async function () {
			let initialOwnerBalance = await token.balanceOf(vestingContract.address);
			await timeTravel(web3, secondPeriod + day);
			await vestingContract.claim({
				from: contractOwnerAddress
			});
			let finalOwnerBalance = await token.balanceOf(vestingContract.address);
			assert(finalOwnerBalance.eq(initialOwnerBalance.minus('600')), "The transfer wasn't successful")
		})

		it("should transfer the tokens to the owner for the fourth period", async function () {
			let initialOwnerBalance = await token.balanceOf(vestingContract.address);
			await timeTravel(web3, thirdPeriod + day);
			await vestingContract.claim({
				from: contractOwnerAddress
			});
			let finalOwnerBalance = await token.balanceOf(vestingContract.address);
			assert(finalOwnerBalance.eq(initialOwnerBalance.minus('800')), "The transfer wasn't successful")
		})

		it("should transfer the tokens to the owner for the fifth period", async function () {
			await timeTravel(web3, fourthPeriod + (day * 2));
			await vestingContract.claim({
				from: contractOwnerAddress
			});
			let finalOwnerBalance = await token.balanceOf(vestingContract.address);
			assert.equal(finalOwnerBalance.toString(), 0, "The transfer wasn't successful")
		})

		it("should transfer the tokens to the owner for the end of the period", async function () {
			await timeTravel(web3, fifthPeriod + day);
			await vestingContract.claim({
				from: contractOwnerAddress
			});
			let finalOwnerBalance = await token.balanceOf(vestingContract.address);
			assert.equal(finalOwnerBalance.toString(), 0, "The transfer wasn't successful")
		})

		//Event Tests
		it("should emit one event if transfer for the first period is successful", async function () {
			const expectedEvent = 'LogTransferSuccessful'
			await timeTravel(web3, day);
			let result = await vestingContract.claim({
				from: contractOwnerAddress
			});
			assert.lengthOf(result.logs, 1, "There should be 1 event emitted from claiming the tokens !");
			assert.strictEqual(result.logs[0].event, expectedEvent, `The event emitted was ${result.logs[0].event} instead of ${expectedEvent}`);
		})

		it("should emit one event if transfer for the second period is successful", async function () {
			const expectedEvent = 'LogTransferSuccessful'
			await timeTravel(web3, firstPeriod + day);
			let result = await vestingContract.claim({
				from: contractOwnerAddress
			});
			assert.lengthOf(result.logs, 1, "There should be 1 event emitted from claiming the tokens !");
			assert.strictEqual(result.logs[0].event, expectedEvent, `The event emitted was ${result.logs[0].event} instead of ${expectedEvent}`);
		})
		it("should emit one event if transfer for the third period is successful", async function () {
			const expectedEvent = 'LogTransferSuccessful'
			await timeTravel(web3, secondPeriod + day);
			let result = await vestingContract.claim({
				from: contractOwnerAddress
			});
			assert.lengthOf(result.logs, 1, "There should be 1 event emitted from claiming the tokens !");
			assert.strictEqual(result.logs[0].event, expectedEvent, `The event emitted was ${result.logs[0].event} instead of ${expectedEvent}`);
		})

		it("should emit one event if transfer for the fourth period is successful", async function () {
			const expectedEvent = 'LogTransferSuccessful'
			await timeTravel(web3, thirdPeriod + day);
			let result = await vestingContract.claim({
				from: contractOwnerAddress
			});
			assert.lengthOf(result.logs, 1, "There should be 1 event emitted from claiming the tokens !");
			assert.strictEqual(result.logs[0].event, expectedEvent, `The event emitted was ${result.logs[0].event} instead of ${expectedEvent}`);
		})

		it("should emit one event if transfer for the fifth period is successful", async function () {
			const expectedEvent = 'LogTransferSuccessful'
			await timeTravel(web3, fourthPeriod + (day * 2));
			let result = await vestingContract.claim({
				from: contractOwnerAddress
			});
			assert.lengthOf(result.logs, 1, "There should be 1 event emitted from claiming the tokens !");
			assert.strictEqual(result.logs[0].event, expectedEvent, `The event emitted was ${result.logs[0].event} instead of ${expectedEvent}`);
		})

		it("should emit one event if transfer for beyond the fifth period is successful", async function () {
			const expectedEvent = 'LogTransferSuccessful'
			await timeTravel(web3, fifthPeriod + day);
			let result = await vestingContract.claim({
				from: contractOwnerAddress
			});
			assert.lengthOf(result.logs, 1, "There should be 1 event emitted from claiming the tokens !");
			assert.strictEqual(result.logs[0].event, expectedEvent, `The event emitted was ${result.logs[0].event} instead of ${expectedEvent}`);
		})

		//	Negative cases
		it("should throw if the token balance is not greater that zero", async function () {
			await timeTravel(web3, fifthPeriod + day);
			await vestingContract.claim({
				from: contractOwnerAddress
			});
			await expectThrow(vestingContract.claim({
				from: contractOwnerAddress
			}));
		});

		it("should throw if the claim is not called from the owner of the contract", async function () {
			await timeTravel(web3, day);
			await expectThrow(vestingContract.claim({
				from: accounts[3]
			}));
		});

		it("should throw if the first period tokens are not greater than the claimed tokens", async function () {
			await timeTravel(web3, day);
			await vestingContract.claim({
				from: contractOwnerAddress
			});
			await timeTravel(web3, day);
			await expectThrow(vestingContract.claim({
				from: contractOwnerAddress
			}));
		})

		it("should throw if the second period tokens are not greater than the claimed tokens", async function () {
			await timeTravel(web3, secondPeriod + day);
			await vestingContract.claim({
				from: contractOwnerAddress
			});
			await expectThrow(vestingContract.claim({
				from: contractOwnerAddress
			}));
		})

		it("should throw if the third period tokens are not greater than the claimed tokens", async function () {
			await timeTravel(web3, thirdPeriod + day);
			await vestingContract.claim({
				from: contractOwnerAddress
			});
			await expectThrow(vestingContract.claim({
				from: contractOwnerAddress
			}));
		})

		it("should throw if the fourth period tokens are not greater than the claimed tokens", async function () {
			await timeTravel(web3, fourthPeriod + (day * 2));
			await vestingContract.claim({
				from: contractOwnerAddress
			});
			await expectThrow(vestingContract.claim({
				from: contractOwnerAddress
			}));
		})

		it("should throw if the fifth period tokens are not greater than the claimed tokens", async function () {
			await timeTravel(web3, fifthPeriod + day);
			await vestingContract.claim({
				from: contractOwnerAddress
			});
			await expectThrow(vestingContract.claim({
				from: contractOwnerAddress
			}));
		})

	})

	describe("Test with start date in the future", () => {

		it("should throw if the start date is in the future", async function () {
			token = await VestingToken.new({
				from: tokenOwnerAddress
			})

			futureTimestamp = currentTime(web3) + 10000;
			vestingContract = await Vesting.new(token.address,
				futureTimestamp, {
					from: tokenOwnerAddress
				})
			token.mint(vestingContract.address, amount);
			await expectThrow(vestingContract.claim({
				from: tokenOwnerAddress
			}));
		})
	});
})
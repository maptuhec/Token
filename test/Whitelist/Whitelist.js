const VestingToken = artifacts.require("../../ICOToken.sol");
const ICOCrowdsale = artifacts.require("../../ICOCrowdsale.sol");
const utils = require('../util.js');
const expectThrow = utils.expectThrow;
const web3FutureTime = utils.web3FutureTime;
const timeTravel = utils.timeTravel;

contract('Whitelist', function (accounts) {

	let crowdsaleInstance;
	let whitelistInstance;
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


	describe("All unit tests for whitelisting", () => {
		let tokenInstance;
		const _symbol = "ARX";

		beforeEach(async function () {
			await timeTravel(web3, day);
			_startTime = web3FutureTime(web3);
			_endTime = _startTime + sixWeeks;

			crowdsaleInstance = await ICOCrowdsale.new(_startTime, _endTime, _wallet, {
				from: _owner
			});
			let tokenAddress = await crowdsaleInstance.token.call();
			tokenInstance = await VestingToken.at(tokenAddress);


		})

		it("should add user to whitelist", async function () {

			await crowdsaleInstance.addAddressToWhitelist(_wallet, {
				from: _owner
			})

			let isUserAdded = await crowdsaleInstance.whitelist(_wallet);
			assert.equal(isUserAdded, true, "User is not properly added to the whitelist");
		});

		it("should add multiple users to the whitelist", async function () {
			let addressesToWhitelist = [_wallet, _alice]
			await crowdsaleInstance.addAddressesToWhitelist(addressesToWhitelist, {
				from: _owner
			})

			let isUserWalletAdded = await crowdsaleInstance.whitelist(_wallet);
			let isUserAliceAdded = await crowdsaleInstance.whitelist(_alice);
			assert.equal(isUserWalletAdded, true, "User '_walet' is not properly added to the whitelist");
			assert.equal(isUserAliceAdded, true, "User '_alice' is not properly added to the whitelist");
		})

		it("should remove user from the whitelist", async function () {
			await crowdsaleInstance.addAddressToWhitelist(_wallet, {
				from: _owner
			})

			await crowdsaleInstance.removeAddressFromWhitelist(_wallet, {
				from: _owner
			})
			let isUserWalletAdded = await crowdsaleInstance.whitelist(_wallet);
			assert.equal(isUserWalletAdded, false, "User '_walet' is not properly removed to the whitelist");
		})

		it("should remove multiple users from the whitelist", async function () {
			let addressesToWhitelist = [_wallet, _alice]
			await crowdsaleInstance.addAddressesToWhitelist(addressesToWhitelist, {
				from: _owner
			})

			await crowdsaleInstance.removeAddressesFromWhitelist(addressesToWhitelist, {
				from: _owner
			})

			let isUserWalletAdded = await crowdsaleInstance.whitelist(_wallet);
			let isUserAliceAdded = await crowdsaleInstance.whitelist(_alice);

			assert.equal(isUserWalletAdded, false, "User '_walet' is not properly removed to the whitelist");
			assert.equal(isUserAliceAdded, false, "User '_alice' is not properly removed to the whitelist");
		})

		it("should emit one event when adding single user to whitelist", async function () {
			let expectedEvent = 'WhitelistedAddressAdded';

			let result = await crowdsaleInstance.addAddressToWhitelist(_wallet, {
				from: _owner
			})

			assert.lengthOf(result.logs, 1, "There should be 1 event emitted from adding users to whitelist !");
			assert.strictEqual(result.logs[0].event, expectedEvent, `The event emitted was ${result.logs[0].event} instead of ${expectedEvent}`);
		})

		it("should emit events for every user added to the whitelist", async function () {
			let expectedEvent = 'WhitelistedAddressAdded';

			let addressesToWhitelist = [_wallet, _alice, _carol]
			let result = await crowdsaleInstance.addAddressesToWhitelist(addressesToWhitelist, {
				from: _owner
			})
			let whitelistLength = addressesToWhitelist.length

			assert.lengthOf(result.logs, whitelistLength, `There should be ${whitelistLength} event emitted from adding users to whitelist !`);
			assert.strictEqual(result.logs[0].event, expectedEvent, `The event emitted was ${result.logs[0].event} instead of ${expectedEvent}`);
		})


		it("should emit one event when removing single user to whitelist", async function () {
			let expectedEvent = 'WhitelistedAddressRemoved';

			await crowdsaleInstance.addAddressToWhitelist(_wallet, {
				from: _owner
			})

			let result = await crowdsaleInstance.removeAddressFromWhitelist(_wallet, {
				from: _owner
			})

			assert.lengthOf(result.logs, 1, "There should be 1 event emitted from removing user from the whitelist !");
			assert.strictEqual(result.logs[0].event, expectedEvent, `The event emitted was ${result.logs[0].event} instead of ${expectedEvent}`);
		})

		it("should emit events for every user removed to the whitelist", async function () {
			let expectedEvent = 'WhitelistedAddressRemoved';

			let addressesToWhitelist = [_wallet, _alice, _carol]

			await crowdsaleInstance.addAddressesToWhitelist(addressesToWhitelist, {
				from: _owner
			})
			let result = await crowdsaleInstance.removeAddressesFromWhitelist(addressesToWhitelist, {
				from: _owner
			})
			let whitelistLength = addressesToWhitelist.length

			assert.lengthOf(result.logs, whitelistLength, `There should be ${whitelistLength} event emitted from removing users from the whitelist !`);
			assert.strictEqual(result.logs[0].event, expectedEvent, `The event emitted was ${result.logs[0].event} instead of ${expectedEvent}`);
		})

		it("should throw if user different from the owner tries to add user to whitelist", async function () {

			await expectThrow(crowdsaleInstance.addAddressToWhitelist(_wallet, {
				from: _alice
			}));
		})
		it("should throw if user different from the owner tries to add multiple users to whitelist", async function () {

			let addressesToWhitelist = [_wallet, _alice, _carol]
			await expectThrow(crowdsaleInstance.addAddressesToWhitelist(addressesToWhitelist, {
				from: _alice
			}));
		})

		it("should throw if user different from the owner tries to remove user from the whitelist", async function () {

			await crowdsaleInstance.addAddressToWhitelist(_wallet, {
				from: _owner
			})

			await expectThrow(crowdsaleInstance.removeAddressFromWhitelist(_wallet, {
				from: _alice
			}));
		})

		it("should throw if user different from the owner tries to remove multiple users to whitelist", async function () {

			let addressesToWhitelist = [_wallet, _alice, _carol]

			await crowdsaleInstance.addAddressesToWhitelist(addressesToWhitelist, {
				from: _owner
			})

			await expectThrow(crowdsaleInstance.removeAddressesFromWhitelist(addressesToWhitelist, {
				from: _alice
			}));
		})


	});

})
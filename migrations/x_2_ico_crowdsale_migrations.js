var ICOCrowdsale = artifacts.require("./ICOCrowdsale.sol");

function getFutureTimestamp(plusMinutes) {
	let date = new Date();
	date.setMinutes(date.getMinutes() + plusMinutes)
	let timestamp = +date;
	timestamp = Math.ceil(timestamp / 1000);
	return timestamp;
}

function getWeb3FutureTimestamp(plusMinutes) {
	return web3.eth.getBlock(web3.eth.blockNumber).timestamp + plusMinutes * 60;
}

module.exports = async function (deployer, network) {
	const isDevNetwork = (network == 'development' || network == 'td' || network == 'ganache');
	const fifteenMinutes = 15;
	const nintyDaysInMinutes = 90 * 24 * 60;
	const _startTime = (isDevNetwork) ? getWeb3FutureTimestamp(fifteenMinutes) : getFutureTimestamp(fifteenMinutes);
	const _endTime = (isDevNetwork) ? getWeb3FutureTimestamp(nintyDaysInMinutes) : getFutureTimestamp(nintyDaysInMinutes);
	const _wallet = '0x795EFF09B1FE788DC7e6824AA5221aD893Fd465A';
	await deployer.deploy(ICOCrowdsale, _startTime, _endTime, _wallet);
};
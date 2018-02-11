pragma solidity ^0.4.18;


import "../node_modules/zeppelin-solidity/contracts/token/MintableToken.sol";
import "../node_modules/zeppelin-solidity/contracts/lifecycle/Pausable.sol";


/**
 * @title ICOToken
 * @dev Very simple ERC20 Token example.
 * `StandardToken` functions.
 */
contract ICOToken is MintableToken, Pausable {

  string public constant name = "ARXUM Token";
  string public constant symbol = "ARX";
  uint8 public constant decimals = 18;


  /**
   * @dev Constructor that gives msg.sender all of existing tokens.
   */
  function ICOToken() public {
  }
}
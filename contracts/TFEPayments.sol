pragma solidity 0.5.0;

import "@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/ownership/Ownable.sol";

contract TFEPayments is ERC20, ERC20Detailed, Ownable {
    
    constructor(string memory name, string memory symbol, uint8 decimals, uint256 initialSupply) ERC20Detailed(name, symbol, decimals) public {
        _mint(msg.sender, initialSupply);
    }
    
    function SelfDestruct(address payable _a) public onlyOwner payable {
        selfdestruct(_a);
    }

}
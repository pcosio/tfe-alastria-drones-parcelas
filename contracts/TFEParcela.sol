pragma solidity 0.5.0;

import "@openzeppelin/contracts/token/ERC721/ERC721Full.sol";
import "@openzeppelin/contracts/ownership/Ownable.sol";

contract TFEParcela is ERC721Full, Ownable {
    Counters.Counter private _tokenIds;

    constructor(string memory name, string memory symbol) public ERC721Full (name, symbol) {}

    function newItem(address player, string memory tokenURI)
        public
        returns (uint256)
    {
        _tokenIds.increment();

        uint256 newItemId = _tokenIds.current();
        _mint(player, newItemId);
        _setTokenURI(newItemId, tokenURI);

        return newItemId;
    }
    
    function SelfDestruct(address payable _a) public onlyOwner payable {
        selfdestruct(_a);
    }
}
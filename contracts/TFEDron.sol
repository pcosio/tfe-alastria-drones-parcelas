pragma solidity 0.5.0;

import "@openzeppelin/contracts/token/ERC721/ERC721Full.sol";
import "@openzeppelin/contracts/ownership/Ownable.sol";
//import "./TFEPayments.sol";
//import "./TFEParcela.sol";

contract TFEDron is ERC721Full, Ownable {
    Counters.Counter private _tokenIds;
    
    //TFEPayments contractPayments;
    //TFEParcela contractParcela;
    
    uint256 public jobIndex;
    
    struct Job {
        address from;
        uint256 tokenIdParcela;
        uint256 tokenIdDron;
        uint256 cost;
        bool approved;
        bool executed;
    }
    mapping (uint256 => Job) public jobs;
    
    event JobPendingApproval(uint256 indexed tokenIdDron, uint256 tokenIdParcela, address from, uint256 jobId);
    event ParcelaFumigada(uint256 indexed tokenIdParcela);

    /*constructor(string memory name, string memory symbol, address _contractPayments, address _contractParcela) public ERC721Full (name, symbol) {
        //contractPayments = TFEPayments(_contractPayments);
        //contractParcela = TFEParcela(_contractParcela);
    }*/
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
    

	function addJob(address _from, uint256 _tokenIdParcela, uint256 _tokenIdDron, uint256 _cost) public returns (uint256 jobId){
        //require(contractParcela.ownerOf(_tokenIdParcela) == msg.sender, "Only owner of the parcela can request a job");
        //require(keccak256(abi.encodePacked(this.tokenURI(_tokenIdDron))) == keccak256(abi.encodePacked(_tokenURI)), "Token uri doesn't match to the related to tokenId");
        require(_from == msg.sender, "Only owner of the parcela can request a job");
        jobs[jobIndex].from = _from;
        jobs[jobIndex].tokenIdParcela = _tokenIdParcela;
        jobs[jobIndex].tokenIdDron = _tokenIdDron;
        jobs[jobIndex].cost = _cost;
        jobs[jobIndex].approved = false;
        jobs[jobIndex].executed = false;
        jobIndex++;
        emit JobPendingApproval(_tokenIdDron, _tokenIdParcela, _from, (jobIndex-1));
        return jobIndex-1;
    }
    
    function SelfDestruct(address payable _a) public onlyOwner payable {
        selfdestruct(_a);
    }
    
    function approveJob(uint256 jobId) public {
        uint256 tokenId = jobs[jobId].tokenIdDron;
        require(ownerOf(tokenId) == msg.sender, "Only owner of the Dron can approve jobs");
        //require(contractPayments.transferFrom(jobs[jobId].from, ownerOf(tokenId), jobs[jobId].cost), "TransferFromFailed");
        jobs[jobId].approved = true;
        emit ParcelaFumigada(jobs[jobId].tokenIdParcela);
        jobs[jobId].executed = true;
    }
}
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract CampaignFactory is Ownable {
    mapping(address => Campaign[]) public campaigns;

    function createCampaign(uint _goal) public {
        Campaign campaign = new Campaign(_goal, msg.sender);
        campaigns[msg.sender].push(campaign);
    }
}

contract Campaign is ERC721, Ownable {
    using SafeMath for uint256;
    using Counters for Counters.Counter;
    address public creator;
    uint private goal;
    uint public totalAmountContributed;
    uint public creationTime;
    mapping (address => uint) nftsDisbursed;
    mapping (address => uint) contributors;
    bool public cancelled;
    bool public reachedGoal;
    Counters.Counter private _tokenIds;

    constructor(uint _goal, address _owner) ERC721("NFT", "rippy") {
        transferOwnership(_owner);
        creator = _owner;
        goal = _goal * 1 ether;
        creationTime = block.timestamp;
    }

    modifier before30days {
        require(block.timestamp < creationTime + 30 days + 900 seconds);
        _;
    }

    function contribute() public payable before30days {
        require(!reachedGoal, "campaign goal reached");
        require(msg.value >= .01 ether, "contribution too low. Please send at least .01 eth");
        
        totalAmountContributed += msg.value;
         
        if (totalAmountContributed >= goal) {
            reachedGoal = true; // once it's true, you will never set it to false again, otherwise the owner can't withdraw
        }
        contributors[msg.sender] += msg.value;

        uint nftsToDisburse = (contributors[msg.sender] / 1 ether) - nftsDisbursed[msg.sender];

        if ((contributors[msg.sender].div((1 ether))) - nftsDisbursed[msg.sender] > 0) {
            for (uint i=0; i < nftsToDisburse; i++){
                nftsDisbursed[msg.sender] += 1;
                mintNFT(msg.sender);
            }
        }
    }

    // should just send everything back instead of letting owner do a specific amount
    function withdraw(uint _amount) public payable onlyOwner {
        require(reachedGoal, "campaign goal not reached yet");
        require(_amount <= totalAmountContributed, "withdraw amount too high");
        totalAmountContributed -= _amount * 1 ether;
        (bool success,) = creator.call{value:_amount * 1 ether}("");
        require(success, "Failed to withdraw Ether!");
    }

    function cancelCampaign() public onlyOwner before30days {
        cancelled = true;
    }

    function claimRefund() public {
        require(!reachedGoal);
        require((block.timestamp > creationTime + 30 days + 900 seconds) || cancelled);
        uint amountToSend = contributors[msg.sender];
        contributors[msg.sender] = 0;
        (bool success, ) = msg.sender.call{value: amountToSend}("");
        require(success);
    }

    function mintNFT(address contributor) private returns (uint256) {
        _tokenIds.increment();

        uint256 newItemId = _tokenIds.current();
        _mint(contributor, newItemId);

        return newItemId;
    }

    receive() external payable {}
}
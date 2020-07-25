/**
 * Author: Jashan Shewakramani
 * Description: Main PlanetFlareCoin implementation
 *
 * ERC20 Token Spec: https://eips.ethereum.org/EIPS/eip-20
 */
pragma solidity ^0.6.9;

contract PlanetFlareCoin {
    /* Events */
    event Transfer(address indexed _from, address indexed _to, uint256 _value);
    event Approval(address indexed _owner, address indexed _spender, uint256 _value);
    event BountyUpdate(uint256 indexed bountyID, address indexed publisher, string contentID, uint256 deposit);

    /* Internal Types */
    struct Bounty {
        uint256 id;
        address publisher;
        string contentID;
        uint256 deposit;
    }

    /* Coin Variables */
    uint256 private _totalSupply = 10000;
    mapping (address => uint256) balances;
    mapping (address => mapping (address => uint256)) allowances;

    /* Bounty Variables */
    mapping (uint256 => Bounty) bountiesByID;

    /* Constructor */
    constructor() public {
        balances[msg.sender] = _totalSupply;
    }

    /* ERC 20 Implementation */
    function name() public pure returns (string memory) {
        return "PlanetFlareCoin";
    }

    function symbol() public pure returns (string memory) {
        return "PFC";
    }

    function totalSupply() public view returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address owner) public view returns (uint256 balance) {
        return balances[owner];
    }

    function transfer(address receiver, uint256 amount) public returns (bool success) {
        require(balances[msg.sender] >= amount, "Not enough balance");
        balances[msg.sender] -= amount;
        balances[receiver] += amount;
        emit Transfer(msg.sender, receiver, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) public returns (bool success)  {
        require (amount <= balances[from], "Not enough balance");
        require (amount <= allowances[from][msg.sender], "Not approved sufficient balance");
        require (to != address(0), "Zero receiver address");

        balances[from] -= amount;
        balances[to] += amount;
        allowances[from][msg.sender] -= amount;

        emit Transfer(from, to, amount);

        return true;
    }

    function approve(address spender, uint256 amount) public returns (bool success) {
        allowances[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function allowance(address owner, address spender) public view returns (uint256 remaining) {
        return allowances[owner][spender];
    }


    /* Bounty Functions */
    function getBounty(uint256 bountyID) public view returns (uint256 id, address publisher, string memory contentID, uint256 deposit) {
        Bounty memory bounty = bountiesByID[bountyID];
        return (bounty.id, bounty.publisher, bounty.contentID, bounty.deposit);
    }

    function updateBounty(string memory contentID, uint256 deposit) public returns (bool success) {
        uint256 bountyID = uint256(keccak256(abi.encode(msg.sender, contentID)));

        Bounty storage bounty = bountiesByID[bountyID];

        if (deposit > bounty.deposit) {
            require((deposit - bounty.deposit) <= balances[msg.sender], "Not enough PFC balance");
            balances[msg.sender] -= (deposit - bounty.deposit);
        } else if (deposit < bounty.deposit) {
            balances[msg.sender] += (bounty.deposit - deposit);
        }

        bounty.id = bountyID;
        bounty.publisher = msg.sender;
        bounty.contentID = contentID;
        bounty.deposit = deposit;

        emit BountyUpdate(bountyID, msg.sender, contentID, deposit);

        return true;
    }
}

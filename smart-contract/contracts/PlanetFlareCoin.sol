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
    event BountyCreate(uint256 indexed bountyID, address indexed publisher, string indexed bucketID);
    event BountyDelete(uint256 indexed bountyID);
    event BountyOwnerOutOfBalance(address indexed owner);

    /* Internal Types */
    struct Bounty {
        uint256 id;
        address publisher;
        string bucketID;
        uint256 costPerToken;
        uint256 lastUpdated;
    }

    /* Coin Variables */
    uint256 private _totalSupply = 10000;
    mapping (address => uint256) balances;
    mapping (address => mapping (address => uint256)) allowances;

    /* Bounty Variables */
    mapping(address => uint256[]) bountyIDsByPublisher;
    mapping (uint256 => Bounty) bountiesByID;

    /* Payment Channel Variables */
    mapping (uint256 => bool) usedNonces;

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
    function getBounty(uint256 bountyID) public view returns
     (uint256 id, address publisher, string memory bucketID, uint256 costPerToken, uint256 lastUpdated) {
        Bounty storage bounty = bountiesByID[bountyID];
        return (bounty.id, bounty.publisher, bounty.bucketID, bounty.costPerToken, bounty.lastUpdated);
    }

    function getBountiesForPublisher(address publisher) public view returns (uint256[] memory) {
        return bountyIDsByPublisher[publisher];
    }

    function createBounty(string memory bucketID, uint256 costPerToken) public returns (uint256 id) {
        require(costPerToken > 0, "Cannot have zero cost bounty");

        uint256 bountyID = uint256(keccak256(abi.encode(msg.sender, bucketID)));

        Bounty storage bounty = bountiesByID[bountyID];
        require (bountiesByID[bountyID].publisher == address(0), "Bounty already exists");

        bounty.id = bountyID;
        bounty.publisher = msg.sender;
        bounty.bucketID = bucketID;
        bounty.costPerToken = costPerToken;
        bounty.lastUpdated = now;

        // TODO: append to publisher list
        uint256[] storage publisherBounties = bountyIDsByPublisher[msg.sender];
        publisherBounties.push(bountyID);

        emit BountyCreate(bountyID, msg.sender, bucketID);

        return bountyID;
    }

    function deleteBounty(uint256 bountyID) public returns (bool success) {
        Bounty storage bounty = bountiesByID[bountyID];

        // check permissions
        require(bounty.publisher == msg.sender, "Unauthorized delete, or bounty does not exist");

        // emit event indicating deletion and then delete
        emit BountyDelete(bountyID);

        // delete it from the main list
        delete bountiesByID[bountyID];

        // delete from publisher list by creating a new one (thank the lack of a std lib for the shitty complexity)
        uint256[] memory oldBountyList = bountyIDsByPublisher[msg.sender];
        delete bountyIDsByPublisher[msg.sender];
        uint256[] storage newBountyList = bountyIDsByPublisher[msg.sender];

        for (uint i = 0; i < oldBountyList.length; ++i) {
            if (oldBountyList[i] != bountyID)
                newBountyList.push(oldBountyList[i]);
        }

        return true;
    }

    /* Payment Channel */
    function claimPayment(uint256 bountyID, uint256 numTokens, uint256 nonce, bytes memory signature) public
        returns (bool success) {
        require(!usedNonces[nonce], "Nonce alredy used");
        usedNonces[nonce] = true;

        Bounty storage bounty = bountiesByID[bountyID];
        address owner = bounty.publisher;
        address receiver = msg.sender;

        // this recreates the message that was signed on the client
        bytes32 message = prefixed(keccak256(abi.encodePacked(msg.sender, bountyID, numTokens, nonce)));

        require(recoverSigner(message, signature) == owner, "Invalid signature");

        uint256 amount = numTokens * bounty.costPerToken;

        // TODO: handle this edge case
        if (balances[owner] < amount) {
            uint256 amountToTransfer = balances[owner];
            balances[owner] = 0;
            balances[receiver] += amountToTransfer;
            emit Transfer(owner, receiver, amountToTransfer);
            emit BountyOwnerOutOfBalance(owner);
        } else {
            balances[owner] -= amount;
            balances[receiver] += amount;
            emit Transfer(owner, receiver, amount);
        }
        require(balances[owner] >= amount, "Owner does not have enouch cash");

        balances[receiver] += amount;

        emit Transfer(bounty.publisher, msg.sender, amount);

        return true;
    }

    /// signature methods.
    function splitSignature(bytes memory sig)
        internal
        pure
        returns (uint8 v, bytes32 r, bytes32 s)
    {
        require(sig.length == 65);

        assembly {
            // first 32 bytes, after the length prefix.
            r := mload(add(sig, 32))
            // second 32 bytes.
            s := mload(add(sig, 64))
            // final byte (first byte of the next 32 bytes).
            v := byte(0, mload(add(sig, 96)))
        }

        return (v, r, s);
    }

    function recoverSigner(bytes32 message, bytes memory sig)
        internal
        pure
        returns (address)
    {
        (uint8 v, bytes32 r, bytes32 s) = splitSignature(sig);

        return ecrecover(message, v, r, s);
    }

    /// builds a prefixed hash to mimic the behavior of eth_sign.
    function prefixed(bytes32 hash) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
    }
}

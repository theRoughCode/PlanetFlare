/**
 * Author: Jashan Shewakramani
 * Description: Main PlanetFlareCoin implementation
 *
 * ERC20 Token Spec: https://eips.ethereum.org/EIPS/eip-20
 */
pragma solidity ^0.6.9;

contract PlanetFlareCoin {
    // events
    event Transfer(address indexed _from, address indexed _to, uint256 _value);
    event Approval(address indexed _owner, address indexed _spender, uint256 _value);

    // internal state
    uint256 private _totalSupply = 10000;
    mapping (address => uint256) balances;
    mapping (address => mapping (address => uint256)) allowances;


    constructor() public {
        balances[msg.sender] = _totalSupply;
    }

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
}

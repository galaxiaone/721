pragma solidity 0.5.6;

import './Proxy.sol';
import "../ownership/ownable.sol";


// @title users contract version resolver
contract Resolver is Ownable {

    Proxy public proxy;

    mapping (address => address) public userVersion;
    mapping (address => bool) public validImplementation;

    // @notice proxy creates this contract and sets the owner
    constructor(address owner)
    public {
        proxy = Proxy(msg.sender);
        initializeOwner(owner);
    }

    // @notice user can set his preferred version of the contract here
    function setUserVersion(address addr)
    public {
        require(validImplementation[addr]);
        userVersion[msg.sender] = addr;
    }

    // @notice authorizes an optional upgrade for users
    function setValidImplementation(address addr, bool valid)
    public
    returns (bool) {
        require(msg.sender == address(proxy));
        validImplementation[addr] = valid;
        return true;
    }

    // @notice get the version preferred by this user
    function getUserVersion(address user)
    public
    view
    returns (address){
        if (userVersion[user] == address(0))
            return proxy.implementation();
        else
            return userVersion[user];
    }
}

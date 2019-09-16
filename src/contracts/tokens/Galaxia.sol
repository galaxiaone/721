pragma solidity 0.5.6;

import "../tokens/nf-token-metadata.sol";
import "../ownership/ownable.sol";

contract OwnableDelegateProxy { }

contract ProxyRegistry {
    mapping(address => OwnableDelegateProxy) public proxies;
}

/**
 * @dev This is an example contract implementation of NFToken with enumerable extension.
 */
contract Galaxia is
  NFTokenMetadata,
  Ownable
{
  address public proxyRegistryAddress;
  mapping (bytes32 => bool) public validUpgrade;
  uint256 public totalSupply;

  /**
  * @dev Contract constructor.
  * @param _name A descriptive name for a collection of NFTs.
  * @param _symbol An abbreviated name for NFTokens.
  */
  constructor(string memory _name, string memory _symbol, address _proxyRegistryAddress)
  public {
    proxyRegistryAddress = _proxyRegistryAddress;
    nftName = _name;
    nftSymbol = _symbol;
    gateway = "https://cloudflare-ipfs.com/ipfs/";
  }



  /**
   * @dev Mints a new NFT.
   * @param _to The address that will own the minted NFT.
   * @param _uri The IPFS hash of this asset metadata
   */
  function mint(address _to, string calldata _uri)
  external
  onlyOwner {
    super._mint(_to, totalSupply);
    super._setTokenUri(totalSupply, _uri);
    totalSupply++;
  }

    /**
   * Override isApprovedForAll to whitelist user's OpenSea proxy accounts to enable gas-less listings.
   */
  function isApprovedForAll(address _owner, address _operator)
    public
    view
    returns (bool) {
    // Whitelist OpenSea proxy contract for easy trading.
    ProxyRegistry proxyRegistry = ProxyRegistry(proxyRegistryAddress);
    if (address(proxyRegistry.proxies(_owner)) == _operator) {
        return true;
    }

    return super.isApprovedForAll(_owner, _operator);
  }

    /**
  * @dev Galaxia owner can add an optional upgrade path for token holder of _tokenId
  * @dev Owner of contract can give alternative metadata versions for users to upgrade to
  * @param _tokenId ID of this token
  * @param _newURI metadata hash for this token
  */
  function addUpgradePath(uint256 _tokenId, string calldata _newURI) external onlyOwner {
    require(_tokenId < totalSupply || super.ownerOf(_tokenId) == address(0));
    bytes32 upgradeHash = keccak256(abi.encodePacked(_tokenId, _newURI));
    validUpgrade[upgradeHash] = true;
    emit UpgradePathAdded(_tokenId, _newURI);
  }

    /**
  * @dev Token holder can upgrade to one of the upgrade paths supplied by the Galaxia owner
  * @dev Note: token holders will not be able to downgrade back to the previous version
  * @param _tokenId The ID of this token
  * @param _newURI The new metadata hash for this token
  */
  function upgradeMetadata(uint256 _tokenId, string calldata _newURI) external  {
    require(super.isOwner(_tokenId, msg.sender));
    bytes32 upgradeHash = keccak256(abi.encodePacked(_tokenId, _newURI));
    require(validUpgrade[upgradeHash]);
    validUpgrade[upgradeHash] = false;
    string memory oldURI = idToUri(_tokenId);
    super._setTokenUri(_tokenId, _newURI);
    emit MetadataUpgraded(oldURI, _newURI);
  }

  /**
  * @dev Changes the ipfs gateway
  * @param _gatewayURL is the http url for this ipfs gateway
  */
  function changeGateway(string calldata _gatewayURL) external onlyOwner {
    require(bytes(_gatewayURL).length > 0);
    gateway = _gatewayURL;
  }


  event MetadataUpgraded(string indexed _oldURI, string _newURI);
  event UpgradePathAdded(uint256 indexed _tokenID, string _newURI);

}

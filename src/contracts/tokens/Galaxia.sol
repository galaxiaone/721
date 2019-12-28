pragma solidity 0.5.6;

import "../tokens/nf-token-metadata.sol";
import "../ownership/ownable.sol";

/**
 * @dev This is an example contract implementation of NFToken with enumerable extension.
 */
contract Galaxia is
  NFTokenMetadata,
  Ownable
{
  mapping (bytes32 => bool) public validUpgrade;
  uint256 public totalSupply;
  bool private initialized;

  /**
  * @dev Initialize 721 parameters
  * @param _name A descriptive name for a collection of NFTs.
  * @param _symbol An abbreviated name for NFTokens.
  */
  function initialize(string memory _name, string memory _symbol)
  public {
    require(!initialized, "ALREADY INITIALIZED");
    initialized = true;
    nftName = _name;
    nftSymbol = _symbol;
    gateway = "https://cloudflare-ipfs.com/ipfs/";
    super.initializeOwner(msg.sender);
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
  * @dev Galaxia owner can add an optional upgrade path for token holder of _tokenId
  * @dev Owner of contract can give alternative metadata versions for users to upgrade to
  * @param _tokenId ID of this token
  * @param _newURI metadata hash for this token
  */
  function addUpgradePath(uint256 _tokenId, string calldata _newURI, uint8 _version) external onlyOwner {
    require(_tokenId < totalSupply);
    bytes32 upgradeHash = keccak256(abi.encodePacked(_tokenId, _newURI));
    validUpgrade[upgradeHash] = true;
    emit UpgradePathAdded(_tokenId, _newURI, _version);
  }

    /**
  * @dev Token holder can upgrade to one of the upgrade paths supplied by the Galaxia owner
  * @param _tokenId The ID of this token
  * @param _newURI The new metadata hash for this token
  */
  function upgradeMetadata(uint256 _tokenId, string calldata _newURI) external  {
    require(super.isOwner(_tokenId, msg.sender));
    bytes32 upgradeHash = keccak256(abi.encodePacked(_tokenId, _newURI));
    require(validUpgrade[upgradeHash]);
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
    emit GatewayChanged(gateway, _gatewayURL);
    gateway = _gatewayURL;
  }


  event MetadataUpgraded(string indexed _oldURI, string _newURI);
  event UpgradePathAdded(uint256 indexed _tokenID, string _newURI, uint8 _version);
  event GatewayChanged(string indexed _old, string _new);

}

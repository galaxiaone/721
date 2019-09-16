pragma solidity 0.5.6;

import "./nf-token.sol";
import "./erc721-metadata.sol";

/**
 * @dev Optional metadata implementation for ERC-721 non-fungible token standard.
 */
contract NFTokenMetadata is
  NFToken,
  ERC721Metadata
{

  /**
   * @dev A descriptive name for a collection of NFTs.
   */
  string internal nftName;

  /**
   * @dev The IPFS gateway which will serve the metadata
   */
  string internal gateway;

  /**
   * @dev An abbreviated name for NFTokens.
   */
  string internal nftSymbol;

  /**
   * @dev Mapping from NFT ID to metadata uri.
   */
  mapping (uint256 => string) internal _idToUri;

  /**
   * @dev Contract constructor.
   * @notice When implementing this contract don't forget to set nftName and nftSymbol.
   */
  constructor()
    public
  {
    supportedInterfaces[0x5b5e139f] = true; // ERC721Metadata
  }

  function idToUri(uint256 _tokenID)
  public
  view
  returns (string memory){
    return _idToUri[_tokenID];
  }

  /**
   * @dev Returns a descriptive name for a collection of NFTokens.
   * @return Representing name.
   */
  function name()
    external
    view
    returns (string memory _name)
  {
    _name = nftName;
  }

  /**
   * @dev Returns an abbreviated name for NFTokens.
   * @return Representing symbol.
   */
  function symbol()
    external
    view
    returns (string memory _symbol)
  {
    _symbol = nftSymbol;
  }

  /**
   * @dev Set a distinct URI (RFC 3986) for a given NFT ID.
   * @notice This is an internal function which should be called from user-implemented external
   * function. Its purpose is to show and properly initialize data structures when using this
   * implementation.
   * @param _tokenId Id for which we want uri.
   * @param _uri String representing RFC 3986 URI.
   */
  function _setTokenUri(
    uint256 _tokenId,
    string memory _uri
  )
    internal
    validNFToken(_tokenId)
  {
    _idToUri[_tokenId] = _uri;
  }

    /**
  * @dev A distinct URI (RFC 3986) for a given NFT.
  * @param _tokenId Id for which we want uri.
  * @return URI of _tokenId.
  */
  function tokenURI(
    uint256 _tokenId
  )
    external
    view
    validNFToken(_tokenId)
    returns (string memory)
  {
    return strConcat(baseTokenURI(), _idToUri[_tokenId]);
  }

  /**
  * @dev returns the current baseURI. Can either be IPFS gateway or Galaxia gateway
  */
  function baseTokenURI() public view returns (string memory) {
    return gateway;
  }

  /**
  * @dev returns the current baseURI. Can either be IPFS gateway or Galaxia gateway
  */
  function _setBaseURI(string memory _newBase)
  internal {
    gateway = _newBase;
  }

  function strConcat(string memory _a, string memory _b)
  internal
  pure
  returns (string memory) {
    bytes memory aa = bytes(_a);
    bytes memory bb = bytes(_b);
    string memory ab = new string(aa.length + bb.length);
    bytes memory bytes_ab = bytes(ab);
    uint k = 0;
    for (uint i = 0; i < aa.length; i++) bytes_ab[k++] = aa[i];
    for (uint i = 0; i < bb.length; i++) bytes_ab[k++] = bb[i];
    return string(bytes_ab);
  }
}

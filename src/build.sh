solidityFlattener.pl --contractsdir=contracts/tokens --mainsol=Galaxia.sol --outputsol=build/Galaxia.sol
solcjs -o build/abi --abi --bin build/Galaxia.sol
cd ./build && mv ./abi/build_Galaxia_sol_Galaxia.abi Galaxia.json && mv ./abi/build_Galaxia_sol_Galaxia.bin Galaxia.bin && rm -rf ./abi
# TODO: ethersjs doesnt like the bytecode output by solcJS
#  docker run ethereum/solc:stable -o build/abi --bin --abi --bin-runtime --optimize /build/Galaxia.sol
#  docker run -v /home/kyle/code/galaxia/721/src/build/:/sources ethereum/solc:0.5.6 -o /sources/output --optimize --combined-json bin,opcodes,srcmap /sources/Galaxia.sol


solidityFlattener.pl --contractsdir=contracts/tokens --mainsol=Galaxia.sol --outputsol=build/Galaxia.sol
solcjs -o build/abi --bin --abi --optimize build/Galaxia.sol
cd ./build && mv ./abi/build_Galaxia_sol_Galaxia.abi Galaxia.json && mv ./abi/build_Galaxia_sol_Galaxia.bin Galaxia.bin && rm -rf ./abi

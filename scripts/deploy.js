const { ethers } =  require("hardhat");

async function main() {

  // We get the contract to deploy
  const Campaign = await ethers.getContractFactory("Campaign");
  const campaign = await Campaign.deploy(5);

  await campaign.deployed();

  console.log("Contract deployed to: ", campaign.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

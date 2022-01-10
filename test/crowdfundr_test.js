const { expect } = require("chai");
const { ethers } = require("hardhat");
const { BigNumber } = ethers

describe("Crowdfundr contract", () => {
  let Campaign;
  let campaign;
  let accounts;

  beforeEach(async () => {
    accounts = await ethers.getSigners();
    Campaign = await ethers.getContractFactory("Campaign");
    campaign = await Campaign.deploy(1, accounts[0].address);
    await campaign.deployed()

  })

  it("should deploy a the campaign contract", async () => {
    expect(campaign).to.exist
  })

  it("should allow a user to contribute", async() => {
    await campaign.contribute({ value: ethers.utils.parseEther("1")})
    let result = BigNumber.from(await campaign.totalAmountContributed()).toString()
    let value = ethers.utils.formatEther(result)
    expect(value).to.eq('1.0');
  })

  xit('should revert if a user contributes less than .1 ether', async() => {
    await expect(campaign.contribute({value: ethers.utils.parseEther('.001')})).to.be.reverted
  })

  // cancel function
  it('should allow owner to cancel the campaign', async() => {
    await campaign.cancelCampaign()
    expect(await campaign.cancelled()).to.be.true
  })

  // withdraw function
  xit('should allow creator to withdraw funds', async() => {
    await campaign.connect(accounts[1]).contribute({value: ethers.utils.parseEther('1')})
    await campaign.withdraw(ethers.utils.parseEther('1'))
    await campaign.totalAmountContributed().to.eq()
  })

})
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { BigNumber } = ethers
var chai = require('chai');
const { solidity } = require("ethereum-waffle")
chai.use(solidity);

describe("Crowdfundr contract", () => {
  let Campaign;
  let campaign;
  let accounts;

  beforeEach(async () => {
    accounts = await ethers.getSigners();
    Campaign = await ethers.getContractFactory("Campaign");
    campaign = await Campaign.deploy(1, accounts[0].address); // owner is the first account
    await campaign.deployed()
  })

  it("should deploy a the campaign contract", async () => {
    expect(campaign).to.exist;
  })

  describe("contribute", () => {
    it("should allow a user to contribute", async() => {
      await campaign.connect(accounts[1]).contribute({ value: ethers.utils.parseEther("1")})
      let result = BigNumber.from(await campaign.totalAmountContributed()).toString();
      let value = ethers.utils.formatEther(result);
      expect(value).to.eq('1.0');
    })
  
    it('should revert if a user contributes less than .01 ether', async() => {
      await expect(campaign.connect(accounts[1]).contribute({value: ethers.utils.parseEther('.001')})).to.be.reverted;
    })
  
    it('should revert if a user tries to contribute after the campaign goal is reached', async() => {
      await campaign.connect(accounts[1]).contribute({value: ethers.utils.parseEther('2')}); // contribute 2 eth (past goal)
      await expect(campaign.connect(accounts[1]).contribute({value: ethers.utils.parseEther('1')})).to.be.reverted;
    })
  
    it('should mint a user 1 nft per 1 eth contributed', async() => {
      await campaign.connect(accounts[1]).contribute({value: ethers.utils.parseEther('2')});
      let nftBalance = BigNumber.from((await campaign.balanceOf(accounts[1].address))).toNumber();
      expect(nftBalance).to.eq(2)
    })

    it('should revert if a user tries to contribute after 30 days', async() => {
      // increase time by 31 days 
      await ethers.provider.send("evm_increaseTime", [86400 * 31])
      await ethers.provider.send("evm_mine")

      await expect(campaign.connect(accounts[1]).contribute({value: ethers.utils.parseEther('1')})).to.be.reverted;
    })
  })

  describe("withdraw", async() => {
    it('should allow creator to withdraw funds if goal is reached', async() => {
      await campaign.connect(accounts[1]).contribute({value: ethers.utils.parseEther('2')}); // goal is now reached
      await campaign.withdraw(2);
      let campaignBalance = BigNumber.from(await campaign.totalAmountContributed()).toNumber();
      expect(campaignBalance).to.eq(0);
    })
  })
  

  // cancel function
  it('should allow owner to cancel the campaign', async() => {
    await campaign.cancelCampaign()
    expect(await campaign.cancelled()).to.be.true
  })



})
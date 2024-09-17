import { expect } from "chai";
import { ethers } from "hardhat";
import { PaymentContract } from "../typechain-types/contracts/payment.sol/PaymentContract";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

// Mocking FHE functions for testing purposes
const FHE = {
    asEuint256: (value: any) => value,
    asEuint8: (value: any) => value
  };
describe("PaymentContract", function () {
  let paymentContract: PaymentContract;
  let owner: SignerWithAddress;
  let sender: SignerWithAddress;
  let receiver: SignerWithAddress;

  beforeEach(async function () {
    [owner, sender, receiver] = await ethers.getSigners();
  
    const PaymentContractFactory = await ethers.getContractFactory("PaymentContract");
    paymentContract = await PaymentContractFactory.deploy() as PaymentContract;
    await paymentContract.deployed(); // Wait for the contract to be deployed
  });

  it("Should create a payment", async function () {
    const amount = FHE.asEuint256(ethers.parseEther("1"));
    const payerName = [FHE.asEuint8(65), FHE.asEuint8(108), FHE.asEuint8(105), FHE.asEuint8(99), FHE.asEuint8(101)]; // "Alice"
    const receiverName = [FHE.asEuint8(66), FHE.asEuint8(111), FHE.asEuint8(98)]; // "Bob"
    const message = [FHE.asEuint8(72), FHE.asEuint8(101), FHE.asEuint8(108), FHE.asEuint8(108), FHE.asEuint8(111)]; // "Hello"

    await paymentContract.connect(sender).createPayment(
      receiver.address,
      amount,
      payerName,
      receiverName,
      message
    );

    expect(await paymentContract.paymentCounter()).to.equal(1);
  });

  it("Should add a chat message", async function () {
    // First, create a payment
    await paymentContract.connect(sender).createPayment(
      receiver.address,
      FHE.asEuint256(ethers.parseEther("1")),
      [FHE.asEuint8(65)], // "A"
      [FHE.asEuint8(66)], // "B"
      [FHE.asEuint8(67)]  // "C"
    );

    const chatMessage = [FHE.asEuint8(72), FHE.asEuint8(105)]; // "Hi"
    await paymentContract.connect(sender).addChatMessage(1, chatMessage);

    const chatHistory = await paymentContract.connect(sender).getEncryptedChatMessages(1);
    expect(chatHistory.length).to.equal(1);
  });

  it("Should get encrypted payment details", async function () {
    const amount = FHE.asEuint256(ethers.parseEther("1"));
    const payerName = [FHE.asEuint8(65)]; // "A"
    const receiverName = [FHE.asEuint8(66)]; // "B"
    const message = [FHE.asEuint8(67)]; // "C"

    await paymentContract.connect(sender).createPayment(
      receiver.address,
      amount,
      payerName,
      receiverName,
      message
    );

    const [encryptedAmount, encryptedPayerName, encryptedReceiverName, encryptedMessage] = 
      await paymentContract.connect(sender).getEncryptedPaymentDetails(1);

    expect(encryptedAmount).to.deep.equal(amount);
    expect(encryptedPayerName).to.deep.equal(payerName);
    expect(encryptedReceiverName).to.deep.equal(receiverName);
    expect(encryptedMessage).to.deep.equal(message);
  });

  it("Should revert when unauthorized user tries to access payment details", async function () {
    await paymentContract.connect(sender).createPayment(
      receiver.address,
      FHE.asEuint256(ethers.parseEther("1")),
      [FHE.asEuint8(65)], // "A"
      [FHE.asEuint8(66)], // "B"
      [FHE.asEuint8(67)]  // "C"
    );

    await expect(
      paymentContract.connect(owner).getEncryptedPaymentDetails(1)
    ).to.be.revertedWith("Unauthorized: Only sender or receiver can access payment details");
  });

  it("Should revert when unauthorized user tries to add chat message", async function () {
    await paymentContract.connect(sender).createPayment(
      receiver.address,
      FHE.asEuint256(ethers.parseEther("1")),
      [FHE.asEuint8(65)], // "A"
      [FHE.asEuint8(66)], // "B"
      [FHE.asEuint8(67)]  // "C"
    );

    await expect(
      paymentContract.connect(owner).addChatMessage(1, [FHE.asEuint8(72), FHE.asEuint8(105)]) // "Hi"
    ).to.be.revertedWith("Unauthorized: Only sender or receiver can add messages");
  });
});

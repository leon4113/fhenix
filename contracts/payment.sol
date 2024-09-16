// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@fhenixprotocol/contracts/FHE.sol";

contract PaymentContract {
    using FHE for *;

    struct Payment {
        address sender;
        address receiver;
        euint256 encryptedAmount;             // Encrypted payment amount
        euint8[] encryptedPayerName;          // Encrypted payer's name
        euint8[] encryptedReceiverName;       // Encrypted receiver's name
        euint8[] encryptedPaymentMessage;     // Encrypted payment message
        euint8[][] encryptedChatHistory;      // Encrypted chat messages
    }

    uint256 public paymentCounter;
    mapping(uint256 => Payment) private payments;

    // Create a new payment
    function createPayment(
        address _receiver,
        inEuint256 calldata _encryptedAmount,
        inEuint8[] calldata _encryptedPayerName,
        inEuint8[] calldata _encryptedReceiverName,
        inEuint8[] calldata _encryptedPaymentMessage
    ) external {
        paymentCounter++;
        payments[paymentCounter] = Payment({
            sender: msg.sender,
            receiver: _receiver,
            encryptedAmount: FHE.asEuint256(_encryptedAmount),
            encryptedPayerName: _copyEncryptedUint8Array(_encryptedPayerName),
            encryptedReceiverName: _copyEncryptedUint8Array(_encryptedReceiverName),
            encryptedPaymentMessage: _copyEncryptedUint8Array(_encryptedPaymentMessage),
            // Initialize chat history with an empty array
            encryptedChatHistory: new euint8[][](0)
            
        });
    }

    // Add an encrypted chat message to a payment
    function addChatMessage(
        uint256 _paymentId,
        inEuint8[] calldata _encryptedMessage
    ) external {
        Payment storage payment = payments[_paymentId];
        require(
            msg.sender == payment.sender || msg.sender == payment.receiver,
            "Unauthorized: Only sender or receiver can add messages"
        );

        payment.encryptedChatHistory.push(_copyEncryptedUint8Array(_encryptedMessage));
    }

    // Get encrypted payment details
    function getEncryptedPaymentDetails(uint256 _paymentId)
        external
        view
        returns (
            euint256,
            euint8[] memory,
            euint8[] memory,
            euint8[] memory
        )
    {
        Payment storage payment = payments[_paymentId];
        require(
            msg.sender == payment.sender || msg.sender == payment.receiver,
            "Unauthorized: Only sender or receiver can access payment details"
        );

        return (
            payment.encryptedAmount,
            payment.encryptedPayerName,
            payment.encryptedReceiverName,
            payment.encryptedPaymentMessage
        );
    }

    // Get encrypted chat messages
    function getEncryptedChatMessages(uint256 _paymentId)
        external
        view
        returns (euint8[][] memory)
    {
        Payment storage payment = payments[_paymentId];
        require(
            msg.sender == payment.sender || msg.sender == payment.receiver,
            "Unauthorized: Only sender or receiver can access chat messages"
        );

        return payment.encryptedChatHistory;
    }

    // Helper function to copy encrypted euint8[] arrays from calldata to memory
    function _copyEncryptedUint8Array(inEuint8[] calldata input)
        internal
        pure
        returns (euint8[] memory)
    {
        euint8[] memory output = new euint8[](input.length);
        for (uint256 i = 0; i < input.length; i++) {
            output[i] = FHE.asEuint8(input[i]);
        }
        return output;
    }
}
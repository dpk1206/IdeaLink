const express = require("express");
const router = express.Router();
const axios = require("axios");
const userModel = require("../models/userModel");

router.get("/success", async (req, res) => {
  const { paymentKey, orderId, amount, sellerId } = req.query;

  try {
    const response = await axios.post("https://api.tosspayments.com/v1/payments/confirm", {
      paymentKey,
      orderId,
      amount,
    }, {
      headers: {
        Authorization: `Basic ${Buffer.from("test_sk_ex6BJGQOVDxz7XWaqOJaVW4w2zNb:").toString("base64")}`,
        "Content-Type": "application/json"
      }
    });

    if (response.data.status === "DONE") {
      await userModel.addPointToUser(sellerId, Number(amount));
      await userModel.insertPointLog(sellerId, "charge", amount, "토스 포인트 충전");
      return res.redirect(`/users/mypage?user_id=${sellerId}`);
    } else {
      return res.redirect("/payment/fail");
    }
  } catch (err) {
    console.error("결제 승인 실패:");
    if (err.response) {
      console.error("📦 Toss 응답:", err.response.data);
    } else {
      console.error(err.message);
    }
    return res.redirect("/payment/fail");
  }
});

module.exports = router;

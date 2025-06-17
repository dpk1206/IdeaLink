const userModel = require("../models/userModel");

const ADMIN_ID = 1; // 관리자 ID 고정

// 일반 게시글 - 거래 요청 (구매자 → 관리자)
exports.holdEscrowForPost = async (buyer_id, amount, post_id) => {
  await userModel.deductPointFromUser(buyer_id, amount);
  await userModel.addPointToUser(ADMIN_ID, amount);
  await userModel.insertPointLog(buyer_id, 'hold_use', amount, `에스크로 보관 - post_id: ${post_id}`);
  await userModel.insertPointLog(ADMIN_ID, 'hold_charge', amount, `에스크로 입금 - post_id: ${post_id}`);
};

// 일반 게시글 - 거래 수락 (관리자 → 판매자)
exports.releaseEscrowForPost = async (seller_id, buyer_id, amount, post_id) => {
  await userModel.deductPointFromUser(ADMIN_ID, amount);
  await userModel.addPointToUser(seller_id, amount);
  await userModel.insertPointLog(ADMIN_ID, 'hold_release', amount, `에스크로 출금 - post_id: ${post_id}`);
  await userModel.insertPointLog(seller_id, 'charge', amount, `판매 수익 - post_id: ${post_id}`);
};


// 일반 게시글 - 거래 거절 (관리자 → 구매자)
exports.refundEscrowForPost = async (buyer_id, amount, post_id) => {
  await userModel.deductPointFromUser(ADMIN_ID, amount);
  await userModel.addPointToUser(buyer_id, amount);
  await userModel.insertPointLog(ADMIN_ID, 'hold_refund', amount, `에스크로 환불 - post_id: ${post_id}`);
  await userModel.insertPointLog(buyer_id, 'refund', amount, `거래 거절 환불 - post_id: ${post_id}`);
};

// 답글 거래 - 거래 요청 (구매자 → 관리자)
exports.holdEscrowForAnswer = async (buyer_id, amount, answer_id) => {
  await userModel.deductPointFromUser(buyer_id, amount);
  await userModel.addPointToUser(ADMIN_ID, amount);
  await userModel.insertPointLog(buyer_id, 'hold_use', amount, `에스크로 보관 - answer_id: ${answer_id}`);
  await userModel.insertPointLog(ADMIN_ID, 'hold_charge', amount, `에스크로 입금 - answer_id: ${answer_id}`);
};

// 답글 거래 - 거래 수락 (관리자 → 판매자)
exports.releaseEscrowForAnswer = async (seller_id, buyer_id, amount, answer_id) => {
  await userModel.deductPointFromUser(ADMIN_ID, amount);
  await userModel.addPointToUser(seller_id, amount);
  await userModel.insertPointLog(ADMIN_ID, 'hold_release', amount, `에스크로 출금 - answer_id: ${answer_id}`);
  await userModel.insertPointLog(seller_id, 'answer_charge', amount, `답글 판매 수익 - answer_id: ${answer_id}`);
};


// 답글 거래 - 거래 거절 (관리자 → 구매자)
exports.refundEscrowForAnswer = async (buyer_id, amount, answer_id) => {
  await userModel.deductPointFromUser(ADMIN_ID, amount);
  await userModel.addPointToUser(buyer_id, amount);
  await userModel.insertPointLog(ADMIN_ID, 'hold_refund', amount, `에스크로 환불 - answer_id: ${answer_id}`);
  await userModel.insertPointLog(buyer_id, 'refund', amount, `답글 거래 거절 환불 - answer_id: ${answer_id}`);
};


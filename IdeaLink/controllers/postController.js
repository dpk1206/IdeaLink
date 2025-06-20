const path = require("path");
const postModel = require("../models/postModel");
const postFileModel = require("../models/postFileModel");
const postlogModel = require("../models/postlogModel");
const bookmarkModel = require("../models/bookmarkModel");
const answerModel = require("../models/answerModel");
const commentModel = require("../models/commentModel");
const likeModel = require("../models/likeModel");
const userModel = require("../models/userModel"); 
const axios = require("axios");
const escrowService = require("../services/escrowService");

// 파일 유형 필터용 확장자 정의
const DOCUMENT_TYPES = [".pdf", ".doc", ".docx", ".hwp"];
const IMAGE_TYPES = [".png", ".jpg", ".jpeg", ".gif"];

// ✅ 게시글 등록 + 파일 저장 + 워터마크 처리
exports.createPost = async (req, res, next) => {
  const {
    user_id,
    title,
    summary,
    content,
    category_id,
    status,
    price,
  } = req.body;
  const parsedCategoryId = Array.isArray(category_id)
    ? category_id[0]
    : category_id;

  try {
    // 1. 게시글 저장
    const post_id = await postModel.insertPost({
      user_id,
      title,
      summary,
      content,
      category_id: parsedCategoryId,
      status,
      price,
    });

    console.log("리턴된 post_id:", post_id);

    // 2. 첨부파일 저장 및 워터마크 요청
    const files = req.files;
    if (files && files.length > 0) {
      const insertFileResult = await Promise.all(
        files.map((file) => postFileModel.insertFile(file, post_id, "post"))
      );

      const options = {
        method: "GET",
        url: "http://localhost:5000/watermark",
        data: { files },
        headers: { "Content-Type": "application/json" },
      };

      const result = await axios(options);
      const wmPathList = result.data.wm_path;

      // 3. 워터마크 경로 저장
      insertFileResult.forEach((result, index) => {
        const insertId = result.insertId;
        const wm_path = wmPathList[index];
        postFileModel.insertWaterMarkFile(insertId, wm_path);
      });
    }

    // 4. 게시글 등록 로그 기록
    const clientIp =
      req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    await postlogModel.createLog({
      post_id,
      user_id,
      post_log_event: "CREATE_POST",
      post_log_ip: clientIp,
    });

    // 5. 상세 페이지로 리다이렉트
    res.redirect(`/post/idea_detail?post_id=${post_id}`);
  } catch (err) {
    console.error("게시글 등록 오류:", err);
    res.status(500).send("게시글 등록 실패");
  }
};

// 게시글 상세조회 + 첨부파일 + 답글 + 조회수 증가
exports.ideaDetail = async (req, res, next) => {
  const post_id = req.query.post_id || req.param("post_id");
  console.log("ideaDetail() → 받은 post_id:", post_id);

  if (!post_id) return next(new Error("post_id가 없습니다."));

  try {
    // 1. 중복 조회 방지용 쿠키
    const cookieName = `viewed_${post_id},${req.user?.user_id}`;
    if (!req.cookies[cookieName]) {
      await postModel.increaseViewCount(post_id);
      res.cookie(cookieName, true, { maxAge: 1000 * 60 * 60 });
    }

    // 2. 게시글 및 첨부파일 조회
     const post = await postModel.selectOnePost(post_id, req.user?.user_type, req.user?.user_id);
    const files = await postFileModel.selectDetailFile(post_id, "post");

    if (!post) {
      const err = new Error("해당 게시글을 찾을 수 없습니다.");
      err.status = 404;
      return next(err);
    }

 // 3. 거래완료된 글 열람 권한 확인
  if (post.status === '거래완료') {
    const currentUserId = req.user?.user_id;
    const isAdmin = req.user?.user_type === 'admin'; // ✅ 관리자 여부 확인
    const isSeller = currentUserId === post.user_id;
    const isBuyer = await userModel.hasUserPurchased(currentUserId, post_id);
    const isAnswerOwner = currentUserId === post.selected_answer_user_id;

    if (!isAdmin && !isSeller && !isBuyer && !isAnswerOwner) {
      return res.status(403).render("access_denied", {
        message: "이 게시물은 거래가 완료되어 열람할 수 없습니다.",
      });
    }
  }

    // 4. 조회 로그 기록
    const clientIp = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    await postlogModel.createLog({
      post_id,
      user_id: req.user?.user_id || null,
      post_log_event: "VIEW_POST",
      post_log_ip: clientIp,
    });

    // 5. 답글 + 첨부파일 조회
    const answerInfo = await answerModel.selectAnswer(post_id);
    if (answerInfo && answerInfo.length > 0) {
      await Promise.all(
        answerInfo.map(async (answer) => {
          const answerFiles = await postFileModel.selectDetailFile(answer.answer_id, "answer");
          if (answerFiles?.length > 0) answer.files = answerFiles;
        })
      );
    }

    // 6. 유저 포인트 포함된 정보 병합
    let user = req.user;
    if (user) {
      const pointRow = await userModel.getUserPoint(user.user_id); // { point: 1234 }
      user = { ...user, ...pointRow };
    }

    post.answers = answerInfo || [];
    
    // 7. 최종 렌더링
    res.render("idea_detail", {
      postInfo: post,
      files: files.length > 0 ? files : null,
      answerInfo: answerInfo || null,
      bookmark: await bookmarkModel.isBookmarked(req.user?.user_id, post_id),
      user
    });
  } catch (err) {
    next(err);
  }
};



// ✅ 파일 다운로드 처리 (워터마크된 파일 기준)
exports.downloadFile = async (req, res, next) => {
  const file_id = req.params.file_id;
  const fileInfo = await postFileModel.selectOneFile(file_id);
  console.log("결과", fileInfo);

  if (!fileInfo) {
    return res.status(404).send("파일 정보를 찾을 수 없습니다.");
  }

  const { watermarked_path, original_name } = fileInfo;

  res.download(watermarked_path, original_name, (err) => {
    if (err) {
      res.status(404).send("파일을 찾을 수 없습니다.");
    }
  });
};

// ✅ 답글 등록 + 파일 첨부 + 워터마크 처리
exports.createAnswer = async (req, res, next) => {
  const { post_id, answer_user_id, title, content, price} = req.body;

  try {
    // 1. 답글 저장
    const answer_id = await answerModel.insertAnswer({
      post_id,
      answer_user_id,
      title,
      content,
      price
    });

    // 2. 파일 처리 + 워터마크
    const files = req.files;
    if (files && files.length > 0) {
      const insertFileResult = await Promise.all(
        files.map((file) => postFileModel.insertFile(file, answer_id, "answer"))
      );

      const options = {
        method: "GET",
        url: "http://localhost:5000/watermark",
        data: { files },
        headers: { "Content-Type": "application/json" },
      };

      const result = await axios(options);
      const wmPathList = result.data.wm_path;

      insertFileResult.forEach((result, index) => {
        const insertId = result.insertId;
        const wm_path = wmPathList[index];
        postFileModel.insertWaterMarkFile(insertId, wm_path);
      });
    }

    // 3. 로그 저장
    const clientIp =
      req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    await postlogModel.createLog({
      post_id,
      user_id: answer_user_id,
      post_log_event: "CREATE_ANSWER",
      post_log_ip: clientIp,
    });

    // 알림 생성 및 전송
    const sendNotification = req.app.get('sendNotification'); // 알림 전송 함수 가져옴
    const postInfo = await postModel.selectOnePost(post_id);
    await sendNotification(
      postInfo.user_id,
      req.user.user_id,
      "answer",
      post_id,
      title
    );
    
    // 4. 리다이렉트
    res.redirect(`/post/idea_detail?post_id=${post_id}`);
  } catch (err) {
    console.error("답글 등록 오류:", err);
    next(err);
  }
};

// ✅ 게시글 목록 조회 + 필터 처리
exports.getPost = async (req, res) => {
  try {
    // 1. 파라미터 추출
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const sub_id = req.query.sub_id ? parseInt(req.query.sub_id) : null;
    const main_id = req.query.main_id ? parseInt(req.query.main_id) : null;
    const file_filter = req.query.file_type || null;
    const status = req.query.status || null;
    const keyword = req.query.keyword || null;
    const search_type = req.query.search_type || null;
    const sort_type = req.query.sort || "recent";

    // 2. 파일 유형 분류
    let fileTypes = null;
    if (file_filter) {
      const splitTypes = file_filter.split(","); // 다중 선택 가능
      fileTypes = splitTypes.flatMap((type) => {
        if (type === "문서") return DOCUMENT_TYPES;
        if (type === "이미지") return IMAGE_TYPES;
        return [];
      });
    }

    // 3. 필터 구성
    const filter = {
      sub_id: Number.isInteger(sub_id) ? sub_id : null,
      main_id: Number.isInteger(main_id) ? main_id : null,
      fileTypes,
      status: status === "all" ? null : status,
      limit,
      offset,
      keyword,
      search_type,
      sort_type,
    };

    // 4. 데이터 조회
    const [posts, totalCount, mainCategoryMap, subCategoryMap] =
      await Promise.all([
        postModel.getFilteredPosts(filter),
        postModel.getFilteredPostCount(filter),
        postModel.getMainCategoryMap(),
        postModel.getSubCategoryMap(),
      ]);

    // 5. 페이지 렌더링
    const totalPages = Math.ceil(totalCount / limit);
    res.render("ideas", {
      posts,
      currentPage: page,
      totalPages,
      limit,
      mainCategoryMap: mainCategoryMap || {},
      subCategoryMap: subCategoryMap || {},
      selectedTransactionType: status || "all",
      status,
      searchType: req.query.search_type || "title",
      keyword: req.query.keyword || "",
      main_id,
      sub_id,
      file_type: file_filter,
      sort_type,
    });
  } catch (err) {
    console.error("Error occurred while fetching posts:", err);
    res.status(500).send("서버 오류");
  }
};

// 최근 게시글 N개 조회
exports.getRecentPosts = async (req, res) => {
  try {
    const recentPosts = await postModel.getRecentPosts(); // 최신순 5개 정도
    res.json(recentPosts);
  } catch (err) {
    console.error("최근 게시글 조회 실패:", err);
    res.status(500).send("서버 오류");
  }
};

// 인기 게시글 N개 조회
exports.getPopularPosts = async (req, res) => {
  try {
    const popularPosts = await postModel.getPopularPosts(); // 조회수 순 5개 정도
    res.json(popularPosts);
  } catch (err) {
    console.error("인기 게시글 조회 실패:", err);
    res.status(500).send("서버 오류");
  }
};

//추천
exports.likePost = async (req, res) => {
  const { post_id } = req.body;
  const user_id = req.user.user_id;

  const alreadyLiked = await likeModel.hasUserLiked(user_id, post_id);
  if (alreadyLiked) {
    return res.status(400).json({ error: "이미 추천하셨습니다." });
  }

  await likeModel.saveLike(user_id, post_id);
  const count = await likeModel.getLikeCount(post_id);

  res.json({ like_count: count });
};

//추천여부
exports.getLikeStatus = async (req, res) => {
  const { post_id } = req.query;
  const user_id = req.user.user_id;

  try {
    const liked = await likeModel.hasUserLiked(user_id, post_id);
    const likeCount = await likeModel.getLikeCount(post_id);

    res.json({ liked, like_count: likeCount });
  } catch (err) {
    console.error("좋아요 상태 확인 오류:", err);
    res.status(500).json({ error: "상태 확인 실패" });
  }
};

// 거래중 처리
exports.reservePost = async (req, res) => {
  const { post_id } = req.params;
  const { price, answer_id = null } = req.body;

  try {
    console.log("🔥 reservePost 진입");

    if (!req.user || !req.user.user_id) {
      return res.status(401).json({ success: false, message: "로그인이 필요합니다." });
    }

    const user_id = req.user.user_id;
    const targetPost = await postModel.selectOnePost(post_id);

    if (!targetPost) {
      return res.status(404).json({ success: false, message: "게시글이 존재하지 않습니다." });
    }

    console.log("🎯 거래 타입:", `"${targetPost.status}"`);

    if (targetPost.user_id === user_id) {
      return res.status(400).json({ success: false, message: "본인 게시글에 거래 요청할 수 없습니다." });
    }

    const type = targetPost.status.trim();
    if (type !== '판매' && type !== '구매') {
      return res.status(400).json({ success: false, message: "이미 거래중이거나 완료된 게시물입니다." });
    }

    if (type === '구매') {
      // 답글 거래 요청
      const answer = await answerModel.getAnswerById(answer_id);
      const seller_id = answer.user_id;

      await postModel.markAnswerPending(post_id, user_id, answer_id);

      await postModel.insertPurchaseRequest({
        post_id,
        answer_id,
        buyer_id: user_id,
        seller_id,
        proposed_price: price
      });

      await escrowService.holdEscrowForAnswer(user_id, price, answer_id);
    } else if (type === '판매') {
      // 일반 게시글 거래 요청
      await postModel.updatePostStatus(post_id, '거래중');
      await postModel.setBuyer(post_id, user_id);

      const seller_id = targetPost.user_id;
      await postModel.insertPurchaseRequest({
        post_id,
        answer_id: null,
        buyer_id: user_id,
        seller_id,
        proposed_price: price
      });

      await escrowService.holdEscrowForPost(user_id, price, post_id);
    }

    return res.json({ success: true, message: "거래 요청 완료" });
  } catch (err) {
    console.error("거래 요청 오류:", err);
    return res.status(500).json({ success: false, message: "서버 오류" });
  }
};


// 아이디어 구매 처리
exports.purchaseIdea = async (req, res) => {
  const { post_id } = req.params;
  const user_id = req.user.user_id;

  try {
    console.log("구매 요청:", { post_id, user_id });

    const post = await postModel.getPostPrice(post_id);
    if (!post) {
      console.log("게시물 없음");
      return res.status(404).json({ error: "해당 게시물이 없습니다." });
    }

    const seller_id = post.user_id;

    const user = await userModel.getUserPoint(user_id);
    if (!user) {
      console.log("유저 없음");
      return res.status(404).json({ error: "사용자 정보를 찾을 수 없습니다." });
    }

    if (user.point < post.price) {
      console.log("포인트 부족");
      return res.status(400).json({ error: "포인트가 부족합니다." });
    }

    console.log("포인트 차감 중...");
    await userModel.deductPointFromUser(user_id, post.price);

    console.log("구매자 포인트 로그 삽입 중...");
    await userModel.insertPointLog(user_id, "use", post.price, `아이디어 구매 - post_id: ${post_id}`);

    console.log("판매자 포인트 적립 중...");
    await userModel.addPointToUser(seller_id, post.price);

    console.log("판매자 포인트 로그 삽입 중...");
    await userModel.insertPointLog(seller_id, "charge", post.price, `아이디어 판매 - post_id: ${post_id}`);

    console.log("글 상태 '거래완료'로 변경 중...");
    await postModel.updatePostStatus(post_id, "거래완료");

    console.log("구매 완료");
    return res.json({ success: true });

  } catch (err) {
    console.error("구매 오류:", err);
    return res.status(500).json({ error: "서버 오류 발생" });
  }
};

// 판매자가 거래 수락 처리
exports.confirmPurchaseBySeller = async (req, res) => {
  const { post_id } = req.params;
  const seller_id = req.user.user_id;

  try {
    const post = await postModel.getPostPrice(post_id);
    if (!post) {
      return res.status(404).json({ success: false, message: "게시글이 존재하지 않습니다." });
    }

    if (post.user_id !== seller_id) {
      return res.status(403).json({ success: false, message: "판매자만 수락할 수 있습니다." });
    }

    if (post.status !== "거래중") {
      return res.status(400).json({ success: false, message: "현재 거래중 상태가 아닙니다." });
    }

    const buyer_id = post.buyer_id;
    const request = await postModel.getActivePurchaseRequest(post_id);
    if (!request) {
      return res.status(404).json({ success: false, message: "구매 요청 내역이 없습니다." });
    }

    const proposed_price = request.proposed_price;

    await escrowService.releaseEscrowForPost(seller_id, buyer_id, proposed_price, post_id);
    await postModel.updatePostStatus(post_id, "거래완료");
    await postModel.markRequestAccepted(post_id);

    return res.redirect(`/users/mypage?user_id=${seller_id}`);
  } catch (err) {
    console.error("거래 수락 오류:", err);
    return res.status(500).json({ success: false, message: "서버 오류" });
  }
};



// 답글 거래 요청 처리
exports.requestAnswerPurchase = async (req, res) => {
  console.log("🔥 [requestAnswerPurchase 진입]");
  console.log("🔥 req.body:", req.body);
  console.log("🔥 req.user:", req.user);

  const { post_id, answer_id, price } = req.body;
  const buyer_id = req.user?.user_id;

  try {
    const post = await postModel.selectOnePost(post_id);

    if (!post) return res.status(404).json({ success: false, message: "해당 게시글이 없습니다." });
    if (post.status.trim() !== '구매') return res.status(400).json({ success: false, message: "이미 거래 중인 게시글입니다." });
    if (post.user_id !== buyer_id) return res.status(403).json({ success: false, message: "본인이 작성한 구매글만 거래 요청할 수 있습니다." });

    console.log("✅ 조건 통과. markAnswerPending 호출 직전");
    await postModel.markAnswerPending(post_id, buyer_id, answer_id);
    console.log("✅ markAnswerPending 성공");

    // ✅ 판매자 ID 조회
    const answer = await answerModel.getAnswerById(answer_id);
    const seller_id = answer.user_id;

   // ✅ 거래요청 기록 추가
    await postModel.insertPurchaseRequest({
      post_id,
      answer_id,
      buyer_id,
      seller_id,
      proposed_price: price
    });

    // ✅ 에스크로 보관
    await escrowService.holdEscrowForAnswer(buyer_id, price, answer_id);

    res.json({ success: true, message: "거래 요청 성공" });
  } catch (err) {
    console.error("❌ 답글 거래 요청 오류:", err);
    res.status(500).json({ success: false, message: "거래 요청 처리 중 오류 발생" });
  }
};



// 답글 거래 수락 처리
exports.confirmAnswerPurchase = async (req, res) => {
  const { post_id, answer_id } = req.body;
  const seller_id = req.user.user_id;

  try {
    const answer = await answerModel.getAnswerById(answer_id);
    if (!answer || answer.user_id !== seller_id) {
      return res.status(403).send("본인 답변만 수락할 수 있습니다.");
    }

    const post = await postModel.selectOnePost(post_id);
    if (!post || post.status !== '거래중' || post.selected_answer_id != answer_id) {
      return res.status(400).send("유효하지 않은 거래 상태입니다.");
    }

    const purchase = await postModel.getPurchaseRequestByAnswerId(answer_id);
    if (!purchase) {
      return res.status(400).send("거래 요청 정보가 없습니다.");
    }

    const price = purchase.proposed_price;
    const buyer_id = purchase.buyer_id;

    await escrowService.releaseEscrowForAnswer(seller_id, buyer_id, price, answer_id);
    await postModel.markAnswerDealComplete(post_id);
    await postModel.markPurchaseRequestAccepted(answer_id);

    res.redirect(`/post/idea_detail?post_id=${post_id}`);
  } catch (err) {
    console.error("답글 거래 수락 오류:", err);
    res.status(500).send("서버 오류");
  }
};

// 거래 요청 처리 함수
exports.requestPurchase = async (req, res) => {
  const { post_id, answer_id } = req.body;
  const user_id = req.user?.user_id;

  if (!user_id || !post_id) {
    return res.status(400).json({ success: false, message: "요청 정보가 부족합니다." });
  }

  try {
    const post = await postModel.selectOnePost(post_id);

    if (!post) {
      return res.status(404).json({ success: false, message: "게시글을 찾을 수 없습니다." });
    }

    if (post.user_id === user_id) {
      return res.status(400).json({ success: false, message: "자기 자신에게 거래 요청할 수 없습니다." });
    }

    // 구매글이면 → 답변 거래 방식
    if (post.transaction_type === "구매" && answer_id) {
      await postModel.setReservationInfo(post_id, user_id, answer_id);
    }

    // 판매글이면 → 일반 거래 예약 방식
    else if (post.transaction_type === "판매") {
      await postModel.updatePostStatus(post_id, "거래중");
      await postModel.setBuyer(post_id, user_id);
    }

    return res.json({ success: true, message: "거래 요청이 완료되었습니다." });
  } catch (err) {
    console.error("거래 요청 오류:", err);
    return res.status(500).json({ success: false, message: "서버 오류" });
  }
};

// 판매자가 거래 거절 처리
exports.rejectPurchaseBySeller = async (req, res) => {
  const { post_id } = req.params;
  const seller_id = req.user.user_id;

  try {
    const post = await postModel.getPostPrice(post_id);

    if (!post) {
      return res.status(404).json({ success: false, message: "게시글이 존재하지 않습니다." });
    }

    if (post.user_id !== seller_id) {
      return res.status(403).json({ success: false, message: "판매자만 거절할 수 있습니다." });
    }

    if (post.status !== "거래중") {
      return res.status(400).json({ success: false, message: "현재 거래중 상태가 아닙니다." });
    }

    // ✅ 구매 요청 정보에서 정확한 금액 가져오기
    const purchase = await postModel.getActivePurchaseRequest(post_id); // 구매자가 요청한 금액
    if (!purchase || !purchase.buyer_id || !purchase.price) {
      return res.status(400).json({ success: false, message: "환불할 구매 요청 정보가 없습니다." });
    }

    const buyer_id = purchase.buyer_id;
    const amount = purchase.price;

    // ✅ 에스크로 환불 처리
    await escrowService.refundEscrowForPost(buyer_id, amount, post_id);

    // ✅ 상태 복원 처리
    await postModel.rejectPurchaseRequest(post_id);
    await postModel.updatePostStatus(post_id, "판매");
    await postModel.setBuyer(post_id, null);

    return res.redirect(`/users/mypage?user_id=${seller_id}`);
  } catch (err) {
    console.error("거래 거절 오류:", err);
    return res.status(500).json({ success: false, message: "서버 오류" });
  }
};


//  답글 거래 거절 처리
exports.rejectAnswerPurchase = async (req, res) => {
  const { post_id, answer_id } = req.body;
  const seller_id = req.user?.user_id;

  if (!seller_id || !post_id || !answer_id) {
    return res.status(400).json({ success: false, message: "필요한 정보가 없습니다." });
  }

  try {
    // 게시글과 거래 타입 확인
    const post = await postModel.selectOnePost(post_id);
    if (!post || post.transaction_type !== "구매") {
      return res.status(400).json({ success: false, message: "유효하지 않은 게시글입니다." });
    }

    // 답글 작성자(판매자) 본인 확인
    const answer = await postModel.getAnswerById(answer_id);
    if (!answer || answer.user_id !== seller_id) {
      return res.status(403).json({ success: false, message: "거래 거절 권한이 없습니다." });
    }

    // 구매 요청 정보 가져오기
    const purchase = await postModel.getPurchaseRequestByAnswerId(answer_id);
    if (!purchase || !purchase.buyer_id || !purchase.price) {
      return res.status(400).json({ success: false, message: "환불 정보가 없습니다." });
    }

    // ✅ 에스크로 환불 처리
    await escrowService.refundEscrowForAnswer(purchase.buyer_id, purchase.price, answer_id);

    // ✅ 거래 요청 삭제
    await postModel.cancelAnswerPurchase(post_id, answer_id);

    return res.redirect("/mypage");
  } catch (err) {
    console.error("거래 거절 처리 오류:", err);
    return res.status(500).json({ success: false, message: "서버 오류" });
  }
};
// 관리자 - 게시글 상태 변경 및 사유 기록
exports.changeStatus = async (req, res, next) => {
   console.log('📥 상태 변경 요청 body:', req.body); // 👈 이거 추가
  const { target_type, target_id, status, reason } = req.body;
  const admin_id = req.user.user_id;

  try {
    if (target_type === 'post') {
      await postModel.updatePostStatus(target_id, status);
    } else if (target_type === 'answer') {
      await postModel.updateAnswerModerationStatus(target_id, status);
    } else {
      return res.status(400).json({ success: false, message: '잘못된 대상 유형' });
    }

    await postModel.insertModerationLog({ target_type, target_id, status, reason, admin_id });

    res.json({ success: true, message: '상태 변경 및 로그 저장 완료' });
  } catch (err) {
    next(err);
  }
};

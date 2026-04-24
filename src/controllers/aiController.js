const asyncHandler = require("../utils/asyncHandler");
const { runRagPipeline } = require("../services/rag/pipeline");

const chatWithAI = asyncHandler(async (req, res) => {
  const { question, useRetrieval = true } = req.body;

  const result = await runRagPipeline({
    question,
    useRetrieval,
  });

  res.status(200).json({
    success: true,
    data: result,
  });
});

module.exports = {
  chatWithAI,
};

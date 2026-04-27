import { listAnswersByQuestion } from "../answers/answersApi";
import { listQuestions } from "../questions/questionsApi";
import { getId } from "../../utils/id";

export async function fetchRecentUserQuestions(userId) {
  const data = await listQuestions({
    page: 1,
    limit: 12,
    sortBy: "newest",
    askedBy: userId,
  });

  return data.items || [];
}

export async function fetchRecentUserAnswers(userId) {
  const latestQuestions = await listQuestions({
    page: 1,
    limit: 18,
    sortBy: "newest",
  });

  const questionItems = latestQuestions.items || [];

  const answerLists = await Promise.all(
    questionItems.map(async (question) => {
      try {
        const answers = await listAnswersByQuestion(question._id, {
          page: 1,
          limit: 20,
          sortBy: "newest",
        });

        return (answers.items || []).map((answer) => ({
          ...answer,
          questionId: question._id,
          questionTitle: question.title,
        }));
      } catch (_error) {
        return [];
      }
    })
  );

  return answerLists
    .flat()
    .filter((answer) => getId(answer.userId) === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8);
}

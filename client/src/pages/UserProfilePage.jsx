import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import ProfileSummary from "../components/profile/ProfileSummary";
import EmptyState from "../components/shared/EmptyState";
import { getUserProfile } from "../features/profile/profileApi";
import { fetchRecentUserAnswers, fetchRecentUserQuestions } from "../features/profile/profileQueries";

function UserProfilePage() {
  const { userId } = useParams();

  const profileQuery = useQuery({
    queryKey: ["profile", userId],
    queryFn: () => getUserProfile(userId),
    enabled: Boolean(userId),
  });

  const questionsQuery = useQuery({
    queryKey: ["profile", userId, "questions"],
    queryFn: () => fetchRecentUserQuestions(userId),
    enabled: Boolean(userId),
  });

  const answersQuery = useQuery({
    queryKey: ["profile", userId, "answers"],
    queryFn: () => fetchRecentUserAnswers(userId),
    enabled: Boolean(userId),
  });

  return (
    <AppShell title="User Profile" subtitle="Community member details">
      {profileQuery.isLoading ? <section className="content-panel"><p>Loading profile...</p></section> : null}

      {profileQuery.isError ? (
        <EmptyState
          title="Could not load profile"
          description={profileQuery.error?.message || "Please refresh and try again."}
          action={
            <button type="button" className="btn btn--primary" onClick={() => profileQuery.refetch()}>
              Retry
            </button>
          }
        />
      ) : null}

      {profileQuery.data ? (
        <ProfileSummary
          profile={profileQuery.data}
          questions={questionsQuery.data || []}
          answers={answersQuery.data || []}
          isLoadingQuestions={questionsQuery.isLoading}
          isLoadingAnswers={answersQuery.isLoading}
        />
      ) : null}
    </AppShell>
  );
}

export default UserProfilePage;

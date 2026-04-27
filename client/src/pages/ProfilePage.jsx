import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../features/auth/AuthContext";
import { getMyProfile } from "../features/profile/profileApi";
import { fetchRecentUserAnswers, fetchRecentUserQuestions } from "../features/profile/profileQueries";
import AppShell from "../components/layout/AppShell";
import ProfileSummary from "../components/profile/ProfileSummary";
import EmptyState from "../components/shared/EmptyState";

function ProfilePage() {
  const { user } = useAuth();

  const profileQuery = useQuery({
    queryKey: ["profile", "me"],
    queryFn: getMyProfile,
  });

  const questionsQuery = useQuery({
    queryKey: ["profile", "me", "questions", user?.id || user?._id],
    queryFn: () => fetchRecentUserQuestions(user?.id || user?._id),
    enabled: Boolean(user?.id || user?._id),
  });

  const answersQuery = useQuery({
    queryKey: ["profile", "me", "answers", user?.id || user?._id],
    queryFn: () => fetchRecentUserAnswers(user?.id || user?._id),
    enabled: Boolean(user?.id || user?._id),
  });

  return (
    <AppShell title="My Profile" subtitle="Your contributions and activity">
      {profileQuery.isLoading ? <section className="content-panel"><p>Loading profile...</p></section> : null}

      {profileQuery.isError ? (
        <EmptyState
          title="Could not load your profile"
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

export default ProfilePage;

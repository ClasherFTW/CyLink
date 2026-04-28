import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "../../features/auth/AuthContext";
import { ToastProvider } from "../../features/ui/ToastContext";
import { BookmarksProvider } from "../../features/bookmarks/BookmarksContext";
import { CitrusBotProvider } from "../../features/ai/CitrusBotContext";
import ToastViewport from "../../components/common/ToastViewport";
import CitrusBotPopup from "../../components/chatbot/CitrusBotPopup";

function AppProviders({ children }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 20 * 1000,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <BookmarksProvider>
            <CitrusBotProvider>
              {children}
              <ToastViewport />
              <CitrusBotPopup />
            </CitrusBotProvider>
          </BookmarksProvider>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default AppProviders;

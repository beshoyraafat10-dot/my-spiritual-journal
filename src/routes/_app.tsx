import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Shell, Centered, Spinner } from "@/components/Shell";

export const Route = createFileRoute("/_app")({
  ssr: false,
  component: AppLayout,
});

function AppLayout() {
  const { session, ready } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (ready && !session) navigate({ to: "/", replace: true });
  }, [ready, session, navigate]);
  if (!ready || !session) return <Centered><Spinner /></Centered>;
  return (
    <Shell>
      <Outlet />
    </Shell>
  );
}

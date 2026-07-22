import {
    AlertTriangle,
    RefreshCw,
    Home,
    ChevronLeft,
    Bug,
} from "lucide-react";

import {
    isRouteErrorResponse,
    useNavigate,
    useRouteError,
} from "react-router-dom";

export default function ErrorBoundary() {
    const error = useRouteError();
    const navigate = useNavigate();

    let title = "Something went wrong";
    let description = "An unexpected error occurred while rendering this page.";
    let details = "";
    let status: number | null = null;

    if (isRouteErrorResponse(error)) {
        status = error.status;
        title = `${error.status} ${error.statusText}`;
        description = typeof error.data === "string"
            ? error.data
            : "The requested page could not be loaded.";
    }
    else if (error instanceof Error) {
        title = error.name || "Application Error";
        description = error.message;
        details = error.stack || "";
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-6 py-10 text-[var(--text)]">
            <div className="w-full max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-[var(--surface)] shadow-2xl">
                <div className="relative overflow-hidden border-b border-white/10 bg-gradient-to-br from-red-500/20 via-orange-500/10 to-transparent px-8 py-10">
                    <div className="absolute inset-0 opacity-30 blur-3xl">
                        <div className="h-40 w-40 rounded-full bg-red-500/30" />
                    </div>

                    <div className="relative flex items-start gap-5">
                        <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-red-300">
                            <AlertTriangle size={34} />
                        </div>

                        <div className="flex-1">
                            {status && (
                                <div className="mb-2 inline-flex rounded-full border border-red-400/20 bg-red-500/10 px-3 py-1 text-xs font-medium tracking-wide text-red-300">
                                    STATUS {status}
                                </div>
                            )}

                            <h1 className="text-3xl font-bold tracking-tight">
                                {title}
                            </h1>

                            <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted)]">
                                {description}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-6 p-8">
                    <div className="grid gap-4 sm:grid-cols-3">
                        <button
                            onClick={() => window.location.reload()}
                            className="flex items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] px-5 py-3 text-sm font-medium text-white transition hover:scale-[1.01] hover:opacity-95"
                        >
                            <RefreshCw size={16} />
                            Reload App
                        </button>

                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-medium transition hover:bg-white/[0.06]"
                        >
                            <ChevronLeft size={16} />
                            Go Back
                        </button>

                        <button
                            onClick={() => navigate("/app/dashboard")}
                            className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-medium transition hover:bg-white/[0.06]"
                        >
                            <Home size={16} />
                            Dashboard
                        </button>
                    </div>

                    {details && (
                        <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                            <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3 text-sm font-medium text-[var(--muted)]">
                                <Bug size={16} />
                                Developer Stack Trace
                            </div>

                            <pre className="max-h-[420px] overflow-auto p-4 text-xs leading-6 text-red-200">
                                {details}
                            </pre>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
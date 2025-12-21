// src/services/cricketDataApi.js

const API_BASE =
    import.meta?.env?.VITE_BACKEND_URL || "http://localhost:4000";

export async function searchRemotePlayers(query) {
    if (!query || !query.trim()) {
        return { players: [], error: null, reason: null, info: null };
    }

    try {
        const res = await fetch(
            `${API_BASE}/api/players/search?query=${encodeURIComponent(
                query.trim()
            )}`
        );

        const json = await res.json();

        // Backend telling us live API is down / blocked / misconfigured
        if (json.error) {
            console.warn(
                "%c[CRICSIM LIVE API WARNING]",
                "background: #fbbf24; color: black; font-weight: bold;",
                json.error,
                json.reason || ""
            );

            if (json.info) {
                console.warn("▶ Info:", json.info);
            }

            return {
                players: [],
                error: json.error,
                reason: json.reason || null,
                info: json.info || null,
            };
        }

        // Normal case
        return {
            players: json.players || [],
            error: null,
            reason: null,
            info: null,
        };
    } catch (err) {
        console.warn(
            "%c[CRICSIM LIVE API ERROR]",
            "background: red; color: white; font-weight: bold;",
            err.message
        );

        return {
            players: [],
            error: "Network or server error",
            reason: err.message,
            info: null,
        };
    }
}

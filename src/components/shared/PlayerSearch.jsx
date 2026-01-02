import React, { useEffect, useRef, useState } from "react";
import { Search } from "./Icons";
import PlayerCard from "./PlayerCard";
import { MOCK_DB } from "../../data/mockDb";
import rawIplData from "../../data/iplData.json";
import { processIPLData } from "../../data/cricketProcessing";

const API_BASE = "http://localhost:4000"; // your Express backend

const PlayerSearch = ({ activeTeam, onAddPlayer }) => {
    const [localPlayers, setLocalPlayers] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);

    const [remoteStatus, setRemoteStatus] = useState("idle"); // idle | loading | ok | blocked | error
    const [remoteMessage, setRemoteMessage] = useState("");

    const fileInputRef = useRef(null);

    // --------- INIT LOCAL DB (MOCK_DB + iplData.json) ---------
    useEffect(() => {
        const base = Array.isArray(MOCK_DB) ? [...MOCK_DB] : [];

        let iplPlayers = [];
        try {
            if (
                rawIplData &&
                typeof rawIplData === "object" &&
                !Array.isArray(rawIplData)
            ) {
                const processed = processIPLData(rawIplData);
                if (Array.isArray(processed)) {
                    iplPlayers = processed;
                }
            }
        } catch (err) {
            console.error("Failed to process IPL data in PlayerSearch:", err);
        }

        const merged = [...iplPlayers, ...base];
        const seen = new Set();
        const deduped = merged.filter((p) => {
            if (!p || !p.name) return false;
            const key = p.name.toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });

        setLocalPlayers(deduped);
        setSearchResults(deduped);
    }, []);

    // --------- LOCAL FILTER + REMOTE SEARCH ---------
    useEffect(() => {
        const base = Array.isArray(localPlayers) ? localPlayers : [];

        // Always show at least local filtered result
        if (!searchQuery.trim()) {
            setSearchResults(base);
            setRemoteStatus("idle");
            setRemoteMessage("");
            return;
        }

        const q = searchQuery.trim().toLowerCase();
        const localFiltered = base.filter((p) =>
            p.name.toLowerCase().includes(q)
        );
        setSearchResults(localFiltered);
        setRemoteStatus("idle");
        setRemoteMessage("");

        // Then try hitting the backend /api/players/search
        // Debounce a bit so it doesn't spam the API
        const controller = new AbortController();
        const timer = setTimeout(async () => {
            setRemoteStatus("loading");
            try {
                const url = `${API_BASE}/api/players/search?query=${encodeURIComponent(
                    searchQuery.trim()
                )}`;

                const res = await fetch(url, {
                    signal: controller.signal,
                });

                let data;
                try {
                    data = await res.json();
                } catch {
                    data = null;
                }

                if (!res.ok) {
                    // Handle "blocked" from CricketData via backend
                    const reason =
                        data?.reason ||
                        data?.details?.reason ||
                        data?.error ||
                        "";
                    const info = data?.info || data?.details?.info || null;

                    if (
                        typeof reason === "string" &&
                        reason.toLowerCase().includes("hits limit")
                    ) {
                        setRemoteStatus("blocked");
                        setRemoteMessage("API hits limit reached – using local DB only.");
                    } else if (
                        typeof reason === "string" &&
                        reason.toLowerCase().includes("blocked")
                    ) {
                        setRemoteStatus("blocked");
                        setRemoteMessage("API temporarily blocked – using local DB only.");
                    } else {
                        setRemoteStatus("error");
                        setRemoteMessage("API error – showing local data.");
                    }

                    // Do not override local results on error
                    return;
                }

                // Normalize remote data = [ { id, name, ... } ]
                let remoteRaw = [];
                if (Array.isArray(data)) {
                    remoteRaw = data;
                } else if (Array.isArray(data?.players)) {
                    remoteRaw = data.players;
                } else if (Array.isArray(data?.data)) {
                    remoteRaw = data.data;
                }

                const normalizedRemote = remoteRaw
                    .map((p, index) => {
                        const name =
                            p.name ||
                            p.fullName ||
                            p.playerName ||
                            p.title ||
                            `Player ${index + 1}`;
                        const role =
                            p.role ||
                            p.playingRole ||
                            p.position ||
                            "All";

                        // If API doesn't give detailed stats, use safe defaults
                        return {
                            id: p.id || p.playerId || p.pid || `remote-${index}-${name}`,
                            name,
                            role,
                            avg: p.battingAverage ?? 30,
                            sr: p.strikeRate ?? 130,
                            bowlAvg: p.bowlingAverage ?? 30,
                            bowlEcon: p.economyRate ?? 8,
                            __source: "api",
                        };
                    })
                    .filter((p) => !!p.name);

                // Merge remote into localFiltered, dedupe by name
                const seenNames = new Set(
                    localFiltered.map((p) => p.name.toLowerCase())
                );
                const mergedResults = [
                    ...localFiltered,
                    ...normalizedRemote.filter((p) => {
                        const key = p.name.toLowerCase();
                        if (seenNames.has(key)) return false;
                        seenNames.add(key);
                        return true;
                    }),
                ];

                setSearchResults(mergedResults);
                setRemoteStatus("ok");
                setRemoteMessage(
                    normalizedRemote.length
                        ? "Live API results added."
                        : "No extra API matches."
                );
            } catch (err) {
                if (err.name === "AbortError") return; // ignore aborted
                console.error("Remote player search failed:", err);
                setRemoteStatus("error");
                setRemoteMessage("API error – showing local data.");
                // Keep localFiltered as-is
            }
        }, 300);

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [searchQuery, localPlayers]);

    // --------- JSON IMPORT (extra local datasets, optional) ---------
    const handleJsonImport = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const raw = JSON.parse(e.target.result);
                let newPlayers = [];

                if (raw && typeof raw === "object" && !Array.isArray(raw)) {
                    // IPL-style object
                    try {
                        newPlayers = processIPLData(raw) || [];
                    } catch (err) {
                        console.error("processIPLData failed:", err);
                        alert(
                            "Could not process IPL JSON format, keeping existing players."
                        );
                    }
                } else if (Array.isArray(raw)) {
                    newPlayers = raw.map((p) => ({
                        id: p.id || Math.random().toString(36).slice(2),
                        name: p.name || "Unknown",
                        role: p.role || "All",
                        avg: p.avg ?? 20,
                        sr: p.sr ?? 120,
                        bowlAvg: p.bowlAvg ?? 40,
                        bowlEcon: p.bowlEcon ?? 8.5,
                    }));
                }

                if (!Array.isArray(newPlayers)) newPlayers = [];
                if (newPlayers.length === 0) {
                    alert("No valid players found in the JSON.");
                    return;
                }

                const merged = [...newPlayers, ...localPlayers];
                const seen = new Set();
                const deduped = merged.filter((p) => {
                    if (!p?.name) return false;
                    const key = p.name.toLowerCase();
                    if (seen.has(key)) return false;
                    seen.add(key);
                    return true;
                });

                setLocalPlayers(deduped);

                const q = searchQuery.trim().toLowerCase();
                if (!q) {
                    setSearchResults(deduped);
                } else {
                    setSearchResults(
                        deduped.filter((p) =>
                            p.name.toLowerCase().includes(q)
                        )
                    );
                }

                alert(
                    `Successfully imported ${newPlayers.length} players into the local database.`
                );
            } catch (err) {
                console.error("JSON parse error:", err);
                alert("Error parsing JSON file.");
            }
        };

        reader.readAsText(file);
        event.target.value = "";
    };

    const handleAddClick = (player) => {
        if (!onAddPlayer) return;
        onAddPlayer(player);
    };

    const totalPlayers = Array.isArray(localPlayers)
        ? localPlayers.length
        : 0;

    const resultsToShow = Array.isArray(searchResults)
        ? searchResults
        : [];

    // Small status pill based on remoteStatus
    const renderApiStatus = () => {
        if (remoteStatus === "loading") {
            return (
                <span className="ml-3 text-[10px] text-sky-400 bg-sky-900/40 border border-sky-500/40 px-2 py-1 rounded-full uppercase tracking-wider">
          Live API…
        </span>
            );
        }
        if (remoteStatus === "ok") {
            return (
                <span className="ml-3 text-[10px] text-emerald-300 bg-emerald-900/40 border border-emerald-500/40 px-2 py-1 rounded-full uppercase tracking-wider">
          API ✓
        </span>
            );
        }
        if (remoteStatus === "blocked") {
            return (
                <span className="ml-3 text-[10px] text-amber-300 bg-amber-900/40 border border-amber-500/40 px-2 py-1 rounded-full uppercase tracking-wider">
          API Blocked
        </span>
            );
        }
        if (remoteStatus === "error") {
            return (
                <span className="ml-3 text-[10px] text-red-300 bg-red-900/40 border border-red-500/40 px-2 py-1 rounded-full uppercase tracking-wider">
          API Error
        </span>
            );
        }
        return null;
    };

    return (
        <div className="h-full flex flex-col glass-panel rounded-3xl p-1 overflow-hidden">
            <div className="flex flex-col h-full bg-slate-950/40 rounded-[20px] overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex justify-between items-center flex-shrink-0">
                    <div>
                        <h3 className="font-broadcast text-4xl text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
                            Auction Pool
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-slate-400 uppercase tracking-widest mt-1">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            Local + Live Search • {totalPlayers} Base Players
                            {activeTeam && (
                                <span className="ml-3 text-[10px] text-slate-500">
                  Active team:{" "}
                                    <span className="text-slate-300 font-semibold">
                    {activeTeam}
                  </span>
                </span>
                            )}
                            {renderApiStatus()}
                        </div>
                        {remoteMessage && (
                            <div className="text-[10px] text-slate-500 mt-1">
                                {remoteMessage}
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3">
                        {/* Search box */}
                        <div className="relative group">
                            <Search
                                className="absolute left-4 top-3.5 text-slate-500 group-focus-within:text-brand-gold transition-colors"
                                size={18}
                            />
                            <input
                                className="bg-black/30 border border-white/10 rounded-full py-3 pl-12 pr-6 text-sm w-64 text-white focus:outline-none focus:border-brand-gold transition-all placeholder-slate-600"
                                placeholder="Search Player..."
                                value={searchQuery}
                                onChange={(e) =>
                                    setSearchQuery(e.target.value)
                                }
                            />
                        </div>

                        {/* JSON import */}
                        <input
                            type="file"
                            accept=".json"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleJsonImport}
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-slate-800 hover:bg-slate-700 text-brand-gold px-6 rounded-full border border-slate-700 hover:border-brand-gold/30 transition-all text-xs font-bold uppercase tracking-wider"
                        >
                            Import JSON
                        </button>
                    </div>
                </div>

                {/* Player list - this scrolls */}
                <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
                    <div className="p-6 grid grid-cols-1 xl:grid-cols-2 gap-4">
                        {resultsToShow.length === 0 ? (
                            <div className="col-span-full text-slate-500 text-sm italic">
                                No players match the search. Try a different name
                                or import more data.
                            </div>
                        ) : (
                            resultsToShow.map((p) => (
                                <PlayerCard
                                    key={p.id}
                                    player={p}
                                    onAdd={handleAddClick}
                                />
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlayerSearch;

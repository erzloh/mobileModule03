import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as Network from "expo-network";
import type { SelectedLocation } from "@/context/SearchContext";
import {
  fetchGeocodingSuggestions,
  type OpenMeteoGeocodingResult,
} from "@/lib/openMeteo";

const GEO_BUTTON_SIZE = 36;
const SEARCH_CONTAINER_HEIGHT = 38;
const SUGGESTIONS_TOP_OFFSET = 4;
const SUGGESTIONS_TOP = SEARCH_CONTAINER_HEIGHT + SUGGESTIONS_TOP_OFFSET;
const SUGGESTIONS_LIMIT = 5;
const MIN_QUERY_LENGTH = 2;
const SUGGESTIONS_DEBOUNCE_MS = 250;

type TopBarProps = {
  searchText: string;
  setSearchText: (value: string) => void;
  setSelectedLocation: (value: SelectedLocation | null) => void;
  setLocationMessage: (value: string | null) => void;
  onGeoPress: () => void;
  isGeoLoading: boolean;
};

function formatSuggestionLabel(result: OpenMeteoGeocodingResult) {
  const parts = [result.name, result.admin1, result.country].filter(
    (value): value is string => Boolean(value),
  );
  return parts.join(", ");
}

function buildSuggestionParts(result: OpenMeteoGeocodingResult) {
  const tailParts = [result.admin1, result.country].filter(
    (value): value is string => Boolean(value),
  );
  return {
    name: result.name,
    tail: tailParts.join(", "),
  };
}

export default function TopBar({
  searchText,
  setSearchText,
  setSelectedLocation,
  setLocationMessage,
  onGeoPress,
  isGeoLoading,
}: TopBarProps) {
  const [isSuggestionsVisible, setIsSuggestionsVisible] = useState(false);
  const [suggestions, setSuggestions] = useState<OpenMeteoGeocodingResult[]>([]);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
  const pendingSubmitQueryRef = useRef<string | null>(null);

  useEffect(() => {
    const subscription = Keyboard.addListener("keyboardDidHide", () => {
      setIsSuggestionsVisible(false);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    const query = searchText.trim();

    if (query.length < MIN_QUERY_LENGTH) {
      setSuggestions([]);
      setIsSuggestionsLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(async () => {
      setIsSuggestionsLoading(true);
      try {
        const results = await fetchGeocodingSuggestions(query, SUGGESTIONS_LIMIT, controller.signal);
        setSuggestions(results);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
        setSuggestions([]);
      } finally {
        setIsSuggestionsLoading(false);
      }
    }, SUGGESTIONS_DEBOUNCE_MS);

    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [searchText]);

  const selectSuggestion = (result: OpenMeteoGeocodingResult) => {
    const location: SelectedLocation = {
      city: result.name,
      region: result.admin1 ?? "Unknown region",
      country: result.country ?? "Unknown country",
      latitude: result.latitude,
      longitude: result.longitude,
    };
    setSelectedLocation(location);
    setLocationMessage(null);
    setSearchText("");
    setIsSuggestionsVisible(false);
    Keyboard.dismiss();
  };

  const normalizeQuery = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");

  const runSubmitSearch = async (rawQuery: string) => {
    const query = rawQuery.trim();
    if (query.length === 0) {
      return;
    }

    const controller = new AbortController();
    setIsSuggestionsVisible(false);

    try {
      const results = await fetchGeocodingSuggestions(query, 10, controller.signal);
      const normalizedQuery = normalizeQuery(query);
      const exactMatch = results.find((result) => {
        const name = normalizeQuery(result.name);
        const region = normalizeQuery(result.admin1 ?? "");
        const country = normalizeQuery(result.country ?? "");
        const full = normalizeQuery(`${result.name}, ${result.admin1 ?? ""}, ${result.country ?? ""}`);
        return (
          name === normalizedQuery ||
          region === normalizedQuery ||
          country === normalizedQuery ||
          full === normalizedQuery
        );
      });

      if (!exactMatch) {
        setSelectedLocation(null);
        setLocationMessage("Couldn't find any result.");
        return;
      }

      selectSuggestion(exactMatch);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }
      setSelectedLocation(null);
      setLocationMessage(
        "The service connection is lost, please check your internet connection or try again later",
      );
      pendingSubmitQueryRef.current = query;
    } finally {
      controller.abort();
    }
  };

  const handleSubmitSearch = async () => {
    setIsSuggestionsVisible(false);
    await runSubmitSearch(searchText);
  };

  useEffect(() => {
    const subscription = Network.addNetworkStateListener((state: Network.NetworkState) => {
      if (!pendingSubmitQueryRef.current) {
        return;
      }
      if (state.isConnected && state.isInternetReachable) {
        const pendingQuery = pendingSubmitQueryRef.current;
        pendingSubmitQueryRef.current = null;
        void runSubmitSearch(pendingQuery);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <View style={styles.topBar}>
      <View style={styles.searchArea}>
        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={18} color="#64748b" />
          <TextInput
            placeholder="Search location"
            placeholderTextColor="#94a3b8"
            style={styles.searchInput}
            value={searchText}
            onChangeText={(value) => {
              setSearchText(value);
              setIsSuggestionsVisible(value.trim().length > 0);
            }}
            onFocus={() => setIsSuggestionsVisible(searchText.trim().length > 0)}
            onSubmitEditing={handleSubmitSearch}
          />
        </View>
        {isSuggestionsVisible && (isSuggestionsLoading || suggestions.length > 0) ? (
          <View style={styles.suggestionsContainer}>
            {isSuggestionsLoading ? (
              <View style={styles.loadingItem}>
                <ActivityIndicator size="small" color="#64748b" />
                <Text style={styles.loadingText}>Loading suggestions...</Text>
              </View>
            ) : (
              suggestions.map((result) => (
                <Pressable
                  key={`${result.id}-${result.name}`}
                  style={styles.suggestionItem}
                  onPress={() => selectSuggestion(result)}
                >
                  {(() => {
                    const parts = buildSuggestionParts(result);
                    return (
                      <Text style={styles.suggestionText}>
                        <Text style={styles.suggestionCity}>{parts.name}</Text>
                        {parts.tail ? `, ${parts.tail}` : ""}
                      </Text>
                    );
                  })()}
                </Pressable>
              ))
            )}
          </View>
        ) : null}
      </View>
      <Pressable style={styles.geoButton} onPress={onGeoPress} disabled={isGeoLoading}>
        {isGeoLoading ? (
          <ActivityIndicator size="small" color="#0f172a" />
        ) : (
          <MaterialCommunityIcons name="crosshairs-gps" size={20} color="#0f172a" />
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
  },
  searchArea: {
    flex: 1,
    position: "relative",
  },
  searchContainer: {
    height: SEARCH_CONTAINER_HEIGHT,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  searchInput: {
    marginLeft: 8,
    flex: 1,
    color: "#0f172a",
    fontSize: 14,
  },
  suggestionsContainer: {
    position: "absolute",
    top: SUGGESTIONS_TOP,
    left: 0,
    right: 0,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    overflow: "hidden",
    zIndex: 10,
  },
  suggestionItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e2e8f0",
  },
  suggestionText: {
    color: "#0f172a",
    fontSize: 14,
  },
  suggestionCity: {
    fontWeight: "600",
  },
  loadingItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  loadingText: {
    color: "#64748b",
    fontSize: 13,
  },
  geoButton: {
    marginLeft: 12,
    width: GEO_BUTTON_SIZE,
    height: GEO_BUTTON_SIZE,
    borderRadius: GEO_BUTTON_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e2e8f0",
  },
});

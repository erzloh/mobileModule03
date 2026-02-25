import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import * as Location from "expo-location";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import TopBar from "@/components/TopBar";
import { SearchProvider, type SelectedLocation } from "@/context/SearchContext";

const HEADER_CONTAINER_VERTICAL_PADDING = 8;

export default function RootLayout() {
  const insets = useSafeAreaInsets();
  const [searchText, setSearchText] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null);
  const [locationMessage, setLocationMessage] = useState<string | null>(null);
  const [isGeoLoading, setIsGeoLoading] = useState(false);

  const recordCurrentPosition = async () => {
    setIsGeoLoading(true);
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== "granted") {
      setSelectedLocation(null);
      setLocationMessage("Location permission denied. Please allow location access.");
      setIsGeoLoading(false);
      return;
    }

    try {
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const [reverseResult] = await Location.reverseGeocodeAsync({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      const location: SelectedLocation = {
        city: reverseResult?.city ?? "Current location",
        region: reverseResult?.region ?? "Unknown region",
        country: reverseResult?.country ?? "Unknown country",
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      setSelectedLocation(location);
      setLocationMessage(null);
      setSearchText("");
    } catch {
      setSelectedLocation(null);
      setLocationMessage("Unable to get your location.");
    } finally {
      setIsGeoLoading(false);
    }
  };

  useEffect(() => {
    void recordCurrentPosition();
  }, []);

  return (
    <SearchProvider
      value={{
        searchText,
        setSearchText,
        selectedLocation,
        setSelectedLocation,
        locationMessage,
        setLocationMessage,
      }}
    >
      <>
        <StatusBar style="dark" />
        <Stack>
          <Stack.Screen
            name="(tabs)"
            options={{
              header: () => (
                <View
                  style={[
                    styles.headerContainer,
                    { paddingTop: insets.top + HEADER_CONTAINER_VERTICAL_PADDING },
                  ]}
                >
                  <TopBar
                    searchText={searchText}
                    setSearchText={setSearchText}
                    setSelectedLocation={setSelectedLocation}
                    setLocationMessage={setLocationMessage}
                    onGeoPress={recordCurrentPosition}
                    isGeoLoading={isGeoLoading}
                  />
                </View>
              ),
            }}
          />
        </Stack>
      </>
    </SearchProvider>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingBottom: HEADER_CONTAINER_VERTICAL_PADDING,
  },
});

import { withLayoutContext } from "expo-router";
import {
  createMaterialTopTabNavigator,
  MaterialTopTabBar,
} from "@react-navigation/material-top-tabs";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { Navigator } = createMaterialTopTabNavigator();
const MaterialTopTabs = withLayoutContext(Navigator);

const TAB_BAR_HEIGHT = 62;
const TAB_ICON_SIZE = 22;
type TabIconProps = { color: string };

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.background}>
      <ExpoImage
        source={require("../../../assets/images/background2.svg")}
        style={styles.backgroundImage}
        contentFit="cover"
      />
      <MaterialTopTabs
        screenOptions={{
          swipeEnabled: true,
          tabBarShowIcon: true,
          tabBarIndicatorStyle: { height: 0 },
          sceneStyle: {
            paddingBottom: TAB_BAR_HEIGHT + insets.bottom,
            backgroundColor: "transparent",
          },
          tabBarStyle: {
            height: TAB_BAR_HEIGHT + insets.bottom,
            paddingBottom: insets.bottom,
          },
        }}
        tabBar={(props) => (
          <View style={styles.tabBarContainer}>
            <MaterialTopTabBar {...props} />
          </View>
        )}
      >
        <MaterialTopTabs.Screen
          name="currently"
          options={{
            title: "Currently",
            tabBarIcon: ({ color }: TabIconProps) => (
              <MaterialCommunityIcons
                name="weather-partly-cloudy"
                color={color}
                size={TAB_ICON_SIZE}
              />
            ),
          }}
        />
        <MaterialTopTabs.Screen
          name="today"
          options={{
            title: "Today",
            tabBarIcon: ({ color }: TabIconProps) => (
              <MaterialCommunityIcons
                name="calendar-today"
                color={color}
                size={TAB_ICON_SIZE}
              />
            ),
          }}
        />
        <MaterialTopTabs.Screen
          name="weekly"
          options={{
            title: "Weekly",
            tabBarIcon: ({ color }: TabIconProps) => (
              <MaterialCommunityIcons
                name="calendar-week"
                color={color}
                size={TAB_ICON_SIZE}
              />
            ),
          }}
        />
      </MaterialTopTabs>
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
  },
  tabBarContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
});

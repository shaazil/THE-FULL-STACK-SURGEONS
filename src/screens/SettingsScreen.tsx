// src/screens/SettingsScreen.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, List, Switch, Divider } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';

export default function SettingsScreen() {
  const { signOut } = useAuth();
  const [darkMode, setDarkMode] = React.useState(false);

  return (
    <View style={styles.container}>
      <List.Section>
        <List.Subheader>Appearance</List.Subheader>
        <List.Item
          title="Dark Mode"
          right={() => (
            <Switch
              value={darkMode}
              onValueChange={() => setDarkMode(!darkMode)}
            />
          )}
        />
        <Divider />
        
        <List.Subheader>Account</List.Subheader>
        <List.Item
          title="Email Notifications"
          right={() => <Switch value={false} />}
        />
        <List.Item
          title="Change Password"
          onPress={() => {/* Handle change password */}}
        />
        <Divider />
        
        <List.Subheader>About</List.Subheader>
        <List.Item
          title="Version"
          description="1.0.0"
        />
        <List.Item
          title="Terms of Service"
          onPress={() => {/* Open terms of service */}}
        />
        <List.Item
          title="Privacy Policy"
          onPress={() => {/* Open privacy policy */}}
        />
      </List.Section>
      
      <View style={styles.buttonContainer}>
        <Button 
          mode="contained" 
          onPress={signOut}
          color="#ff3b30"
          style={styles.signOutButton}
        >
          Sign Out
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  buttonContainer: {
    padding: 16,
  },
  signOutButton: {
    marginTop: 20,
  },
});
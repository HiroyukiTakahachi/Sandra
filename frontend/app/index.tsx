import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function HomeScreen() {
  const router = useRouter();

  const navigateTo = (screen: string) => {
    router.push(`/(tabs)/${screen}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/images/sandra_logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        {/* Botões */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigateTo('alunos')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="account-group" size={32} color="#FFFFFF" />
            <Text style={styles.buttonText}>ALUNOS</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => navigateTo('agenda')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="calendar-month" size={32} color="#FFFFFF" />
            <Text style={styles.buttonText}>AGENDA</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => navigateTo('mensalidades')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="cash-multiple" size={32} color="#FFFFFF" />
            <Text style={styles.buttonText}>MENSALIDADES</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => navigateTo('relatorio')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="chart-bar" size={32} color="#FFFFFF" />
            <Text style={styles.buttonText}>RELATÓRIO</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingTop: StatusBar.currentHeight || 0,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
    width: '100%',
  },
  logoImage: {
    width: 280,
    height: 280,
  },
  buttonsContainer: {
    width: '100%',
    maxWidth: 400,
  },
  button: {
    backgroundColor: '#00BCD4',
    paddingVertical: 20,
    paddingHorizontal: 32,
    borderRadius: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 12,
    letterSpacing: 1,
  },
});

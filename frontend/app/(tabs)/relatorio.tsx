import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useFocusEffect } from '@react-navigation/native';

const API_URL = Constants.expoConfig?.extra?.backendUrl || process.env.EXPO_PUBLIC_BACKEND_URL;

interface Relatorio {
  mes_ano: string;
  total_arrecadado: number;
  total_previsto: number;
  total_nao_recebido: number;
  alunos_inadimplentes: Array<{
    nome: string;
    valor: number;
  }>;
}

export default function RelatorioScreen() {
  const [mesesDisponiveis, setMesesDisponiveis] = useState<string[]>([]);
  const [mesSelecionado, setMesSelecionado] = useState<string | null>(null);
  const [relatorio, setRelatorio] = useState<Relatorio | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInadimplentes, setShowInadimplentes] = useState(false);

  const fetchMesesDisponiveis = async () => {
    try {
      const response = await fetch(`${API_URL}/api/relatorios`);
      const data = await response.json();
      setMesesDisponiveis(data);
      if (data.length > 0) {
        setMesSelecionado(data[0]);
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar os meses');
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatorio = async (mesAno: string) => {
    try {
      const response = await fetch(`${API_URL}/api/relatorios/${mesAno}`);
      const data = await response.json();
      setRelatorio(data);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar o relatório');
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchMesesDisponiveis();
    }, [])
  );

  useEffect(() => {
    if (mesSelecionado) {
      fetchRelatorio(mesSelecionado);
    }
  }, [mesSelecionado]);

  const formatarMes = (mesAno: string) => {
    const [ano, mes] = mesAno.split('-');
    const meses = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
    ];
    return `${meses[parseInt(mes) - 1]} ${ano}`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00BCD4" />
      </View>
    );
  }

  if (mesesDisponiveis.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons name="file-document-outline" size={64} color="#BDBDBD" />
        <Text style={styles.emptyText}>Nenhum relatório disponível</Text>
        <Text style={styles.emptySubtext}>
          Registre pagamentos de mensalidades para gerar relatórios
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Seletor de Mês */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Selecione o Mês</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {mesesDisponiveis.map((mes) => (
            <TouchableOpacity
              key={mes}
              style={[
                styles.mesChip,
                mesSelecionado === mes && styles.mesChipSelected,
              ]}
              onPress={() => setMesSelecionado(mes)}
            >
              <Text
                style={[
                  styles.mesChipText,
                  mesSelecionado === mes && styles.mesChipTextSelected,
                ]}
              >
                {formatarMes(mes)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {relatorio && (
        <>
          {/* Cards de Totais */}
          <View style={styles.cardsContainer}>
            <View style={[styles.card, styles.cardArrecadado]}>
              <MaterialCommunityIcons name="cash-check" size={40} color="#4CAF50" />
              <Text style={styles.cardLabel}>Total Arrecadado</Text>
              <Text style={styles.cardValue}>R$ {relatorio.total_arrecadado.toFixed(2)}</Text>
            </View>

            <View style={[styles.card, styles.cardPrevisto]}>
              <MaterialCommunityIcons name="cash-clock" size={40} color="#FF9800" />
              <Text style={styles.cardLabel}>Total Previsto</Text>
              <Text style={styles.cardValue}>R$ {relatorio.total_previsto.toFixed(2)}</Text>
            </View>

            <View style={[styles.card, styles.cardNaoRecebido]}>
              <MaterialCommunityIcons name="cash-remove" size={40} color="#F44336" />
              <Text style={styles.cardLabel}>Não Recebido</Text>
              <Text style={styles.cardValue}>R$ {relatorio.total_nao_recebido.toFixed(2)}</Text>
            </View>
          </View>

          {/* Lista de Inadimplentes */}
          {relatorio.alunos_inadimplentes.length > 0 && (
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.sectionHeader}
                onPress={() => setShowInadimplentes(!showInadimplentes)}
              >
                <Text style={styles.sectionTitle}>
                  Alunos Inadimplentes ({relatorio.alunos_inadimplentes.length})
                </Text>
                <MaterialCommunityIcons
                  name={showInadimplentes ? 'chevron-up' : 'chevron-down'}
                  size={28}
                  color="#212121"
                />
              </TouchableOpacity>

              {showInadimplentes && (
                <View style={styles.inadimplentesContainer}>
                  {relatorio.alunos_inadimplentes.map((aluno, index) => (
                    <View key={index} style={styles.inadimplenteCard}>
                      <MaterialCommunityIcons name="account-alert" size={24} color="#F44336" />
                      <View style={styles.inadimplenteInfo}>
                        <Text style={styles.inadimplenteNome}>{aluno.nome}</Text>
                        <Text style={styles.inadimplenteValor}>R$ {aluno.valor.toFixed(2)}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Percentual de Recebimento */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Taxa de Recebimento</Text>
            <View style={styles.percentualContainer}>
              <View style={styles.percentualBar}>
                <View
                  style={[
                    styles.percentualFill,
                    {
                      width: `${(relatorio.total_arrecadado / relatorio.total_previsto) * 100}%`,
                    },
                  ]}
                />
              </View>
              <Text style={styles.percentualText}>
                {((relatorio.total_arrecadado / relatorio.total_previsto) * 100).toFixed(1)}%
              </Text>
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    color: '#BDBDBD',
    marginTop: 16,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#BDBDBD',
    marginTop: 8,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 12,
  },
  mesChip: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  mesChipSelected: {
    backgroundColor: '#00BCD4',
    borderColor: '#00BCD4',
  },
  mesChipText: {
    fontSize: 14,
    color: '#757575',
    fontWeight: '600',
  },
  mesChipTextSelected: {
    color: '#FFFFFF',
  },
  cardsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardArrecadado: {
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  cardPrevisto: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  cardNaoRecebido: {
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  cardLabel: {
    fontSize: 14,
    color: '#757575',
    marginTop: 8,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212121',
    marginTop: 4,
  },
  inadimplentesContainer: {
    gap: 12,
  },
  inadimplenteCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inadimplenteInfo: {
    flex: 1,
    marginLeft: 12,
  },
  inadimplenteNome: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
  },
  inadimplenteValor: {
    fontSize: 14,
    color: '#F44336',
    fontWeight: 'bold',
    marginTop: 2,
  },
  percentualContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  percentualBar: {
    height: 20,
    backgroundColor: '#E0E0E0',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 12,
  },
  percentualFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  percentualText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212121',
    textAlign: 'center',
  },
});

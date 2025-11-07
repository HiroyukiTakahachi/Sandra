import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useFocusEffect } from '@react-navigation/native';
import { format } from 'date-fns';

const API_URL = Constants.expoConfig?.extra?.backendUrl || process.env.EXPO_PUBLIC_BACKEND_URL;

interface Mensalidade {
  id: string;
  aluno_id: string;
  aluno_nome: string;
  valor: number;
  mes_ano: string;
  pago: boolean;
}

export default function MensalidadesScreen() {
  const [mensalidades, setMensalidades] = useState<Mensalidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalRecebido, setTotalRecebido] = useState(0);
  const [mesAtual, setMesAtual] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedMensalidade, setSelectedMensalidade] = useState<Mensalidade | null>(null);
  const [processando, setProcessando] = useState(false);

  useEffect(() => {
    // Definir mês atual no formato YYYY-MM
    const hoje = new Date();
    const mes = format(hoje, 'yyyy-MM');
    setMesAtual(mes);
  }, []);

  const fetchMensalidades = async () => {
    if (!mesAtual) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/mensalidades/${mesAtual}`);
      const data = await response.json();
      setMensalidades(data);
      calcularTotal(data);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar as mensalidades');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (mesAtual) {
        fetchMensalidades();
      }
    }, [mesAtual])
  );

  const calcularTotal = (data: Mensalidade[]) => {
    const total = data.reduce((sum, m) => {
      return m.pago ? sum + m.valor : sum;
    }, 0);
    setTotalRecebido(total);
  };

  const handleMarcarPago = (mensalidade: Mensalidade) => {
    if (mensalidade.pago) {
      if (Platform.OS === 'web') {
        alert('Esta mensalidade já foi paga');
      } else {
        Alert.alert('Atenção', 'Esta mensalidade já foi paga');
      }
      return;
    }

    setSelectedMensalidade(mensalidade);
    setShowConfirmModal(true);
  };

  const confirmarPagamento = async () => {
    if (!selectedMensalidade) return;

    setProcessando(true);
    try {
      console.log('Enviando pagamento para API:', {
        aluno_id: selectedMensalidade.aluno_id,
        mes_ano: mesAtual,
        url: `${API_URL}/api/mensalidades/pagar`
      });
      
      const response = await fetch(`${API_URL}/api/mensalidades/pagar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aluno_id: selectedMensalidade.aluno_id,
          mes_ano: mesAtual,
        }),
      });

      console.log('Resposta da API:', response.status, response.ok);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Resultado:', result);
        setShowConfirmModal(false);
        setSelectedMensalidade(null);
        
        if (Platform.OS === 'web') {
          alert('Pagamento registrado com sucesso!');
        } else {
          Alert.alert('Sucesso', 'Pagamento registrado');
        }
        
        fetchMensalidades();
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Erro na resposta:', errorData);
        
        if (Platform.OS === 'web') {
          alert('Não foi possível registrar o pagamento');
        } else {
          Alert.alert('Erro', 'Não foi possível registrar o pagamento');
        }
      }
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      
      if (Platform.OS === 'web') {
        alert('Não foi possível registrar o pagamento');
      } else {
        Alert.alert('Erro', 'Não foi possível registrar o pagamento');
      }
    } finally {
      setProcessando(false);
    }
  };

  const mudarMes = (direcao: 'anterior' | 'proximo') => {
    const [ano, mes] = mesAtual.split('-').map(Number);
    let novoAno = ano;
    let novoMes = mes;

    if (direcao === 'anterior') {
      novoMes--;
      if (novoMes < 1) {
        novoMes = 12;
        novoAno--;
      }
    } else {
      novoMes++;
      if (novoMes > 12) {
        novoMes = 1;
        novoAno++;
      }
    }

    setMesAtual(`${novoAno}-${String(novoMes).padStart(2, '0')}`);
  };

  const formatarMes = (mesAno: string) => {
    const [ano, mes] = mesAno.split('-');
    const meses = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
    ];
    return `${meses[parseInt(mes) - 1]} ${ano}`;
  };

  const renderMensalidade = ({ item }: { item: Mensalidade }) => (
    <View style={styles.mensalidadeCard}>
      <View style={styles.mensalidadeInfo}>
        <Text style={styles.alunoNome}>{item.aluno_nome}</Text>
        <Text style={styles.valor}>R$ {item.valor.toFixed(2)}</Text>
      </View>
      <TouchableOpacity
        style={[
          styles.pagoButton,
          item.pago ? styles.pagoButtonDisabled : styles.pagoButtonActive,
        ]}
        onPress={() => handleMarcarPago(item)}
        disabled={item.pago}
      >
        {item.pago ? (
          <MaterialCommunityIcons name="check-circle" size={24} color="#4CAF50" />
        ) : (
          <MaterialCommunityIcons name="cash" size={24} color="#FFFFFF" />
        )}
        <Text style={[styles.pagoButtonText, item.pago && styles.pagoButtonTextDisabled]}>
          {item.pago ? 'PAGO' : 'PAGAR'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00BCD4" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Seletor de Mês */}
      <View style={styles.mesSelector}>
        <TouchableOpacity onPress={() => mudarMes('anterior')} style={styles.mesButton}>
          <MaterialCommunityIcons name="chevron-left" size={32} color="#00BCD4" />
        </TouchableOpacity>
        <Text style={styles.mesText}>{formatarMes(mesAtual)}</Text>
        <TouchableOpacity onPress={() => mudarMes('proximo')} style={styles.mesButton}>
          <MaterialCommunityIcons name="chevron-right" size={32} color="#00BCD4" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={mensalidades}
        keyExtractor={(item) => item.id}
        renderItem={renderMensalidade}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="cash-remove" size={64} color="#BDBDBD" />
            <Text style={styles.emptyText}>Nenhuma mensalidade encontrada</Text>
          </View>
        }
      />

      {/* Barra de Total */}
      <View style={styles.totalBar}>
        <Text style={styles.totalLabel}>Total Recebido:</Text>
        <Text style={styles.totalValue}>R$ {totalRecebido.toFixed(2)}</Text>
      </View>

      {/* Modal de Confirmação */}
      <Modal
        visible={showConfirmModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <MaterialCommunityIcons name="cash-check" size={64} color="#00BCD4" />
            
            <Text style={styles.modalTitle}>Confirmar Pagamento</Text>
            
            {selectedMensalidade && (
              <View style={styles.modalInfo}>
                <Text style={styles.modalAluno}>{selectedMensalidade.aluno_nome}</Text>
                <Text style={styles.modalValor}>
                  R$ {selectedMensalidade.valor.toFixed(2)}
                </Text>
              </View>
            )}

            {processando ? (
              <ActivityIndicator size="large" color="#00BCD4" style={styles.modalLoader} />
            ) : (
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonCancel]}
                  onPress={() => {
                    setShowConfirmModal(false);
                    setSelectedMensalidade(null);
                  }}
                >
                  <Text style={styles.modalButtonTextCancel}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonConfirm]}
                  onPress={confirmarPagamento}
                >
                  <Text style={styles.modalButtonTextConfirm}>Confirmar</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mesSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  mesButton: {
    padding: 8,
  },
  mesText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212121',
  },
  listContainer: {
    padding: 16,
  },
  mensalidadeCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mensalidadeInfo: {
    flex: 1,
  },
  alunoNome: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 4,
  },
  valor: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  pagoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  pagoButtonActive: {
    backgroundColor: '#00BCD4',
  },
  pagoButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  pagoButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  pagoButtonTextDisabled: {
    color: '#4CAF50',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: '#BDBDBD',
    marginTop: 16,
  },
  totalBar: {
    backgroundColor: '#00BCD4',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

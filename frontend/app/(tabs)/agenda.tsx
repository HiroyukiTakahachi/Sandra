import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useFocusEffect } from '@react-navigation/native';
import { format } from 'date-fns';

const API_URL = Constants.expoConfig?.extra?.backendUrl || process.env.EXPO_PUBLIC_BACKEND_URL;

interface Aluno {
  id: string;
  nome: string;
}

interface Agendamento {
  id: string;
  aluno_id: string;
  aluno_nome: string;
  data: string;
  horario: string;
}

const HORARIOS = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00', '22:00',
];

export default function AgendaScreen() {
  const [selectedDate, setSelectedDate] = useState('');
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAlunosModal, setShowAlunosModal] = useState(false);
  const [selectedHorario, setSelectedHorario] = useState('');
  const [markedDates, setMarkedDates] = useState<any>({});

  const fetchAgendamentos = async () => {
    try {
      const response = await fetch(`${API_URL}/api/agendamentos`);
      const data = await response.json();
      setAgendamentos(data);
      updateMarkedDates(data);
    } catch (error) {
      console.error('Erro ao carregar agendamentos:', error);
    }
  };

  const fetchAlunos = async () => {
    try {
      const response = await fetch(`${API_URL}/api/alunos`);
      const data = await response.json();
      setAlunos(data);
    } catch (error) {
      console.error('Erro ao carregar alunos:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchAgendamentos();
      fetchAlunos();
    }, [])
  );

  const updateMarkedDates = (agendamentosData: Agendamento[]) => {
    const dates: any = {};
    agendamentosData.forEach((ag) => {
      if (!dates[ag.data]) {
        dates[ag.data] = {
          marked: true,
          dotColor: '#00BCD4',
        };
      }
    });
    setMarkedDates(dates);
  };

  const getAgendamentosForDate = (date: string) => {
    return agendamentos.filter((ag) => ag.data === date);
  };

  const isHorarioOcupado = (horario: string) => {
    if (!selectedDate) return false;
    return agendamentos.some(
      (ag) => ag.data === selectedDate && ag.horario === horario
    );
  };

  const getAlunoNoHorario = (horario: string) => {
    if (!selectedDate) return null;
    const ag = agendamentos.find(
      (a) => a.data === selectedDate && a.horario === horario
    );
    return ag ? ag.aluno_nome : null;
  };

  const handleHorarioPress = (horario: string) => {
    if (!selectedDate) {
      Alert.alert('Atenção', 'Selecione uma data no calendário');
      return;
    }

    const ocupado = isHorarioOcupado(horario);
    if (ocupado) {
      const ag = agendamentos.find(
        (a) => a.data === selectedDate && a.horario === horario
      );
      if (ag) {
        Alert.alert(
          'Horário Ocupado',
          `${ag.aluno_nome} está agendado neste horário.`,
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Remover Agendamento',
              style: 'destructive',
              onPress: () => handleDeleteAgendamento(ag.id),
            },
          ]
        );
      }
    } else {
      setSelectedHorario(horario);
      setShowAlunosModal(true);
    }
  };

  const handleAlunoSelect = async (aluno: Aluno) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/agendamentos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aluno_id: aluno.id,
          aluno_nome: aluno.nome,
          data: selectedDate,
          horario: selectedHorario,
        }),
      });

      if (response.ok) {
        Alert.alert('Sucesso', 'Agendamento criado com sucesso');
        setShowAlunosModal(false);
        fetchAgendamentos();
      } else {
        const error = await response.json();
        Alert.alert('Erro', error.detail || 'Não foi possível criar o agendamento');
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível criar o agendamento');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAgendamento = async (agendamentoId: string) => {
    try {
      await fetch(`${API_URL}/api/agendamentos/${agendamentoId}`, {
        method: 'DELETE',
      });
      Alert.alert('Sucesso', 'Agendamento removido');
      fetchAgendamentos();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível remover o agendamento');
    }
  };

  const renderHorario = (horario: string) => {
    const ocupado = isHorarioOcupado(horario);
    const alunoNome = getAlunoNoHorario(horario);

    return (
      <TouchableOpacity
        key={horario}
        style={[
          styles.horarioCard,
          ocupado ? styles.horarioOcupado : styles.horarioLivre,
        ]}
        onPress={() => handleHorarioPress(horario)}
        activeOpacity={0.7}
      >
        <View style={styles.horarioContent}>
          <MaterialCommunityIcons
            name={ocupado ? 'account-check' : 'clock-outline'}
            size={24}
            color={ocupado ? '#FFFFFF' : '#00BCD4'}
          />
          <View style={styles.horarioInfo}>
            <Text style={[styles.horarioText, ocupado && styles.horarioTextOcupado]}>
              {horario}
            </Text>
            {alunoNome && (
              <Text style={styles.alunoNomeText}>{alunoNome}</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Calendar
        onDayPress={(day) => setSelectedDate(day.dateString)}
        markedDates={{
          ...markedDates,
          [selectedDate]: {
            selected: true,
            selectedColor: '#00BCD4',
            marked: markedDates[selectedDate]?.marked,
          },
        }}
        theme={{
          selectedDayBackgroundColor: '#00BCD4',
          todayTextColor: '#00BCD4',
          arrowColor: '#00BCD4',
          dotColor: '#00BCD4',
          monthTextColor: '#212121',
          textDayFontSize: 16,
          textMonthFontSize: 18,
          textDayHeaderFontSize: 14,
        }}
      />

      {selectedDate ? (
        <View style={styles.horariosContainer}>
          <Text style={styles.dateTitle}>
            Horários - {format(new Date(selectedDate + 'T00:00:00'), 'dd/MM/yyyy')}
          </Text>
          <ScrollView
            style={styles.horariosScroll}
            contentContainerStyle={styles.horariosContent}
          >
            {HORARIOS.map((horario) => renderHorario(horario))}
          </ScrollView>
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="calendar-blank" size={64} color="#BDBDBD" />
          <Text style={styles.emptyText}>Selecione uma data no calendário</Text>
        </View>
      )}

      {/* Modal de Seleção de Aluno */}
      <Modal
        visible={showAlunosModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAlunosModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecione o Aluno</Text>
              <TouchableOpacity onPress={() => setShowAlunosModal(false)}>
                <MaterialCommunityIcons name="close" size={28} color="#757575" />
              </TouchableOpacity>
            </View>

            {loading ? (
              <ActivityIndicator size="large" color="#00BCD4" />
            ) : (
              <FlatList
                data={alunos}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.alunoItem}
                    onPress={() => handleAlunoSelect(item)}
                  >
                    <MaterialCommunityIcons name="account" size={24} color="#00BCD4" />
                    <Text style={styles.alunoItemText}>{item.nome}</Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <View style={styles.emptyListContainer}>
                    <Text style={styles.emptyListText}>Nenhum aluno cadastrado</Text>
                  </View>
                }
              />
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
  horariosContainer: {
    flex: 1,
    padding: 16,
  },
  dateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 16,
  },
  horariosScroll: {
    flex: 1,
  },
  horariosContent: {
    paddingBottom: 16,
  },
  horarioCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  horarioLivre: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#00BCD4',
  },
  horarioOcupado: {
    backgroundColor: '#00BCD4',
  },
  horarioContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  horarioInfo: {
    marginLeft: 12,
    flex: 1,
  },
  horarioText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
  },
  horarioTextOcupado: {
    color: '#FFFFFF',
  },
  alunoNomeText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: '#BDBDBD',
    marginTop: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212121',
  },
  alunoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    marginBottom: 12,
  },
  alunoItemText: {
    fontSize: 16,
    color: '#212121',
    marginLeft: 12,
  },
  emptyListContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyListText: {
    fontSize: 16,
    color: '#BDBDBD',
  },
});

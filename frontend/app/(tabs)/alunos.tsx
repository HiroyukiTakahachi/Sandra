import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useFocusEffect } from '@react-navigation/native';

const API_URL = Constants.expoConfig?.extra?.backendUrl || process.env.EXPO_PUBLIC_BACKEND_URL;

interface Aluno {
  id: string;
  nome: string;
  data_nascimento: string;
  cpf: string;
  valor_mensalidade: number;
}

export default function AlunosScreen() {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAluno, setEditingAluno] = useState<Aluno | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    data_nascimento: '',
    cpf: '',
    valor_mensalidade: '',
  });

  const fetchAlunos = async () => {
    try {
      const response = await fetch(`${API_URL}/api/alunos`);
      const data = await response.json();
      setAlunos(data);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar os alunos');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchAlunos();
    }, [])
  );

  const handleSave = async () => {
    if (!formData.nome || !formData.data_nascimento || !formData.cpf || !formData.valor_mensalidade) {
      Alert.alert('Atenção', 'Preencha todos os campos');
      return;
    }

    try {
      const payload = {
        nome: formData.nome,
        data_nascimento: formData.data_nascimento,
        cpf: formData.cpf,
        valor_mensalidade: parseFloat(formData.valor_mensalidade),
      };

      if (editingAluno) {
        // Atualizar
        await fetch(`${API_URL}/api/alunos/${editingAluno.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        // Criar novo
        await fetch(`${API_URL}/api/alunos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      setModalVisible(false);
      resetForm();
      fetchAlunos();
      Alert.alert('Sucesso', editingAluno ? 'Aluno atualizado' : 'Aluno cadastrado');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível salvar o aluno');
    }
  };

  const handleDelete = (aluno: Aluno) => {
    Alert.alert(
      'Confirmar exclusão',
      `Deseja excluir ${aluno.nome}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await fetch(`${API_URL}/api/alunos/${aluno.id}`, {
                method: 'DELETE',
              });
              fetchAlunos();
              Alert.alert('Sucesso', 'Aluno excluído');
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível excluir o aluno');
            }
          },
        },
      ]
    );
  };

  const openModal = (aluno?: Aluno) => {
    if (aluno) {
      setEditingAluno(aluno);
      setFormData({
        nome: aluno.nome,
        data_nascimento: aluno.data_nascimento,
        cpf: aluno.cpf,
        valor_mensalidade: aluno.valor_mensalidade.toString(),
      });
    } else {
      resetForm();
    }
    setModalVisible(true);
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      data_nascimento: '',
      cpf: '',
      valor_mensalidade: '',
    });
    setEditingAluno(null);
  };

  const renderAluno = ({ item }: { item: Aluno }) => (
    <View style={styles.alunoCard}>
      <View style={styles.alunoInfo}>
        <Text style={styles.alunoNome}>{item.nome}</Text>
        <Text style={styles.alunoCpf}>CPF: {item.cpf}</Text>
      </View>
      <View style={styles.alunoActions}>
        <Text style={styles.alunoValor}>R$ {item.valor_mensalidade.toFixed(2)}</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity onPress={() => openModal(item)} style={styles.iconButton}>
            <MaterialCommunityIcons name="pencil" size={20} color="#00BCD4" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item)} style={styles.iconButton}>
            <MaterialCommunityIcons name="delete" size={20} color="#F44336" />
          </TouchableOpacity>
        </View>
      </View>
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
      <FlatList
        data={alunos}
        keyExtractor={(item) => item.id}
        renderItem={renderAluno}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="account-off" size={64} color="#BDBDBD" />
            <Text style={styles.emptyText}>Nenhum aluno cadastrado</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={() => openModal()}>
        <MaterialCommunityIcons name="plus" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Modal de Cadastro/Edição */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingAluno ? 'Editar Aluno' : 'Cadastrar Aluno'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={28} color="#757575" />
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              <Text style={styles.label}>Nome</Text>
              <TextInput
                style={styles.input}
                value={formData.nome}
                onChangeText={(text) => setFormData({ ...formData, nome: text })}
                placeholder="Nome completo"
              />

              <Text style={styles.label}>Data de Nascimento</Text>
              <TextInput
                style={styles.input}
                value={formData.data_nascimento}
                onChangeText={(text) => setFormData({ ...formData, data_nascimento: text })}
                placeholder="DD/MM/AAAA"
              />

              <Text style={styles.label}>CPF</Text>
              <TextInput
                style={styles.input}
                value={formData.cpf}
                onChangeText={(text) => setFormData({ ...formData, cpf: text })}
                placeholder="000.000.000-00"
                keyboardType="numeric"
              />

              <Text style={styles.label}>Valor da Mensalidade</Text>
              <TextInput
                style={styles.input}
                value={formData.valor_mensalidade}
                onChangeText={(text) => setFormData({ ...formData, valor_mensalidade: text })}
                placeholder="0.00"
                keyboardType="decimal-pad"
              />

              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
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
  listContainer: {
    padding: 16,
  },
  alunoCard: {
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
  alunoInfo: {
    flex: 1,
  },
  alunoNome: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 4,
  },
  alunoCpf: {
    fontSize: 14,
    color: '#757575',
  },
  alunoActions: {
    alignItems: 'flex-end',
  },
  alunoValor: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 4,
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
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    backgroundColor: '#00BCD4',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
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
    paddingTop: 24,
    paddingBottom: 40,
    paddingHorizontal: 24,
    maxHeight: '80%',
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
  form: {
    gap: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#424242',
    marginBottom: -8,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  saveButton: {
    backgroundColor: '#00BCD4',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});

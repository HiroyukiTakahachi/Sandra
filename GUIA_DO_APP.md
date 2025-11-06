# 📱 GYM ADMIN - Aplicativo de Gestão de Academia

## 🎯 Visão Geral

Sistema completo de gestão de academia desenvolvido em React Native (Expo) com backend FastAPI e MongoDB. O aplicativo permite gerenciar alunos, agendamentos, mensalidades e relatórios financeiros.

## 🚀 URLs de Acesso

- **Preview Web:** https://183670a9-ee23-4a1a-91c4-f55fc62b319b.preview.emergentagent.com
- **Backend API:** https://183670a9-ee23-4a1a-91c4-f55fc62b319b.preview.emergentagent.com/api
- **Expo QR Code:** Disponível na interface web para teste no Expo Go

## ✨ Funcionalidades Principais

### 🏠 Tela Inicial
- Logo grande centralizada (ícone de halteres)
- 4 botões principais com navegação:
  - **ALUNOS** - Gerenciamento de alunos
  - **AGENDA** - Agendamento de horários
  - **MENSALIDADES** - Controle de pagamentos
  - **RELATÓRIO** - Relatórios financeiros

### 👥 ALUNOS
**Funcionalidades:**
- ✅ Listar todos os alunos cadastrados
- ✅ Visualizar nome, CPF e valor da mensalidade
- ✅ Cadastrar novo aluno (botão flutuante +)
- ✅ Editar dados do aluno (ícone de lápis)
- ✅ Excluir aluno (ícone de lixeira)

**Campos do Cadastro:**
- Nome completo
- Data de nascimento
- CPF
- Valor da mensalidade

### 📅 AGENDA
**Funcionalidades:**
- ✅ Calendário mensal interativo
- ✅ Visualização de dias com agendamentos (marcador azul)
- ✅ Horários disponíveis: 6h às 22h
- ✅ Selecionar data → horário → aluno
- ✅ Validação: não permite 2 alunos no mesmo horário
- ✅ Cancelar/remover agendamentos

**Como usar:**
1. Selecione uma data no calendário
2. Escolha um horário disponível (verde) ou veja horários ocupados (azul)
3. Clique em horário livre para agendar
4. Selecione o aluno na lista
5. Para cancelar, clique no horário ocupado e confirme remoção

### 💰 MENSALIDADES
**Funcionalidades:**
- ✅ Lista de todos os alunos com status de pagamento
- ✅ Botão "PAGAR" para registrar pagamento
- ✅ Botão "PAGO" (desabilitado) para mensalidades já pagas
- ✅ Barra fixa mostrando "Total Recebido"
- ✅ Navegação entre meses (setas < >)
- ✅ Visualizar/editar meses anteriores

**Como funciona:**
- Ao cadastrar um aluno, automaticamente cria registro de mensalidade para o mês
- Clique em "PAGAR" para confirmar o pagamento
- O valor é somado ao total recebido
- O botão fica desabilitado após pagamento
- Reset automático no dia 1º de cada mês (dados preservados no histórico)

### 📊 RELATÓRIO
**Funcionalidades:**
- ✅ Seleção de meses disponíveis
- ✅ Total arrecadado (valor verde)
- ✅ Total previsto (valor laranja)
- ✅ Total não recebido (valor vermelho)
- ✅ Lista expansível de alunos inadimplentes
- ✅ Taxa de recebimento em percentual com barra visual

**Informações exibidas:**
- Cards coloridos com totais
- Dropdown com lista de inadimplentes
- Gráfico de percentual de recebimento
- Histórico por mês

## 🎨 Design

**Paleta de Cores:**
- **Principal:** Azul ciano (#00BCD4) - botões e elementos interativos
- **Secundária:** Verde (#4CAF50) - valores positivos
- **Alerta:** Vermelho (#F44336) - exclusões e inadimplências
- **Fundo:** Cinza claro (#F5F5F5)
- **Cards:** Branco (#FFFFFF) com sombras suaves

**Elementos de Design:**
- Botões com bordas arredondadas (12-16px)
- Sombras suaves para profundidade
- Ícones do MaterialCommunityIcons
- Tipografia clean e legível
- Layout responsivo para diferentes tamanhos de tela

## 🔧 Tecnologias Utilizadas

### Frontend
- **React Native** - Framework mobile
- **Expo** - Plataforma de desenvolvimento
- **Expo Router** - Navegação file-based
- **React Navigation** - Bottom tabs
- **react-native-calendars** - Componente de calendário
- **date-fns** - Manipulação de datas
- **Expo Vector Icons** - Ícones

### Backend
- **FastAPI** - Framework Python
- **MongoDB** - Banco de dados NoSQL
- **Motor** - Driver async do MongoDB
- **Pydantic** - Validação de dados

## 📱 Como Testar no Celular

1. **Instalar Expo Go:**
   - Android: Google Play Store
   - iOS: App Store

2. **Escanear QR Code:**
   - Acesse a URL web do preview
   - Role até encontrar o QR Code do Expo
   - Escaneie com o Expo Go

3. **Ou usar diretamente no navegador:**
   - Acesse a URL web no navegador do celular

## 🧪 Dados de Teste

O sistema já possui 3 alunos cadastrados para teste:
- **Maria Silva** - R$ 150,00 (PAGO em Nov/2025)
- **João Santos** - R$ 180,00
- **Ana Costa** - R$ 150,00

## 📋 Fluxos Principais

### Cadastrar e Agendar um Novo Aluno
1. Vá em **ALUNOS**
2. Clique no botão **+** (flutuante)
3. Preencha os dados e salve
4. Vá em **AGENDA**
5. Selecione uma data
6. Escolha um horário
7. Selecione o aluno recém-cadastrado

### Registrar Pagamento de Mensalidade
1. Vá em **MENSALIDADES**
2. Localize o aluno na lista
3. Clique em **PAGAR**
4. Confirme o pagamento
5. Veja o total recebido atualizar na barra inferior

### Visualizar Relatório Financeiro
1. Vá em **RELATÓRIO**
2. Selecione o mês desejado
3. Visualize os totais (arrecadado, previsto, não recebido)
4. Clique em "Alunos Inadimplentes" para expandir a lista
5. Veja a taxa de recebimento em percentual

## 🔄 Funcionalidades Automáticas

- **Reset mensal:** Mensalidades zeradas automaticamente dia 1º
- **Histórico preservado:** Todos os dados de meses anteriores são mantidos
- **Validação de horários:** Sistema impede duplo agendamento
- **Criação automática de mensalidades:** Ao cadastrar aluno, já cria registro do mês atual

## 📝 Observações Importantes

1. **Formato de Data:** Utilize DD/MM/AAAA para data de nascimento
2. **CPF:** Pode ser digitado com ou sem formatação
3. **Valores:** Use ponto (.) para separar decimais (ex: 150.00)
4. **Exclusão de Aluno:** Remove também todos os agendamentos e mensalidades
5. **Meses no Relatório:** Só aparecem meses que tiveram algum pagamento registrado

## 🎯 Próximas Melhorias Sugeridas

- [ ] Notificações push para alunos com mensalidade atrasada
- [ ] Filtros e busca na lista de alunos
- [ ] Exportar relatórios em PDF
- [ ] Backup automático dos dados
- [ ] Dashboard com gráficos avançados
- [ ] Cadastro de planos diferentes (mensal, trimestral, anual)
- [ ] Sistema de check-in para controle de presença
- [ ] Fotos dos alunos

## 🆘 Suporte

Em caso de dúvidas ou problemas:
1. Verifique se todos os campos estão preenchidos corretamente
2. Tente recarregar o aplicativo
3. Confira se a conexão com internet está ativa
4. Verifique os logs do backend para erros de API

---

**Desenvolvido com ❤️ para facilitar a gestão da sua academia!**

from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from bson import ObjectId

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# ==================== MODELS ====================

class Aluno(BaseModel):
    id: Optional[str] = None
    nome: str
    data_nascimento: str
    cpf: str
    valor_mensalidade: float
    created_at: datetime = Field(default_factory=datetime.utcnow)

class AlunoCreate(BaseModel):
    nome: str
    data_nascimento: str
    cpf: str
    valor_mensalidade: float

class AlunoUpdate(BaseModel):
    nome: Optional[str] = None
    data_nascimento: Optional[str] = None
    cpf: Optional[str] = None
    valor_mensalidade: Optional[float] = None

class Agendamento(BaseModel):
    id: Optional[str] = None
    aluno_id: str
    aluno_nome: str
    data: str  # YYYY-MM-DD
    horario: str  # HH:00
    created_at: datetime = Field(default_factory=datetime.utcnow)

class AgendamentoCreate(BaseModel):
    aluno_id: str
    aluno_nome: str
    data: str
    horario: str

class Mensalidade(BaseModel):
    id: Optional[str] = None
    aluno_id: str
    aluno_nome: str
    valor: float
    mes_ano: str  # formato: YYYY-MM
    pago: bool = False
    data_pagamento: Optional[datetime] = None

class MensalidadePagamento(BaseModel):
    aluno_id: str
    mes_ano: str
    data_pagamento: Optional[str] = None  # formato: YYYY-MM-DD

class Relatorio(BaseModel):
    mes_ano: str
    total_arrecadado: float
    total_previsto: float
    total_nao_recebido: float
    alunos_inadimplentes: List[dict]

# ==================== ALUNOS ROUTES ====================

@api_router.post("/alunos", response_model=Aluno)
async def criar_aluno(aluno: AlunoCreate):
    aluno_dict = aluno.dict()
    aluno_dict['created_at'] = datetime.utcnow()
    result = await db.alunos.insert_one(aluno_dict)
    aluno_dict['id'] = str(result.inserted_id)
    return Aluno(**aluno_dict)

@api_router.get("/alunos", response_model=List[Aluno])
async def listar_alunos():
    alunos = await db.alunos.find().sort('nome', 1).to_list(1000)
    for aluno in alunos:
        aluno['id'] = str(aluno.pop('_id'))
    return [Aluno(**aluno) for aluno in alunos]

@api_router.get("/alunos/{aluno_id}", response_model=Aluno)
async def obter_aluno(aluno_id: str):
    aluno = await db.alunos.find_one({'_id': ObjectId(aluno_id)})
    if not aluno:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")
    aluno['id'] = str(aluno.pop('_id'))
    return Aluno(**aluno)

@api_router.put("/alunos/{aluno_id}", response_model=Aluno)
async def atualizar_aluno(aluno_id: str, aluno_update: AlunoUpdate):
    update_data = {k: v for k, v in aluno_update.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="Nenhum campo para atualizar")
    
    result = await db.alunos.update_one(
        {'_id': ObjectId(aluno_id)},
        {'$set': update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")
    
    aluno = await db.alunos.find_one({'_id': ObjectId(aluno_id)})
    aluno['id'] = str(aluno.pop('_id'))
    return Aluno(**aluno)

@api_router.delete("/alunos/{aluno_id}")
async def deletar_aluno(aluno_id: str):
    # Deletar agendamentos do aluno
    await db.agendamentos.delete_many({'aluno_id': aluno_id})
    # Deletar mensalidades do aluno
    await db.mensalidades.delete_many({'aluno_id': aluno_id})
    # Deletar aluno
    result = await db.alunos.delete_one({'_id': ObjectId(aluno_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")
    return {"message": "Aluno deletado com sucesso"}

# ==================== AGENDAMENTOS ROUTES ====================

@api_router.post("/agendamentos", response_model=Agendamento)
async def criar_agendamento(agendamento: AgendamentoCreate):
    # Verificar se já existe agendamento para o mesmo horário
    existente = await db.agendamentos.find_one({
        'data': agendamento.data,
        'horario': agendamento.horario
    })
    if existente:
        raise HTTPException(status_code=400, detail="Horário já está ocupado")
    
    agendamento_dict = agendamento.dict()
    agendamento_dict['created_at'] = datetime.utcnow()
    result = await db.agendamentos.insert_one(agendamento_dict)
    agendamento_dict['id'] = str(result.inserted_id)
    return Agendamento(**agendamento_dict)

@api_router.get("/agendamentos", response_model=List[Agendamento])
async def listar_agendamentos(mes_ano: Optional[str] = None):
    query = {}
    if mes_ano:
        # Filtrar por mês (formato: YYYY-MM)
        query['data'] = {'$regex': f'^{mes_ano}'}
    
    agendamentos = await db.agendamentos.find(query).sort([('data', 1), ('horario', 1)]).to_list(5000)
    for ag in agendamentos:
        ag['id'] = str(ag.pop('_id'))
    return [Agendamento(**ag) for ag in agendamentos]

@api_router.delete("/agendamentos/{agendamento_id}")
async def deletar_agendamento(agendamento_id: str):
    result = await db.agendamentos.delete_one({'_id': ObjectId(agendamento_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Agendamento não encontrado")
    return {"message": "Agendamento cancelado com sucesso"}

# ==================== MENSALIDADES ROUTES ====================

@api_router.get("/mensalidades/{mes_ano}", response_model=List[Mensalidade])
async def listar_mensalidades(mes_ano: str):
    # Obter todos os alunos
    alunos = await db.alunos.find().to_list(1000)
    mensalidades = []
    
    for aluno in alunos:
        aluno_id = str(aluno['_id'])
        # Verificar se existe registro de mensalidade
        mens = await db.mensalidades.find_one({
            'aluno_id': aluno_id,
            'mes_ano': mes_ano
        })
        
        if mens:
            mens['id'] = str(mens.pop('_id'))
            mensalidades.append(Mensalidade(**mens))
        else:
            # Criar registro default
            novo_registro = {
                'aluno_id': aluno_id,
                'aluno_nome': aluno['nome'],
                'valor': aluno['valor_mensalidade'],
                'mes_ano': mes_ano,
                'pago': False,
                'data_pagamento': None
            }
            result = await db.mensalidades.insert_one(novo_registro)
            novo_registro['id'] = str(result.inserted_id)
            mensalidades.append(Mensalidade(**novo_registro))
    
    return mensalidades

@api_router.put("/mensalidades/pagar")
async def marcar_pago(pagamento: MensalidadePagamento):
    # Se data_pagamento foi fornecida, usar ela; caso contrário, usar data atual
    if pagamento.data_pagamento:
        try:
            # Converter string YYYY-MM-DD para datetime
            data_pag = datetime.strptime(pagamento.data_pagamento, '%Y-%m-%d')
        except ValueError:
            raise HTTPException(status_code=400, detail="Formato de data inválido. Use YYYY-MM-DD")
    else:
        data_pag = datetime.utcnow()
    
    result = await db.mensalidades.update_one(
        {
            'aluno_id': pagamento.aluno_id,
            'mes_ano': pagamento.mes_ano
        },
        {
            '$set': {
                'pago': True,
                'data_pagamento': data_pag
            }
        }
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Mensalidade não encontrada")
    
    return {"message": "Pagamento registrado com sucesso"}

# ==================== RELATÓRIOS ROUTES ====================

@api_router.get("/relatorios/{mes_ano}", response_model=Relatorio)
async def obter_relatorio(mes_ano: str):
    mensalidades = await db.mensalidades.find({'mes_ano': mes_ano}).to_list(1000)
    
    total_arrecadado = sum(m['valor'] for m in mensalidades if m.get('pago', False))
    total_previsto = sum(m['valor'] for m in mensalidades)
    total_nao_recebido = total_previsto - total_arrecadado
    
    alunos_inadimplentes = [
        {
            'nome': m['aluno_nome'],
            'valor': m['valor']
        }
        for m in mensalidades if not m.get('pago', False)
    ]
    
    return Relatorio(
        mes_ano=mes_ano,
        total_arrecadado=total_arrecadado,
        total_previsto=total_previsto,
        total_nao_recebido=total_nao_recebido,
        alunos_inadimplentes=alunos_inadimplentes
    )

@api_router.get("/relatorios")
async def listar_meses_disponiveis():
    # Obter todos os meses únicos de mensalidades
    meses = await db.mensalidades.distinct('mes_ano')
    return sorted(meses, reverse=True)

# ==================== HEALTH CHECK ====================

@api_router.get("/")
async def root():
    return {"message": "API Gym Admin - Rodando"}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

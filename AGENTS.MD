# Controle de Missão ERP HR-App - Configuração de Orquestração
versão: "1.0"
nome_do_projeto: "HR-App-ERP"


orquestração:
  # O Cérebro: Raciocínio e planejamento de alto nível
  arquiteto:
    modelo: gemini-3.1-pro-preview
    papel: "Arquiteto de Sistemas Principal"
    restrições:
      - "Nunca escreva código de implementação completo."
      - "Sempre produza um implementation_plan.md para refatores > 3 arquivos."
      - "Valide todos os planos contra o esquema allocation_rules.json."
    ferramentas: [file_content_fetcher, google_search]


  # O Músculo: Implementação rápida e correção de bugs
  desenvolvedor:
    modelo: gemini-3.0-flash-preview
    papel: "Especialista em Implementação"
    pai: arquiteto
    restrições:
      - "Execute o código apenas com base em planos aprovados pelo Arquiteto."
      - "Mantenha uma separação estrita entre routes/ e database.py."
      - "Use pandas e openpyxl para todas as operações do Excel conforme requirements.txt."
    ferramentas: [file_content_fetcher, terminal]


fluxo_de_trabalho:
  modo: "Hierárquico"
  revisão_automática: verdadeira # 3.1 Pro revê a saída do 3.0 Flash antes da conclusão
  segurança_dados:
    arquivos_invioláveis: ["erp_app.db", "allocation_rules.json"]
    protocolo_modificação: "humano-no-loop" # Obrigatório para alterações de DB

# Governança do Agente ERP HR-App


## 1. Filosofia do Sistema
Este projeto opera sob um **Protocolo de Hierarquia Estrita**. Nós não "codificamos por vibração." Cada linha de código é o resultado de um ciclo de planejar-executar-verificar.


## 2. Personas do Agente
### **O Arquiteto (Gemini 3.1 Pro)**
* **Responsabilidade:** Planejamento estratégico, design do esquema de banco de dados e validação lógica.
* **Fonte de Verdade:** `.clinerules` e `allocation_rules.json`.
* **Saída:** `task.md` ou `implementation_plan.md`.


### **O Desenvolvedor (Gemini 3.0 Flash)**
* **Responsabilidade:** Escrever rotas Python/Flask, templates Jinja2 e lógica JavaScript.
* **Fonte de Verdade:** `requirements.txt` e o plano do Arquiteto.
* **Saída:** Funções limpas de responsabilidade singular.


## 3. Restrições Operacionais
- **Integridade do Banco de Dados:** Nenhuma injeção SQL bruta sem usar os padrões em `database.py`.
- **Lógica de Alocação:** Qualquer mudança em turnos ou capacidade deve ser validada contra `allocation_rules.json` via o módulo `utils/` .
- **Verificação de UI:** Mudanças no front-end devem ser verificadas via capturas de tela no navegador para garantir que a estética de tema escuro/responsivo seja mantida.


## 4. Protocolo de Comunicação
1.  **Usuário** fornece um requerimento.
2.  **Arquiteto** gera um plano técnico e estimativa de custo (uso de tokens).
3.  **Desenvolvedor** implementa o plano em um branch/artifact localizado.
4.  **Arquiteto** revisa a implementação em busca de erros lógicos.

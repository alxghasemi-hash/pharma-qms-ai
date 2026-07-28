import json
import os
from typing import TypedDict, Optional, Dict, Any          
from dotenv import load_dotenv
from langgraph.graph import StateGraph, END                
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_groq import ChatGroq

load_dotenv()


llm = ChatGroq(
    model="llama-3.3-70b-versatile", 
    temperature=0,
    model_kwargs={"response_format": {"type": "json_object"}}
)

SYSTEM_PROMPT = """You are an AI Assistant for a Pharma Quality Management System (QMS).

Evaluate the incoming text and extract complaint details into JSON format.

CRITICAL DUPLICATE RULES:
- If `existing_state` is NOT None or NOT empty, this request is an UPDATE / CORRECTION to an active form.
  -> You MUST set `"is_duplicate": false` (or `"possible_duplicate": false`).
- NEVER mark an active editing session or conversational edit as a duplicate.
- Only mark `"is_duplicate": true` if a brand-new complaint is submitted that matches a historical database record.
RULES:
1. If user input is a general greeting, set "is_complaint": false.
2. If it is a complaint, populate the fields, assess completeness, suggest root cause, suggest CAPA, and perform duplicate checking.

REQUIRED OUTPUT STRUCTURE (JSON ONLY):
{
  "is_complaint": true,
  "chat_response": "Short summary response",
  "complaint_source": null,
  "customer_name": null,
  "product_name": null,
  "product_strength": null,
  "batch_number": null,
  "quantity_affected": null,
  "manufacturing_date": null,
  "expiry_date": null,
  "originating_site_block": null,
  "impacted_npm": null,
  "complaint_category": null,
  "complaint_description": null,
  "severity": null,
  "suggested_next_action": null,
  "initial_risk_assessment": null,
  "completeness_score": null,
  "root_cause_recommendation": null,
  "capa_recommendation": null,
  "possible_duplicate": false
}
"""

class AgentState(TypedDict):
    raw_text: str
    existing_state: Optional[Dict[str, Any]]
    result: Optional[Dict[str, Any]]


def analyze_complaint_node(state: AgentState):
    raw_text = state["raw_text"]
    existing_state = state.get("existing_state") or {}
    
    messages = [
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(content=f"Current Form State: {json.dumps(existing_state)}\nUser Input: {raw_text}")
    ]
    
    response = llm.invoke(messages)
    content = response.content.replace("```json", "").replace("```", "").strip()
    parsed_json = json.loads(content)
    return {"result": parsed_json}



workflow = StateGraph(AgentState)
workflow.add_node("analyze", analyze_complaint_node)
workflow.set_entry_point("analyze")
workflow.add_edge("analyze", END)

app_graph = workflow.compile()



def process_complaint_input(raw_text: str, existing_state: dict = None):
    try:
        initial_state = {"raw_text": raw_text, "existing_state": existing_state}
        output = app_graph.invoke(initial_state)
        return output["result"]
    except Exception as e:
        print("Error processing LLM request:", e)
        return {
            "is_complaint": False,
            "chat_response": "I encountered an error processing that request."
        }
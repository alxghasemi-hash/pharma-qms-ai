import React, { useState } from 'react';
import axios from 'axios';
import { 
  Send, RefreshCw, Save, Bot, Sparkles, AlertTriangle, 
  Paperclip, FileText, Image, Mail, ShieldCheck, 
  PanelRightClose, PanelRightOpen 
} from 'lucide-react';

const API_BASE = 'http://127.0.0.1:8000/api';

export default function App() {
  const [formData, setFormData] = useState({
    complaint_source: '', 
    customer_name: '', 
    product_name: '', 
    product_strength: '',
    batch_number: '', 
    manufacturing_date: '', 
    expiry_date: '', 
    quantity_affected: '',
    originating_site_block: '',
    impacted_npm: '',
    complaint_category: '', 
    complaint_description: '', 
    severity: '',
    suggested_next_action: '', 
    initial_risk_assessment: '',
    completeness_score: '',
    root_cause_recommendation: '',
    capa_recommendation: '',
    possible_duplicate: false
  });

  const [inputPrompt, setInputPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);

  const [chatHistory, setChatHistory] = useState([
    { 
      sender: 'bot', 
      text: 'Hello! I am your AIVOA Copilot. Drop a document or paste customer emails directly into our chat to auto-populate complaint entries.' 
    }
  ]);

  const handleApiResponse = (data) => {
    if (!data) return;
    const normalizedData = {
      ...data,
      complaint_source: data.complaint_source || data.source || data.origin_source || formData.complaint_source,
    };
    setFormData((prev) => ({ ...prev, ...normalizedData }));
  };

  const handleSendPrompt = async () => {
    if (!inputPrompt.trim()) return;

    const userMsg = inputPrompt;
    setInputPrompt('');
    setShowAttachmentMenu(false);
    setChatHistory((prev) => [...prev, { sender: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const res = await axios.post(`${API_BASE}/analyze-complaint`, {
        raw_text: userMsg,
        existing_state: formData
      });

      const responseData = res.data?.data || {};
      handleApiResponse(responseData);

      const botMessage = responseData.chat_response || 
        (responseData.is_complaint ? 'Complaint details processed successfully.' : 'Updated form details.');

      setChatHistory((prev) => [...prev, { sender: 'bot', text: botMessage }]);
    } catch (err) {
      console.error(err);
      setChatHistory((prev) => [
        ...prev, 
        { sender: 'bot', text: `Error processing request: ${err.response?.data?.detail || err.message}` }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    setShowAttachmentMenu(false);
    setLoading(true);
    setChatHistory((prev) => [...prev, { sender: 'user', text: `Attached file: ${file.name}` }]);

    const uploadData = new FormData();
    uploadData.append('file', file);

    try {
      const res = await axios.post(`${API_BASE}/upload-document`, uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const responseData = res.data?.data || {};
      handleApiResponse(responseData);

      setChatHistory((prev) => [
        ...prev, 
        { sender: 'bot', text: 'Document analyzed! The extracted data has been mapped into the QA form.' }
      ]);
    } catch (err) {
      console.error(err);
      setChatHistory((prev) => [
        ...prev, 
        { sender: 'bot', text: `Error processing document: ${err.response?.data?.detail || err.message}` }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const triggerFileInput = (inputId) => {
    setShowAttachmentMenu(false);
    document.getElementById(inputId)?.click();
  };

  const handleReset = () => {
    setFormData({
      complaint_source: '', customer_name: '', product_name: '', product_strength: '',
      batch_number: '', manufacturing_date: '', expiry_date: '', quantity_affected: '',
      originating_site_block: '', impacted_npm: '', complaint_category: '', 
      complaint_description: '', severity: '', suggested_next_action: '', 
      initial_risk_assessment: '', completeness_score: '', root_cause_recommendation: '',
      capa_recommendation: '', possible_duplicate: false
    });
    setChatHistory([{ sender: 'bot', text: 'Form cleared. Ready for the next complaint entry.' }]);
  };

  const getFieldValue = (val) => val || '';

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 p-4 lg:p-8 font-sans antialiased overflow-hidden">
      {/* GRID PARENT WITH DYNAMIC COLUMNS & SMOOTH TRANSITION */}
      <div 
        className="max-w-7xl mx-auto grid gap-6 items-stretch transition-all duration-500 ease-in-out"
        style={{
          gridTemplateColumns: isChatCollapsed ? '1fr 60px' : '1fr 420px'
        }}
      >
        
        {/* LEFT FORM PANEL */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 flex flex-col justify-between h-[calc(100vh-4rem)] min-w-0 transition-all duration-500">
          
          {/* Header */}
          <div className="flex justify-between items-center pb-4 border-b border-slate-100 shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="text-violet-600" size={20} />
                <h1 className="text-lg font-bold tracking-tight text-slate-900">log customer complaint</h1>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Pharma Quality Assurance & Regulatory Intelligence</p>
            </div>
            <span className="px-3 py-1 bg-violet-50 text-violet-700 border border-violet-100 text-xs font-medium rounded-full flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse"></span>
              Live Capture
            </span>
          </div>

          {/* Form Scroll Area */}
          <div className="overflow-y-auto pr-2 my-5 space-y-7 flex-1 custom-scrollbar">
            <form className="space-y-7" onSubmit={(e) => e.preventDefault()}>
              
              {formData.possible_duplicate && (
                <div className="p-3.5 bg-amber-50/80 border border-amber-200/80 text-amber-900 rounded-xl text-xs flex items-center gap-3">
                  <AlertTriangle size={18} className="text-amber-600 shrink-0" />
                  <span><strong>Possible Duplicate Flagged:</strong> A similar entry exists for this batch. Review before saving.</span>
                </div>
              )}

              {/* SECTION 1 */}
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider mb-3 text-slate-500">
                  <span className="text-violet-600 font-bold mr-1.5">01.</span>Origin & Stakeholder
                </h2>
                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Source</label>
                    <input type="text" readOnly placeholder="Awaiting extraction..." value={getFieldValue(formData.complaint_source)}
                      className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50/50 focus:outline-none placeholder:text-slate-300 font-medium cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Customer / Entity</label>
                    <input type="text" readOnly placeholder="Awaiting extraction..." value={getFieldValue(formData.customer_name)}
                      className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50/50 focus:outline-none placeholder:text-slate-300 font-medium cursor-not-allowed" />
                  </div>
                </div>
              </div>

              {/* SECTION 2 */}
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider mb-3 text-slate-500">
                  <span className="text-violet-600 font-bold mr-1.5">02.</span>Product Identification
                </h2>
                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Product Name</label>
                    <input type="text" readOnly placeholder="Awaiting extraction..." value={getFieldValue(formData.product_name)}
                      className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50/50 focus:outline-none placeholder:text-slate-300 font-medium cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Strength</label>
                    <input type="text" readOnly placeholder="Awaiting extraction..." value={getFieldValue(formData.product_strength)}
                      className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50/50 focus:outline-none placeholder:text-slate-300 font-medium cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Batch / Lot Number</label>
                    <input type="text" readOnly placeholder="Awaiting extraction..." value={getFieldValue(formData.batch_number)}
                      className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50/50 focus:outline-none placeholder:text-slate-300 font-medium cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Quantity Impacted</label>
                    <input type="text" readOnly placeholder="Awaiting extraction..." value={getFieldValue(formData.quantity_affected)}
                      className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50/50 focus:outline-none placeholder:text-slate-300 font-medium cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Mfg Date</label>
                    <input type="text" readOnly placeholder="Awaiting extraction..." value={getFieldValue(formData.manufacturing_date)}
                      className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50/50 focus:outline-none placeholder:text-slate-300 font-medium cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Exp Date</label>
                    <input type="text" readOnly placeholder="Awaiting extraction..." value={getFieldValue(formData.expiry_date)}
                      className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50/50 focus:outline-none placeholder:text-slate-300 font-medium cursor-not-allowed" />
                  </div>
                </div>
              </div>

              {/* SECTION 3 */}
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider mb-3 text-slate-500">
                  <span className="text-violet-600 font-bold mr-1.5">03.</span>Facility Mapping
                </h2>
                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Site Block</label>
                    <input type="text" readOnly placeholder="Awaiting extraction..." value={getFieldValue(formData.originating_site_block)}
                      className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50/50 focus:outline-none placeholder:text-slate-300 font-medium cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Non-Product Material (NPM)</label>
                    <input type="text" readOnly placeholder="Awaiting extraction..." value={getFieldValue(formData.impacted_npm)}
                      className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50/50 focus:outline-none placeholder:text-slate-300 font-medium cursor-not-allowed" />
                  </div>
                </div>
              </div>

              {/* SECTION 4 */}
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider mb-3 text-slate-500">
                  <span className="text-violet-600 font-bold mr-1.5">04.</span>Defect & Risk Analysis
                </h2>
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Category</label>
                    <input type="text" readOnly placeholder="Awaiting extraction..." value={getFieldValue(formData.complaint_category)}
                      className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50/50 focus:outline-none placeholder:text-slate-300 font-medium cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Description Summary</label>
                    <textarea readOnly rows={3} placeholder="Awaiting extraction..." value={getFieldValue(formData.complaint_description)}
                      className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50/50 resize-none focus:outline-none placeholder:text-slate-300 font-medium cursor-not-allowed" />
                  </div>

                  <div className="bg-gradient-to-br from-violet-50/50 to-slate-50 border border-violet-100 rounded-xl p-4 space-y-3.5">
                    <div className="flex items-center justify-between text-violet-900 text-xs font-bold">
                      <div className="flex items-center gap-1.5">
                        <Sparkles size={14} className="text-violet-600" />
                        <span>Copilot CAPA & Risk Insights</span>
                      </div>
                      {formData.completeness_score && (
                        <span className="px-2.5 py-0.5 bg-violet-100 text-violet-800 rounded-full text-[10px] font-semibold">
                          {formData.completeness_score}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase">Severity</label>
                        <input type="text" readOnly placeholder="—" value={getFieldValue(formData.severity)}
                          className="w-full px-3 py-1.5 text-xs border border-slate-200/60 rounded-md bg-white font-semibold text-slate-800 cursor-not-allowed" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase">Recommended Action</label>
                        <input type="text" readOnly placeholder="—" value={getFieldValue(formData.suggested_next_action)}
                          className="w-full px-3 py-1.5 text-xs border border-slate-200/60 rounded-md bg-white font-medium text-slate-800 cursor-not-allowed" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase">Initial Risk Assessment</label>
                      <textarea readOnly rows={2} placeholder="—" value={getFieldValue(formData.initial_risk_assessment)}
                        className="w-full px-3 py-1.5 text-xs border border-slate-200/60 rounded-md bg-white resize-none font-medium text-slate-800 cursor-not-allowed" />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase">Root Cause Recommendation</label>
                      <input type="text" readOnly placeholder="—" value={getFieldValue(formData.root_cause_recommendation)}
                        className="w-full px-3 py-1.5 text-xs border border-slate-200/60 rounded-md bg-white font-medium text-slate-800 cursor-not-allowed" />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase">CAPA Recommendation</label>
                      <textarea readOnly rows={2} placeholder="—" value={getFieldValue(formData.capa_recommendation)}
                        className="w-full px-3 py-1.5 text-xs border border-slate-200/60 rounded-md bg-white resize-none font-medium text-slate-800 cursor-not-allowed" />
                    </div>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => alert('Saved to QMS Ledger!')}
                className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-2"
              >
                Commit to Ledger
              </button>

            </form>
          </div>

          {/* Footer Controls */}
          <div className="flex justify-between items-center pt-3 border-t border-slate-100 shrink-0 text-xs">
            <button onClick={handleReset} className="flex items-center gap-1.5 px-3.5 py-1.5 font-medium text-slate-500 hover:text-slate-800 transition">
              <RefreshCw size={13} /> Reset
            </button>
            <button onClick={() => alert('Draft saved!')} className="flex items-center gap-1.5 px-3.5 py-1.5 font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition">
              <Save size={13} /> Save Draft
            </button>
          </div>
        </div>

        {/* RIGHT COPILOT PANEL CONTAINER */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 h-[calc(100vh-4rem)] relative overflow-hidden transition-all duration-500 ease-in-out flex flex-col justify-between">
          
          {/* SLIM COLLAPSED STRIP */}
          <div 
            className={`absolute inset-0 py-6 px-1 flex flex-col items-center justify-between transition-all duration-300 ease-in-out ${
              isChatCollapsed ? 'opacity-100 pointer-events-auto z-10' : 'opacity-0 pointer-events-none z-0'
            }`}
          >
            {/* Top: Expand Toggle */}
            <button
              onClick={() => setIsChatCollapsed(false)}
              title="Expand Assistant"
              className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-xl transition duration-200"
            >
              <PanelRightOpen size={18} />
            </button>

            {/* Bottom Group: Text directly above Bot Icon */}
            <button
              onClick={() => setIsChatCollapsed(false)}
              title="Expand Assistant"
              className="flex flex-col items-center gap-1.5 group cursor-pointer w-full px-1"
            >
              <div className="text-[10px] font-bold text-slate-400 group-hover:text-violet-600 transition tracking-tight text-center leading-tight">
                <span>AI</span>
                <span className="block text-[8px] font-semibold text-slate-400 group-hover:text-violet-500">Assistant</span>
              </div>

              <div className="w-9 h-9 rounded-xl bg-violet-50 group-hover:bg-violet-100 text-violet-600 flex items-center justify-center transition shadow-sm border border-violet-100">
                <Bot size={18} />
              </div>
            </button>
          </div>

          {/* EXPANDED CONTENT */}
          <div 
            className={`flex flex-col h-full justify-between p-6 w-full transition-all duration-300 ease-in-out ${
              isChatCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'
            }`}
          >
            <div className="flex flex-col h-full overflow-hidden w-full">
              
              {/* Header */}
              <div className="mb-4 pb-3 border-b border-slate-100 shrink-0 flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-violet-50 rounded-lg text-violet-600">
                    <Bot size={18} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">AIVOA Assistant</h2>
                    <p className="text-[11px] text-slate-400">Ask questions, attach PDFs, or paste raw text.</p>
                  </div>
                </div>

                <button
                  onClick={() => setIsChatCollapsed(true)}
                  title="Collapse Chat"
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  <PanelRightClose size={18} />
                </button>
              </div>

              {/* Chat History */}
              <div className="space-y-3.5 overflow-y-auto flex-1 pr-1 w-full custom-scrollbar">
                {chatHistory.map((msg, index) => (
                  <div key={index} className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.sender === 'bot' && (
                      <div className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold">
                        AI
                      </div>
                    )}
                    <div className={`p-3.5 rounded-2xl text-xs max-w-[85%] leading-relaxed ${
                      msg.sender === 'user' 
                        ? 'bg-violet-600 text-white rounded-tr-none' 
                        : 'bg-slate-50 text-slate-700 border border-slate-100 rounded-tl-none'
                    }`}>
                      {msg.text}
                    </div>
                    {msg.sender === 'user' && (
                      <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold">
                        U
                      </div>
                    )}
                  </div>
                ))}
                {loading && (
                  <div className="flex gap-2 items-center text-xs text-slate-400 italic">
                    <Bot size={16} className="text-violet-600 animate-spin" />
                    Analyzing complaint...
                  </div>
                )}
              </div>
            </div>

            {/* Input & Attachments */}
            <div className="pt-3 border-t border-slate-100 mt-2 shrink-0 relative w-full">
              {showAttachmentMenu && (
                <div className="absolute bottom-14 left-0 bg-white border border-slate-200 shadow-xl rounded-xl p-1.5 w-52 space-y-0.5 z-50 text-xs">
                  <button
                    type="button"
                    onClick={() => triggerFileInput('docFileInput')}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 hover:bg-slate-50 rounded-lg transition font-medium text-left"
                  >
                    <FileText size={15} className="text-blue-500" />
                    <span>Document (PDF, TXT)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerFileInput('photoFileInput')}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 hover:bg-slate-50 rounded-lg transition font-medium text-left"
                  >
                    <Image size={15} className="text-emerald-500" />
                    <span>Photo / Image</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerFileInput('emailFileInput')}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 hover:bg-slate-50 rounded-lg transition font-medium text-left"
                  >
                    <Mail size={15} className="text-purple-500" />
                    <span>Email File (.eml)</span>
                  </button>
                </div>
              )}

              <input type="file" id="docFileInput" accept=".pdf,.txt,.docx" className="hidden" onChange={(e) => handleFileUpload(e.target.files[0])} />
              <input type="file" id="photoFileInput" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e.target.files[0])} />
              <input type="file" id="emailFileInput" accept=".eml,.msg,.txt" className="hidden" onChange={(e) => handleFileUpload(e.target.files[0])} />

              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-violet-500/20 focus-within:bg-white focus-within:border-violet-300 transition w-full">
                <button
                  type="button"
                  onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                  className={`p-1 transition rounded-lg ${
                    showAttachmentMenu ? 'text-violet-600 bg-violet-50' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <Paperclip size={16} />
                </button>

                <input 
                  type="text" 
                  placeholder="Message AIVOA or drop files..." 
                  value={inputPrompt}
                  onChange={(e) => setInputPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendPrompt()}
                  onFocus={() => setShowAttachmentMenu(false)}
                  className="flex-1 bg-transparent border-none text-xs focus:outline-none text-slate-800 placeholder:text-slate-400 w-full" 
                />

                <button 
                  onClick={handleSendPrompt} 
                  disabled={loading} 
                  className="p-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition disabled:opacity-50"
                >
                  <Send size={13} />
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
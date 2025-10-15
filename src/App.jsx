import React, { useState, useMemo, useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Upload, FileText, LayoutDashboard, Bot, Settings, Menu, Calculator, LogOut, Download, BookUser, Search, Trash2, Send, CornerDownLeft, AlertTriangle, FileUp, Building, Users, Lock, X, Sparkles, KeyRound } from 'lucide-react';

// --- 模擬數據與設定 ---
const initialUsers = {
  '李執行長': { name: '李執行長', password: '1234', role: '執行長', permissions: ['read', 'ai_query', 'user_manage'] },
  '王大明': { name: '王大明', password: '1234', role: '財務長', permissions: ['read', 'write', 'delete', 'export', 'ai', 'ai_query', 'backup'] },
  '陳會計': { name: '陳會計', password: '1234', role: '會計人員', permissions: ['read', 'write'] }
};

const initialJournalEntries = [
  { id: 1, date: '2024-07-15', description: '辦公用品採購', category: '日常支出', amount: 5000, status: 'active', journalized: true, recorder: '王大明' },
  { id: 2, date: '2024-07-16', description: '專案 A 設計費收入', category: '專案收入', amount: 150000, status: 'active', journalized: true, recorder: '王大明' },
  { id: 3, date: '2024-07-18', description: '支付辦公室租金', category: '營運成本', amount: 30000, status: 'active', journalized: true, recorder: '陳會計' },
  { id: 4, date: '2024-07-20', description: '購買新電腦設備', category: '資產採購', amount: 80000, status: 'active', journalized: true, recorder: '陳會計' },
  { id: 5, date: '2024-07-22', description: '專案 B 預收款', category: '專案收入', amount: 50000, status: 'active', journalized: true, recorder: '王大明' },
  { id: 6, date: '2024-07-25', description: '支付員工薪資', category: '人事成本', amount: 120000, status: 'active', journalized: true, recorder: '陳會計' },
  { id: 7, date: '2024-07-28', description: '股東現金增資', category: '股東投資', amount: 500000, status: 'active', journalized: true, recorder: '李執行長' },
  { id: 8, date: '2024-08-02', description: '專案 C 服務費收入', category: '專案收入', amount: 250000, status: 'active', journalized: true, recorder: '王大明' },
  { id: 9, date: '2024-08-05', description: '支付廣告費用', category: '行銷成本', amount: 25000, status: 'active', journalized: true, recorder: '陳會計' },
];

const initialTransactions = [
  { id: 1, journalId: 1, date: '2024-07-15', description: '辦公用品採購', debit: '辦公費', credit: '銀行存款', amount: 5000, recorder: '王大明', status: 'active' },
  { id: 2, journalId: 2, date: '2024-07-16', description: '專案 A 設計費收入', debit: '銀行存款', credit: '勞務收入', amount: 150000, recorder: '王大明', status: 'active' },
  { id: 3, journalId: 3, date: '2024-07-18', description: '支付辦公室租金', debit: '租金支出', credit: '銀行存款', amount: 30000, recorder: '陳會計', status: 'active' },
  { id: 4, journalId: 4, date: '2024-07-20', description: '購買新電腦設備', debit: '電腦設備', credit: '銀行存款', amount: 80000, recorder: '陳會計', status: 'active' },
  { id: 5, journalId: 5, date: '2024-07-22', description: '專案 B 預收款', debit: '銀行存款', credit: '預收貨款', amount: 50000, recorder: '王大明', status: 'active' },
  { id: 6, journalId: 6, date: '2024-07-25', description: '支付員工薪資', debit: '薪資支出', credit: '銀行存款', amount: 120000, recorder: '陳會計', status: 'active' },
  { id: 7, journalId: 7, date: '2024-07-28', description: '股東現金增資', debit: '銀行存款', credit: '股本', amount: 500000, recorder: '李執行長', status: 'active' },
  { id: 8, journalId: 8, date: '2024-08-02', description: '專案 C 服務費收入', debit: '銀行存款', credit: '勞務收入', amount: 250000, recorder: '王大明', status: 'active' },
  { id: 9, journalId: 9, date: '2024-08-05', description: '支付廣告費用', debit: '廣告費', credit: '銀行存款', amount: 25000, recorder: '陳會計', status: 'active' },
];

const accountChart = {
  assets: ['銀行存款', '應收帳款', '電腦設備', '存貨'],
  liabilities: ['應付帳款', '預收貨款', '短期借款'],
  equity: ['股本', '資本公積', '保留盈餘'],
  revenue: ['勞務收入', '銷貨收入'],
  expense: ['薪資支出', '租金支出', '辦公費', '廣告費', '水電瓦斯費', '交通費', '餐飲費', '其他費用']
};

// --- Helper Functions ---
const getTransactionType = (debit, credit) => {
    if(accountChart.revenue.includes(credit)) return 'revenue';
    if(accountChart.expense.includes(debit)) return 'expense';
    if(accountChart.assets.includes(debit)) return 'asset';
    if(accountChart.liabilities.includes(credit)) return 'liability';
    if(accountChart.equity.includes(credit)) return 'equity';
    return 'other';
};

// Gemini API Caller (key from localStorage)
const callGeminiAPI = async (prompt, generationConfig = {}) => {
  const apiKey = localStorage.getItem('geminiApiKey') || '';
  if (!apiKey) {
    console.error('Gemini API key is not set.');
    return null;
  }
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig })
    });
    if (!response.ok) {
        const errorBody = await response.json().catch(()=>({}));
        console.error("Gemini API Error:", errorBody);
        throw new Error(`API request failed with status ${response.status}`);
    }
    const data = await response.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return null;
  }
};


// --- 組件 ---
const StatCard = ({ title, value, icon }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm flex flex-col justify-between">
    <div className="flex justify-between items-center mb-2"><h3 className="text-lg font-semibold text-gray-500">{title}</h3>{icon}</div>
    <div><p className="text-3xl font-bold text-gray-800">{value}</p></div>
  </div>
);

const Toast = ({ message, type, onDismiss }) => {
    if (!message) return null;
    const baseStyle = "fixed top-5 right-5 z-[100] p-4 rounded-lg shadow-lg text-white flex items-center";
    const typeStyles = { success: "bg-green-500", error: "bg-red-500", info: "bg-blue-500" };
    useEffect(() => { const timer = setTimeout(onDismiss, 3000); return () => clearTimeout(timer); }, [onDismiss]);
    return <div className={`${baseStyle} ${typeStyles[type]}`}>{message}<button onClick={onDismiss} className="ml-4 font-bold">X</button></div>;
};

// 儀表板視圖
const DashboardView = ({ transactions, currentUser, showToast }) => {
  const [period, setPeriod] = useState('month');
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const activeTransactions = transactions.filter(t => t.status === 'active');

  const filteredTransactions = useMemo(() => {
    const now = new Date();
    if (period === 'month') return activeTransactions.filter(t => { const d = new Date(t.date); return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth(); });
    if (period === 'year') return activeTransactions.filter(t => new Date(t.date).getFullYear() === now.getFullYear());
    return activeTransactions;
  }, [activeTransactions, period]);

  const summary = useMemo(() => {
    const totalRevenue = filteredTransactions.filter(t => getTransactionType(t.debit, t.credit) === 'revenue').reduce((acc, t) => acc + t.amount, 0);
    const totalExpense = filteredTransactions.filter(t => getTransactionType(t.debit, t.credit) === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const netProfit = totalRevenue - totalExpense;
    return { totalRevenue, totalExpense, netProfit };
  }, [filteredTransactions]);

  const ensureKeyOrToast = () => {
    const hasKey = !!localStorage.getItem('geminiApiKey');
    if (!hasKey) showToast("請先於系統設定 → API 金鑰 設定金鑰。", "error");
    return hasKey;
  };

  const handleGenerateAnalysis = async () => {
    if (!ensureKeyOrToast()) return;
    setIsAnalyzing(true);
    setAnalysis(null);
    showToast("✨ Gemini 正在為您產生分析報告...", "info");
    const dataSummary = `期間: ${period === 'month' ? '本月' : '本年'}, 總收入: NT$ ${summary.totalRevenue}, 總支出: NT$ ${summary.totalExpense}, 淨利: NT$ ${summary.netProfit}.`;
    const prompt = `您是一位資深財務分析師。根據以下摘要數據，為小型企業主提供一段簡潔（約3-4句話）的財務分析。點出一個關鍵趨勢，一個潛在風險，並給出一項具體建議。數據摘要: ${dataSummary}`;
    const result = await callGeminiAPI(prompt);
    if(result) { setAnalysis(result); showToast("分析報告已產生！", "success"); } else { showToast("AI 服務不可用：請先於系統設定 → API 金鑰設定金鑰。", "error"); }
    setIsAnalyzing(false);
  };

  const chartData = useMemo(() => {
      const dataByMonth = activeTransactions.reduce((acc, t) => {
          if (new Date(t.date).getFullYear() !== 2024) return acc;
          const month = new Date(t.date).toLocaleString('zh-TW', { month: 'long' });
          if (!acc[month]) acc[month] = { name: month, 收入: 0, 支出: 0 };
          if (getTransactionType(t.debit, t.credit) === 'revenue') acc[month].收入 += t.amount;
          if (getTransactionType(t.debit, t.credit) === 'expense') acc[month].支出 += t.amount;
          return acc;
      }, {});
      return Object.values(dataByMonth);
  }, [activeTransactions]);


  return (
    <div className="space-y-6">
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-800">儀表板總覽</h2>
          <div className="flex items-center gap-2 p-1 bg-gray-200 rounded-lg">
              <button onClick={() => setPeriod('month')} className={`px-4 py-1 rounded-md text-sm font-semibold ${period === 'month' ? 'bg-white shadow' : 'text-gray-600'}`}>本月</button>
              <button onClick={() => setPeriod('year')} className={`px-4 py-1 rounded-md text-sm font-semibold ${period === 'year' ? 'bg-white shadow' : 'text-gray-600'}`}>本年</button>
          </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard title="總收入" value={`NT$ ${summary.totalRevenue.toLocaleString()}`} icon={<div className="text-green-500"><FileText/></div>} />
        <StatCard title="總支出" value={`NT$ ${summary.totalExpense.toLocaleString()}`} icon={<div className="text-red-500"><FileText/></div>} />
        <StatCard title="淨利" value={`NT$ ${summary.netProfit.toLocaleString()}`} icon={<div className="text-blue-500"><FileText/></div>} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-white p-6 rounded-2xl shadow-sm">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">年度損益圖</h3>
          <ResponsiveContainer width="100%" height={300}><BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" /><YAxis tickFormatter={(value) => `${value/1000}k`}/><Tooltip formatter={(value) => `NT$ ${value.toLocaleString()}`} /><Legend /><Bar dataKey="收入" fill="#4ade80" radius={[4, 4, 0, 0]} /><Bar dataKey="支出" fill="#f87171" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer>
        </div>
        <div className={`lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm flex flex-col ${!currentUser.permissions.includes('ai') ? 'hidden' : ''}`}>
           <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-semibold text-gray-700">AI 財務分析</h3><Bot className="text-blue-500"/></div>
           <div className="flex-1 space-y-4">
             {isAnalyzing && <div className="text-center text-gray-500">分析中...</div>}
             {analysis && <div className="p-4 rounded-lg bg-blue-50 text-blue-800 text-sm">{analysis}</div>}
             {!analysis && !isAnalyzing && <div className="text-center text-gray-400 p-4">點擊下方按鈕，讓 Gemini 為您分析財務狀況。</div>}
           </div>
           <button onClick={handleGenerateAnalysis} disabled={isAnalyzing} className="btn-primary mt-4 w-full flex items-center justify-center gap-2">
             <Sparkles size={16}/> {isAnalyzing ? '分析中...' : '✨ 產生財務分析報告'}
           </button>
        </div>
      </div>
       <div className="bg-white p-6 rounded-2xl shadow-sm">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">最近分錄紀錄</h3>
        <div className="overflow-x-auto"><table className="w-full text-sm text-left text-gray-500"><thead className="text-xs text-gray-700 uppercase bg-gray-50"><tr><th scope="col" className="px-6 py-3">日期</th><th scope="col" className="px-6 py-3">描述</th><th scope="col" className="px-6 py-3">借方科目</th><th scope="col" className="px-6 py-3">貸方科目</th><th scope="col" className="px-6 py-3 text-right">金額</th></tr></thead><tbody>{activeTransactions.slice(0, 5).map(t => (<tr key={t.id} className="bg-white border-b hover:bg-gray-50"><td className="px-6 py-4">{t.date}</td><td className="px-6 py-4 font-medium text-gray-900">{t.description}</td><td className="px-6 py-4">{t.debit}</td><td className="px-6 py-4">{t.credit}</td><td className={`px-6 py-4 text-right font-medium`}>NT$ {t.amount.toLocaleString()}</td></tr>))}</tbody></table></div>
      </div>
    </div>
  );
};

// 流水帳視圖
const JournalView = ({ journalEntries, setJournalEntries, transactions, setTransactions, currentUser, showToast }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isCategorizing, setIsCategorizing] = useState(false);
    const [formData, setFormData] = useState({ date: '', amount: '', description: '', category: '', invoicePath: '' });

    const backendUrl = 'http://localhost:4321';

    const handleOCRUpload = () => {
        setIsUploading(true);
        showToast("模擬 OCR 辨識中...", "info");
        setTimeout(() => {
            setFormData({ date: new Date().toISOString().split('T')[0], amount: (Math.random() * 5000 + 500).toFixed(0), description: '網路服務月費', category: '營運成本', invoicePath: formData.invoicePath });
            setIsUploading(false);
            showToast("OCR 辨識成功！", "success");
        }, 1500);
    };

    const handleInvoiceFile = async (file) => {
        if (!file) return;
        try {
            const data = new FormData();
            data.append('file', file);
            const res = await fetch(`${backendUrl}/api/upload-invoice`, { method: 'POST', body: data });
            if (!res.ok) throw new Error('Upload failed');
            const json = await res.json();
            setFormData(prev => ({ ...prev, invoicePath: json.path }));
            showToast('發票已上傳', 'success');
        } catch (e) {
            showToast('發票上傳失敗', 'error');
        }
    };

    const handleInputChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const ensureKeyOrToast = () => {
        const hasKey = !!localStorage.getItem('geminiApiKey');
        if (!hasKey) showToast("請先於系統設定 → API 金鑰 設定金鑰。", "error");
        return hasKey;
    };

    const handleAICategorize = async () => {
        if (!formData.description) return showToast("請先輸入描述", "error");
        if (!ensureKeyOrToast()) return;
        setIsCategorizing(true);
        showToast("✨ Gemini 智慧分類中...", "info");
        const prompt = `根據交易描述 "${formData.description}"，建議一個最適合的會計費用類別。從以下列表中選擇一項: ${accountChart.expense.join(', ')}。並提供一個標準化的描述(不超過10個字)。以 JSON 格式回覆，格式為 {"category": "建議類別", "description": "標準化描述"}`;
        const result = await callGeminiAPI(prompt, { responseMimeType: "application/json" });
        if(result) {
            try {
                const parsedResult = JSON.parse(result);
                setFormData(prev => ({...prev, category: parsedResult.category || prev.category, description: parsedResult.description || prev.description }));
                showToast("智慧分類完成！", "success");
            } catch (e) {
                showToast("無法解析 AI 回應", "error");
            }
        } else {
            showToast("AI 服務不可用：請先於系統設定 → API 金鑰設定金鑰。", "error");
        }
        setIsCategorizing(false);
    };
    
    const handleAddJournalEntry = (e) => {
        e.preventDefault();
        const newEntry = { id: Date.now(), ...formData, amount: parseFloat(formData.amount), status: 'active', journalized: true, recorder: currentUser.name };
        setJournalEntries(prev => [newEntry, ...prev]);
        let debit = formData.category, credit = '銀行存款';
        if (Object.values(accountChart).flat().indexOf(debit) === -1) debit = '其他費用';
        const newTransaction = { id: Date.now() + 1, journalId: newEntry.id, date: newEntry.date, description: newEntry.description, debit, credit, amount: newEntry.amount, recorder: currentUser.name, status: 'active' };
        setTransactions(prev => [newTransaction, ...prev]);
        setIsModalOpen(false);
        setFormData({ date: '', amount: '', description: '', category: '', invoicePath: '' });
        showToast("流水帳已新增並自動產生分錄！", "success");
    };

    const handleDeleteJournalEntry = (id) => {
        if (!currentUser.permissions.includes('delete')) return showToast("權限不足", "error");
        if (window.confirm("確定要作廢此筆流水帳嗎？相關會計分錄也會一併作廢。")) {
            setJournalEntries(journalEntries.map(e => e.id === id ? { ...e, status: 'deleted', deletedBy: currentUser.name } : e));
            setTransactions(transactions.map(t => t.journalId === id ? { ...t, status: 'deleted', deletedBy: currentUser.name } : t));
            showToast("項目已成功作廢", "success");
        }
    };
    
    return (
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6"><h2 className="text-2xl font-bold text-gray-800">收支流水帳</h2>{currentUser.permissions.includes('write') && (<button onClick={() => setIsModalOpen(true)} className="btn-primary w-full sm:w-auto flex items中心 justify-center gap-2">新增流水帳</button>)}</div>
            <div className="overflow-x-auto"><table className="w-full text-sm text-left text-gray-500"><thead className="text-xs text-gray-700 uppercase bg-gray-50"><tr><th className="px-6 py-3">日期</th><th className="px-6 py-3">描述</th><th className="px-6 py-3">類別</th><th className="px-6 py-3">登記者</th><th className="px-6 py-3 text-right">金額</th><th className="px-6 py-3">狀態</th><th className="px-6 py-3">操作</th></tr></thead><tbody>{journalEntries.map(e => (<tr key={e.id} className={`border-b hover:bg-gray-50 ${e.status === 'deleted' ? 'bg-red-50 text-gray-400 line-through' : ''}`}><td className="px-6 py-4">{e.date}</td><td className="px-6 py-4 font-medium text-gray-900">{e.description} {e.invoicePath && <a className="ml-2 text-blue-600 underline" href={e.invoicePath} target="_blank" rel="noreferrer">發票</a>} {e.status === 'deleted' && <span className="text-red-500 text-xs ml-2">(作廢 by {e.deletedBy})</span>}</td><td className="px-6 py-4">{e.category}</td><td className="px-6 py-4">{e.recorder}</td><td className="px-6 py-4 text-right font-medium text-gray-800">NT$ {e.amount.toLocaleString()}</td><td className="px-6 py-4"><span className="bg-green-100 text-green-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded-full">已入帳</span></td><td className="px-6 py-4">{e.status === 'active' && currentUser.permissions.includes('delete') && (<button onClick={() => handleDeleteJournalEntry(e.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16}/></button>)}</td></tr>))}</tbody></table></div>
             {isModalOpen && (<div className="fixed inset-0 bg黑 bg-opacity-50 flex justify-center items-center z-50 p-4"><div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-lg"><h3 className="text-xl font-bold mb-6">新增流水帳</h3><label className="block text-sm font-medium mb-2">上傳發票（將儲存至伺服器）</label><div className="w-full flex items-center justify-center gap-2 py-3 px-4 border-2 border-dashed rounded-lg text-gray-500 hover:bg-gray-100 hover:border-gray-400 transition mb-6"><input type="file" accept="image/*" onChange={e=>handleInvoiceFile(e.target.files[0])} /></div><button onClick={handleOCRUpload} disabled={isUploading} className="w-full flex items-center justify-center gap-2 py-3 px-4 border-2 border-dashed rounded-lg text-gray-500 hover:bg-gray-100 hover:border-gray-400 transition mb-6">{isUploading ? "辨識中..." : <><Upload size={20} /> 上傳發票 (模擬 OCR)</>}</button><form onSubmit={handleAddJournalEntry} className="space-y-4"><div><label className="block text-sm font-medium">日期</label><input type="date" name="date" value={formData.date} onChange={handleInputChange} required className="mt-1 block w-full input"/></div><div><label className="block text-sm font-medium">金額</label><input type="number" name="amount" value={formData.amount} onChange={handleInputChange} required className="mt-1 block w-full input"/></div><div className="relative"> <label className="block text-sm font-medium">描述</label><input type="text" name="description" value={formData.description} onChange={handleInputChange} required className="mt-1 block w-full input pr-12"/><button type="button" onClick={handleAICategorize} disabled={isCategorizing} title="Gemini 智慧分類" className="absolute right-1 bottom-1 p-2 text-blue-600 hover:bg-blue-100 rounded-full">{isCategorizing ? <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div> : <Sparkles size={18}/>}</button></div><div><label className="block text-sm font-medium">類別</label><input type="text" name="category" value={formData.category} onChange={handleInputChange} placeholder="例如: 專案收入, 營運成本" required className="mt-1 block w-full input"/></div><div className="flex justify-end gap-3 pt-4"><button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">取消</button><button type="submit" className="btn-primary">儲存</button></div></form></div></div>)}
        </div>
    );
};

// 交易視圖 (會計分錄)
const TransactionsView = ({ transactions, setTransactions, currentUser, showToast }) => {
    const handleDeleteTransaction = (id) => {
        if(!currentUser.permissions.includes('delete')) return showToast("權限不足", "error");
        if (window.confirm("確定要作廢此筆傳票嗎？此操作會連同原始流水帳一併作廢。")) {
            setTransactions(transactions.map(t => t.id === id ? { ...t, status: 'deleted', deletedBy: currentUser.name } : t));
            showToast("傳票已作廢", "success");
        }
    };

    return (
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h2 className="text-2xl font-bold text-gray-800">會計分錄 (傳票)</h2>
            </div>
            <p className="text-sm text-gray-500 mb-4">所有分錄皆由流水帳自動產生。如需修改，請作廢原始流水帳後重新建立。</p>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr><th className="px-6 py-3">日期</th><th className="px-6 py-3">描述</th><th className="px-6 py-3">借方科目</th><th className="px-6 py-3">貸方科目</th><th className="px-6 py-3">登記者</th><th className="px-6 py-3 text-right">金額</th><th className="px-6 py-3">操作</th></tr>
                    </thead>
                    <tbody>
                        {transactions.map(t => (
                            <tr key={t.id} className={`border-b hover:bg-gray-50 ${t.status === 'deleted' ? 'bg-red-50 text-gray-400 line-through' : ''}`}>
                                <td className="px-6 py-4">{t.date}</td>
                                <td className="px-6 py-4 font-medium text-gray-900">{t.description} {t.status === 'deleted' && <span className="text-red-500 text-xs ml-2">(作廢 by {t.deletedBy})</span>}</td>
                                <td className="px-6 py-4">{t.debit}</td>
                                <td className="px-6 py-4">{t.credit}</td>
                                <td className="px-6 py-4">{t.recorder}</td>
                                <td className={`px-6 py-4 text-right font-medium text-gray-800`}> NT$ {t.amount.toLocaleString()} </td>
                                <td className="px-6 py-4">{t.status === 'active' && currentUser.permissions.includes('delete') && (<button onClick={() => handleDeleteTransaction(t.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16}/></button>)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// 財務報表視圖
const ReportsView = ({ transactions, currentUser, showToast }) => {
    const [activeTab, setActiveTab] = useState('income');

    const backendUrl = 'http://localhost:4321';

    const reportData = useMemo(() => {
      const activeTransactions = transactions.filter(t => t.status === 'active');
      const revenues = activeTransactions.filter(t => getTransactionType(t.debit, t.credit) === 'revenue');
      const expenses = activeTransactions.filter(t => getTransactionType(t.debit, t.credit) === 'expense');
      const totalRevenues = revenues.reduce((s, t) => s + t.amount, 0);
      const totalExpenses = expenses.reduce((s, t) => s + t.amount, 0);
      const netIncome = totalRevenues - totalExpenses;
      const cash = activeTransactions.reduce((b, t) => (t.debit === '銀行存款' ? b + t.amount : (t.credit === '銀行存款' ? b - t.amount : b)), 0);
      const equipment = activeTransactions.filter(t=>t.debit==='電腦設備').reduce((s, t) => s + t.amount, 0);
      const prepaid = activeTransactions.filter(t=>t.credit==='預收貨款').reduce((s, t) => s + t.amount, 0);
      const shareCapital = activeTransactions.filter(t=>t.credit==='股本').reduce((s, t) => s + t.amount, 0);
      return {
        incomeStatement: { period: "2024-01-01 至 2024-12-31", revenues: revenues.map(r=>({item: r.credit, amount: r.amount})), expenses: expenses.map(e=>({item: e.debit, amount: e.amount})), netIncome, totalRevenues },
        balanceSheet: { date: "2024-12-31", assets: [{item:'銀行存款', amount:cash}, {item:'電腦設備', amount:equipment}], liabilities: [{item:'預收貨款', amount:prepaid}], equity: [{item:'股本', amount:shareCapital}, {item:'本期損益', amount:netIncome}]},
        cashFlow: { operating: totalRevenues - totalExpenses, investing: -equipment, financing: shareCapital},
        equityStatement: { openingBalance: 0, netIncome, capitalInjection: shareCapital, closingBalance: netIncome + shareCapital}
      };
    }, [transactions]);
    
    const handleExport = async () => {
      try {
        const res = await fetch(`${backendUrl}/api/reports/export/excel`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transactions })
        });
        if (!res.ok) throw new Error('Export failed');
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'transactions.xlsx';
        a.click();
        window.URL.revokeObjectURL(url);
        showToast('已匯出 Excel', 'success');
      } catch (e) {
        showToast('匯出失敗，請稍後重試', 'error');
      }
    };
    const renderReportTable = (items, isSub=false) => (items.map((row, index) => (<tr key={index} className="border-b"><td className={`py-3 px-6 ${isSub ? 'pl-10':''}`}>{row.item}</td><td className="py-3 px-6 text-right font-mono">{row.amount.toLocaleString()}</td></tr>)));
    const calculateTotal = items => items.reduce((sum, item) => sum + item.amount, 0);
    const totalAssets = calculateTotal(reportData.balanceSheet.assets);
    const totalLiabilities = calculateTotal(reportData.balanceSheet.liabilities);
    const totalEquity = calculateTotal(reportData.balanceSheet.equity);
    const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;
    const totalRevenues = calculateTotal(reportData.incomeStatement.revenues);
    const totalExpenses = calculateTotal(reportData.incomeStatement.expenses);
    const netIncome = totalRevenues - totalExpenses;
  
    const renderContent = () => {
      switch(activeTab) {
        case 'balance': return (<div><h3 className="text-xl font-bold mb-1">資產負債表</h3><p className="text-sm text灰-500 mb-4">截至 {reportData.balanceSheet.date}</p><div className="grid grid-cols-1 md:grid-cols-2 gap-8"><div><table className="w-full"><thead><tr className="border-b-2"><th className="py-2 px-6 text-left text-lg">資產</th><th/></tr></thead><tbody>{renderReportTable(reportData.balanceSheet.assets)}<tr className="border-t-2 font-bold bg-gray-50"><td className="py-3 px-6">資產總計</td><td className="py-3 px-6 text-right font-mono">{totalAssets.toLocaleString()}</td></tr></tbody></table></div><div><table className="w-full"><thead><tr className="border-b-2"><th className="py-2 px-6 text-left text-lg">負債</th><th/></tr></thead><tbody>{renderReportTable(reportData.balanceSheet.liabilities)}<tr className="font-bold bg-gray-50 border-y"><td className="py-3 px-6">負債總計</td><td className="py-3 px-6 text-right font-mono">{totalLiabilities.toLocaleString()}</td></tr></tbody></table><table className="w-full mt-4"><thead><tr className="border-b-2"><th className="py-2 px-6 text-left text-lg">股東權益</th><th/></tr></thead><tbody>{renderReportTable(reportData.balanceSheet.equity)}<tr className="font-bold bg-gray-50 border-y"><td className="py-3 px-6">權益總計</td><td className="py-3 px-6 text-right font-mono">{totalEquity.toLocaleString()}</td></tr></tbody></table><table className="w-full mt-4"><tbody><tr className="border-t-2 font-bold bg-blue-50"><td className="py-3 px-6">負債及股東權益總計</td><td className="py-3 px-6 text-right font-mono">{totalLiabilitiesAndEquity.toLocaleString()}</td></tr></tbody></table></div></div></div>);
        case 'income': return (<div><h3 className="text-xl font-bold mb-1">綜合損益表</h3><p className="text-sm text-gray-500 mb-4">期間 {reportData.incomeStatement.period}</p><table className="w-full"><thead><tr className="border-b-2"><th className="py-2 px-6 text-left text-lg">項目</th><th className="py-2 px-6 text-right text-lg">金額</th></tr></thead><tbody><tr className="font-semibold"><td className="py-3 px-6">營業收入</td><td/></tr>{renderReportTable(reportData.incomeStatement.revenues, true)}<tr className="font-bold bg-gray-50 border-y"><td className="py-3 px-6">營業收入合計</td><td className="py-3 px-6 text-right font-mono">{totalRevenues.toLocaleString()}</td></tr><tr className="font-semibold"><td className="py-3 px-6">營業費用</td><td/></tr>{renderReportTable(reportData.incomeStatement.expenses, true)}<tr className="font-bold bg-gray-50 border-y"><td className="py-3 px-6">營業費用合計</td><td className="py-3 px-6 text-right font-mono">{totalExpenses.toLocaleString()}</td></tr><tr className="font-bold text-lg bg-blue-50 border-t-2"><td className="py-4 px-6">本期淨利</td><td className="py-4 px-6 text-right font-mono">{netIncome.toLocaleString()}</td></tr></tbody></table></div>);
        case 'cashflow': const netCashFlow = reportData.cashFlow.operating + reportData.cashFlow.investing + reportData.cashFlow.financing; return (<div><h3 className="text-xl font-bold mb-1">現金流量表</h3><p className="text-sm text-gray-500 mb-4">期間 2024-01-01 至 2024-12-31 (直接法)</p><table className="w-full"><tbody><tr className="border-b"><td className="py-3 px-6 font-semibold">營業活動現金流量</td><td className="py-3 px-6 text-right font-mono">{reportData.cashFlow.operating.toLocaleString()}</td></tr><tr className="border-b"><td className="py-3 px-6 font-semibold">投資活動現金流量</td><td className="py-3 px-6 text-right font-mono">{reportData.cashFlow.investing.toLocaleString()}</td></tr><tr className="border-b"><td className="py-3 px-6 font-semibold">籌資活動現金流量</td><td className="py-3 px-6 text-right font-mono">{reportData.cashFlow.financing.toLocaleString()}</td></tr><tr className="font-bold text-lg bg-blue-50 border-t-2"><td className="py-4 px-6">本期現金及約當現金淨增加(減少)數</td><td className="py-4 px-6 text-right font-mono">{netCashFlow.toLocaleString()}</td></tr></tbody></table></div>);
        case 'equity': return (<div><h3 className="text-xl font-bold mb-1">權益變動表</h3><p className="text-sm text-gray-500 mb-4">期間 2024-01-01 至 2024-12-31</p><table className="w-full"><tbody><tr className="border-b"><td className="py-3 px-6">期初餘額</td><td className="py-3 px-6 text-right font-mono">{reportData.equityStatement.openingBalance.toLocaleString()}</td></tr><tr className="border-b"><td className="py-3 px-6">本期淨利</td><td className="py-3 px-6 text-right font-mono">{reportData.equityStatement.netIncome.toLocaleString()}</td></tr><tr className="border-b"><td className="py-3 px-6">現金增資</td><td className="py-3 px-6 text-right font-mono">{reportData.equityStatement.capitalInjection.toLocaleString()}</td></tr><tr className="font-bold text-lg bg-blue-50 border-t-2"><td className="py-4 px-6">期末餘額</td><td className="py-4 px-6 text-right font-mono">{reportData.equityStatement.closingBalance.toLocaleString()}</td></tr></tbody></table></div>);
        default: return <div className="text-center p-10 text-gray-500">報表建置中</div>;
      }
    };
    const tabs = [ { id: 'income', label: '綜合損益表' }, { id: 'balance', label: '資產負債表' }, { id: 'cashflow', label: '現金流量表' }, { id: 'equity', label: '權益變動表' } ];
    return (<div className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl shadow-sm"><div className="flex justify-between items-center mb-6 border-b pb-4"><h2 className="text-2xl font-bold text-gray-800">財務報表</h2>{currentUser.permissions.includes('export') && (<button onClick={handleExport} className="btn-secondary flex items-center gap-2"> <Download size={16} /> 匯出 Excel </button>)}</div><div className="mb-6"><div className="border-b border-gray-200"><nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">{tabs.map(tab => (<button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`${ activeTab === tab.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}>{tab.label}</button>))}</nav></div></div><div>{renderContent()}</div></div>);
};

// 總帳查詢
const GeneralLedgerView = ({ transactions }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [account, setAccount] = useState('');
    const activeTransactions = transactions.filter(t => t.status === 'active');
    const filteredTransactions = useMemo(() => {
        if (!account) return [];
        return activeTransactions.filter(t => (t.debit === account || t.credit === account) && t.description.includes(searchTerm));
    }, [activeTransactions, account, searchTerm]);
    const allAccounts = useMemo(() => {
        const accounts = new Set();
        activeTransactions.forEach(t => { accounts.add(t.debit); accounts.add(t.credit); });
        return Array.from(accounts).sort();
    }, [activeTransactions]);
    return (<div className="bg-white p-6 rounded-2xl shadow-sm space-y-4"><h2 className="text-2xl font-bold text-gray-800">總帳查詢</h2><div className="flex flex-col md:flex-row gap-4"><select onChange={(e) => setAccount(e.target.value)} value={account} className="flex-1 mt-1 block w-full input"><option value="">-- 請選擇會計科目 --</option>{allAccounts.map(acc => <option key={acc} value={acc}>{acc}</option>)}</select><div className="relative flex-1"><input type="text" placeholder="篩選描述..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg"/><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} /></div></div>{account && (<div className="overflow-x-auto"><table className="w-full text-sm text-left text-gray-500"><thead className="text-xs text-gray-700 uppercase bg-gray-50"><tr><th className="px-6 py-3">日期</th><th className="px-6 py-3">描述</th><th className="px-6 py-3 text-right">借方金額</th><th className="px-6 py-3 text-right">貸方金額</th></tr></thead><tbody>{filteredTransactions.map(t => (<tr key={t.id} className="bg-white border-b hover:bg-gray-50"><td className="px-6 py-4">{t.date}</td><td className="px-6 py-4">{t.description}</td><td className="px-6 py-4 text-right font-mono text-green-600">{t.debit === account ? t.amount.toLocaleString() : '-'}</td><td className="px-6 py-4 text-right font-mono text-red-600">{t.credit === account ? t.amount.toLocaleString() : '-'}</td></tr>))}</tbody></table></div>)}</div>);
};

// 計算機
const CalculatorWidget = ({onClose}) => {
    const [input, setInput] = useState('');
    const [result, setResult] = useState('');
    const handleButtonClick = (value) => {
        if (value === 'C') { setInput(''); setResult(''); } 
        else if (value === '=') { try { const sanitizedInput = input.replace(/×/g, '*').replace(/÷/g, '/'); if (!sanitizedInput || /[^-()\d/*+.]/.test(sanitizedInput)) { throw new Error("Invalid expression"); } const calculatedResult = new Function('return ' + sanitizedInput)(); setResult(calculatedResult.toString()); } catch (error) { setResult('Error'); } } else { setInput(input + value); }
    };
    const buttons = ['7','8','9','÷','4','5','6','×','1','2','3','-','0','.','+','C','='];
    return (<div className="fixed bottom-24 right-8 bg-white rounded-2xl shadow-2xl p-4 w-64 z-50 border"><div className="bg-gray-100 rounded-lg p-2 text-right mb-4"><div className="text-gray-500 text-sm h-6 break-all">{input}</div><div className="text-2xl font-bold h-9">{result}</div></div><div className="grid grid-cols-4 gap-2">{buttons.map(btn => ( <button key={btn} onClick={() => handleButtonClick(btn)} className={`p-3 rounded-lg text-lg font-semibold transition ${btn === '=' ? 'col-span-2 bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-200 hover:bg-gray-300'}`}>{btn}</button>))}</div><button onClick={onClose} className="absolute -top-2 -right-2 bg-gray-300 text-gray-700 rounded-full w-6 h-6 flex items-center justify-center font-bold hover:bg-red-500 hover:text-white">&times;</button></div>);
};

// AI 聊天室
const AIChatView = ({ transactions, showToast }) => {
    const [messages, setMessages] = useState([{ sender: 'ai', text: '您好！我是您的 AI 財務助理，請問有什麼可以協助您的嗎？' }]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatEndRef = useRef(null);

    const ensureKeyOrToast = () => {
      const hasKey = !!localStorage.getItem('geminiApiKey');
      if (!hasKey) showToast("請先於系統設定 → API 金鑰 設定金鑰。", "error");
      return hasKey;
    };

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;
        if (!ensureKeyOrToast()) return;
        const newMessages = [...messages, { sender: 'user', text: input }];
        setMessages(newMessages);
        setInput('');
        setIsLoading(true);

        const transactionContext = transactions.filter(t=>t.status==='active').slice(0,10).map(t => `${t.date} - ${t.description}: NT$ ${t.amount} (${t.debit} / ${t.credit})`).join("\n");
        const prompt = `您是一位名為「財帳雲助理」的專業AI會計師。請根據以下最新的交易紀錄摘要和使用者的問題，提供簡潔、專業的回答。請僅根據提供的數據回答，若資料不足請委婉告知。\n\n[交易紀錄摘要]\n${transactionContext}\n\n[使用者問題]\n${newMessages[newMessages.length-1].text}`;
        
        const result = await callGeminiAPI(prompt);
        
        if (result) {
            setMessages(prev => [...prev, { sender: 'ai', text: result }]);
        } else {
            showToast("無法連接到 AI 助理", "error");
            setMessages(prev => [...prev, { sender: 'ai', text: "抱歉，我目前無法回應，請稍後再試。" }]);
        }
        setIsLoading(false);
    };

    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

    return (
        <div className="bg-white rounded-2xl shadow-sm h-full flex flex-col">
            <h2 className="text-2xl font-bold text-gray-800 p-6 border-b">✨ AI 智能問答 (Gemini)</h2>
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
                {messages.map((msg, index) => (<div key={index} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : ''}`}>{msg.sender === 'ai' && <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center flex-shrink-0"><Bot size={20}/></div>}<div className={`max-w-md p-3 rounded-2xl ${msg.sender === 'user' ? 'bg-blue-500 text-white rounded-br-none' : 'bg-gray-200 text-gray-800 rounded-bl-none'}`}>{msg.text}</div></div>))}
                {isLoading && <div className="flex items-end gap-2"><div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center flex-shrink-0"><Bot size={20}/></div><div className="max-w-md p-3 rounded-2xl bg-gray-200 text-gray-800 rounded-bl-none">思考中...</div></div>}
                <div ref={chatEndRef} />
            </div>
            <div className="p-6 border-t"><div className="relative"><input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="請在此輸入您的問題..." disabled={isLoading} className="w-full input pr-24"/><button onClick={handleSend} disabled={isLoading} className="absolute right-2 top-1/2 -translate-y-1/2 btn-primary flex items-center gap-2"><Send size={16}/></button></div></div>
        </div>
    );
};


// 系統設定
const SettingsView = ({ users, setUsers, currentUser, showToast }) => {
    const [activeTab, setActiveTab] = useState('users');
    const [apiKey, setApiKey] = useState(''); 
    
    const UserManagement = () => {
        const [newPassword, setNewPassword] = useState('');
        const [editingUser, setEditingUser] = useState(null);
        const handlePasswordChange = (username, password) => {
            if (!password) return showToast("密碼不能為空", "error");
            setUsers(prev => ({...prev, [username]: {...prev[username], password}}));
            showToast(`${username} 的密碼已更新`, "success");
            setEditingUser(null);
            setNewPassword('');
        };
        if (!currentUser.permissions.includes('user_manage')) {
             return (<div className="max-w-md"><h3 className="text-lg font-semibold mb-2">更改我的密碼</h3><div className="flex gap-2"><input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="input" placeholder="輸入新密碼" /><button onClick={() => handlePasswordChange(currentUser.name, newPassword)} className="btn-primary">儲存</button></div></div>);
        }
        return (<div><h3 className="text-lg font-semibold mb-4">使用者帳號管理</h3><div className="overflow-x-auto"><table className="w-full text-sm">
            <thead className="bg-gray-50"><tr><th className="p-3 text-left">姓名</th><th className="p-3 text-left">角色</th><th className="p-3 text-left">操作</th></tr></thead>
            <tbody>{Object.values(users).map(user => (<tr key={user.name} className="border-b"><td className="p-3">{user.name}</td><td className="p-3">{user.role}</td><td className="p-3">{editingUser === user.name ? (<div className="flex gap-2"><input type="text" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="input text-sm" placeholder="輸入新密碼"/><button onClick={() => handlePasswordChange(user.name, newPassword)} className="btn-primary text-sm">確認</button><button onClick={() => setEditingUser(null)} className="btn-secondary text-sm">取消</button></div>) : (<button onClick={() => setEditingUser(user.name)} className="text-blue-600 hover:underline">重設密碼</button>)}</td></tr>))}</tbody>
        </table></div></div>);
    };

    const ApiKeyManagement = () => {
      const [inputKey, setInputKey] = useState('');
      const [savedKey, setSavedKey] = useState(() => localStorage.getItem('geminiApiKey') || '');
      const maskKey = (key) => (key ? `${key.slice(0, 6)}...${key.slice(-4)}` : '');
      const handleSave = () => {
        if (!inputKey.trim()) return showToast("請輸入有效的 API 金鑰", "error");
        localStorage.setItem('geminiApiKey', inputKey.trim());
        setSavedKey(inputKey.trim());
        setInputKey('');
        showToast("API 金鑰已儲存", "success");
      };
      const handleRemove = () => {
        localStorage.removeItem('geminiApiKey');
        setSavedKey('');
        showToast("API 金鑰已移除", "success");
      };
      return (
        <div>
          <h3 className="text-lg font-semibold mb-2">Gemini API 金鑰管理</h3>
          {savedKey ? (
            <div className="space-y-3 max-w-md">
              <p className="text-sm text-gray-600">目前已設定的金鑰：<span className="font-mono">{maskKey(savedKey)}</span></p>
              <div className="flex gap-2"><button onClick={handleRemove} className="btn-secondary">移除金鑰</button></div>
            </div>
          ) : (
            <div className="space-y-3 max-w-md">
              <p className="text-sm text-gray-500">請貼上您的 Gemini API Key 以啟用 AI 功能。</p>
              <div className="flex gap-2"><input type="password" value={inputKey} onChange={(e)=>setInputKey(e.target.value)} className="input" placeholder="AIzaSy..." /><button onClick={handleSave} className="btn-primary">儲存</button></div>
            </div>
          )}
        </div>
      );
    };

    const CompanyProfile = () => (
        <div>
            <h3 className="text-lg font-semibold mb-4">公司資訊</h3>
            <div className="space-y-4 max-w-md">
                <div><label className="block text-sm font-medium">公司名稱</label><input type="text" defaultValue="財帳雲科技有限公司" className="input mt-1"/></div>
                <div><label className="block text-sm font-medium">統一編號</label><input type="text" defaultValue="12345678" className="input mt-1"/></div>
                <button onClick={() => showToast("公司資訊已更新", "success")} className="btn-primary">儲存變更</button>
            </div>
        </div>
    );
    
    const tabs = [
        {id: 'users', label: '使用者管理', icon: <Users/>},
        {id: 'profile', label: '公司資訊', icon: <Building/>},
        {id: 'api', label: 'API 金鑰', icon: <KeyRound/>},
    ];

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm">
             <div className="mb-6 border-b">
                <nav className="-mb-px flex space-x-6 overflow-x-auto">
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 py-3 px-1 ${activeTab === tab.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'} border-b-2`}>
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </nav>
            </div>
             {activeTab === 'users' && <UserManagement />}
             {activeTab === 'profile' && <CompanyProfile />}
             {activeTab === 'api' && <ApiKeyManagement />}
        </div>
    );
};


// 登入畫面
const LoginScreen = ({ onLogin, setErrorMessage, errorMessage, users }) => {
    const handleLogin = (e) => {
        e.preventDefault();
        const username = e.target.username.value;
        const password = e.target.password.value;
        const user = users[username];
        if (user && user.password === password) { onLogin(user); setErrorMessage(''); } else { setErrorMessage('帳號或密碼錯誤'); }
    };
    return (<div className="w-full h-screen flex items-center justify-center bg-gray-100 p-4"><div className="bg-white p-8 sm:p-12 rounded-2xl shadow-xl text-center w-full max-w-sm"><h1 className="text-3xl font-bold mb-2">歡迎使用財帳雲</h1><p className="text-gray-500 mb-8">請登入您的帳戶</p><form onSubmit={handleLogin} className="space-y-4"><input type="text" name="username" placeholder="帳號 (例如: 王大明)" required className="w-full input"/><input type="password" name="password" placeholder="密碼 (預設: 1234)" required className="w-full input"/>{errorMessage && <p className="text-red-500 text-sm">{errorMessage}</p>}<button type="submit" className="w-full btn-primary py-3">登入</button></form></div></div>);
};


// 主應用程式組件
export default function App() {
  const [users, setUsers] = useState(initialUsers);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeView, setActiveView] = useState('dashboard');
  const [journalEntries, setJournalEntries] = useState(initialJournalEntries);
  const [transactions, setTransactions] = useState(initialTransactions);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
  const [showCalculator, setShowCalculator] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [toast, setToast] = useState({ message: '', type: '' });

  const showToast = (message, type) => { setToast({ message, type }); };
  
  useEffect(() => { const handleResize = () => setIsSidebarOpen(window.innerWidth >= 768); window.addEventListener('resize', handleResize); return () => window.removeEventListener('resize', handleResize); }, []);

  const backendUrl = 'http://localhost:4321';

  const handleLogout = () => { setIsLoggedIn(false); setCurrentUser(null); setActiveView('dashboard'); };

  const handleBackup = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/backup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ users, journalEntries, transactions })
      });
      if (!res.ok) throw new Error('backup failed');
      showToast('備份成功', 'success');
    } catch (e) {
      showToast('備份失敗', 'error');
    }
  };

  if (!isLoggedIn) {
      return <LoginScreen users={users} onLogin={(user) => { setCurrentUser(user); setIsLoggedIn(true); }} errorMessage={errorMessage} setErrorMessage={setErrorMessage} />;
  }
  
  const renderView = () => {
    switch (activeView) {
      case 'dashboard': return <DashboardView transactions={transactions} currentUser={currentUser} showToast={showToast} />;
      case 'journal': return <JournalView journalEntries={journalEntries} setJournalEntries={setJournalEntries} transactions={transactions} setTransactions={setTransactions} currentUser={currentUser} showToast={showToast}/>;
      case 'transactions': return <TransactionsView transactions={transactions} setTransactions={setTransactions} currentUser={currentUser} showToast={showToast}/>;
      case 'reports': return <ReportsView transactions={transactions} currentUser={currentUser} showToast={showToast} />;
      case 'ledger': return <GeneralLedgerView transactions={transactions} />;
      case 'ai': return <AIChatView transactions={transactions} showToast={showToast} />;
      case 'settings': return <SettingsView users={users} setUsers={setUsers} currentUser={currentUser} showToast={showToast}/>;
      default: return <div className="text-center p-10 text-gray-500">頁面建置中</div>;
    }
  };

  const NavLink = ({ view, icon, label, permission }) => { if (permission && !currentUser.permissions.includes(permission)) { return null; } const isActive = activeView === view; return (<li><a href="#" onClick={(e) => { e.preventDefault(); setActiveView(view); if (window.innerWidth < 768) setIsSidebarOpen(false); }} className={`flex items-center p-3 rounded-lg text-gray-700 hover:bg-gray-200 transition-colors ${isActive ? 'bg-blue-100 text-blue-700 font-bold' : ''}`}>{icon}<span className={`ml-3 flex-1 whitespace-nowrap ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>{label}</span></a></li>);};
  const topNavItems = [{ view: 'dashboard', icon: <LayoutDashboard />, label: '儀表板總覽'}, { view: 'journal', icon: <FileUp />, label: '流水帳管理' }, { view: 'transactions', icon: <FileText />, label: '會計分錄' }, { view: 'ledger', icon: <BookUser />, label: '總帳查詢' }, { view: 'reports', icon: <FileText />, label: '財務報表' }];
  const bottomNavItems = [{ view: 'ai', icon: <Bot />, label: 'AI 智能問答', permission: 'ai_query' }, { view: 'settings', icon: <Settings />, label: '系統設定' }];

  return (
    <div className="bg-gray-50 min-h-screen flex text-gray-800">
       <style>{`.input { border: 1px solid #e2e8f0; padding: 0.5rem 0.75rem; border-radius: 0.5rem; width: 100%; outline-color: #3b82f6; } .btn-primary { background-color: #2563eb; color: white; padding: 0.5rem 1rem; border-radius: 0.5rem; font-weight: 600; transition: background-color 0.2s; display: inline-flex; align-items: center; justify-content: center; } .btn-primary:hover { background-color: #1d4ed8; } .btn-primary:disabled { background-color: #93c5fd; cursor: not-allowed; } .btn-secondary { background-color: #e2e8f0; color: #1f2937; padding: 0.5rem 1rem; border-radius: 0.5rem; font-weight: 600; transition: background-color 0.2s; } .btn-secondary:hover { background-color: #cbd5e1; }`}</style>
      <Toast message={toast.message} type={toast.type} onDismiss={() => setToast({ message: '', type: '' })} />
      <aside className={`z-40 fixed md:relative h-screen bg-white border-r transition-all duration-300 flex flex-col ${isSidebarOpen ? 'w-64' : 'w-20'} ${!isSidebarOpen && window.innerWidth < 768 ? '-translate-x-full' : 'translate-x-0'}`}><div className={`flex items-center justify-between p-4 h-16 border-b ${isSidebarOpen ? 'px-6' : 'px-4'}`}><div className={`flex items-center ${isSidebarOpen ? '' : 'justify-center w-full'}`}><svg className="w-8 h-8 text-blue-600" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-4H8l4-5 1 1v4h3l-4 4-1-1z"/></svg><span className={`text-xl font-bold ml-2 transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>財帳雲</span></div></div><div className="flex-1 p-4 overflow-y-auto"><ul className="space-y-2">{topNavItems.map(item => <NavLink key={item.view} {...item} />)}</ul></div><div className="p-4 border-t"><ul className="space-y-2">{bottomNavItems.map(item => <NavLink key={item.view} {...item} />)}</ul></div><div className={`p-4 border-t ${isSidebarOpen ? '' : 'hidden'}`}><div className="flex items-center justify-between"><div className="flex items-center"><img className="h-10 w-10 rounded-full" src={`https://placehold.co/100x100/E2E8F0/4A5568?text=${currentUser.name.charAt(0)}`} alt="User" /><div className="ml-3"><p className="font-semibold">{currentUser.name}</p><p className="text-sm text-gray-500">{currentUser.role}</p></div></div><div className="flex items-center gap-2">{currentUser.permissions.includes('backup') && <button onClick={handleBackup} className="btn-secondary text-sm">備份</button>}<button onClick={handleLogout} title="登出" className="text-gray-500 hover:text-red-500"><LogOut/></button></div></div></div></aside>
      <div className="flex-1 flex flex-col h-screen"><header className="bg-white border-b h-16 flex items-center justify-between px-6 flex-shrink-0"><button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-gray-600 hover:text-gray-900"> <Menu size={24} /> </button><div className="text-xl font-semibold text-gray-700">{ topNavItems.find(i=>i.view === activeView)?.label || bottomNavItems.find(i=>i.view === activeView)?.label || '儀表板總覽' }</div><div> </div></header><main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">{renderView()}</main></div>
      <button onClick={() => setShowCalculator(!showCalculator)} className="fixed bottom-8 right-8 w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition z-50"><Calculator size={24}/></button>
      {showCalculator && <CalculatorWidget onClose={() => setShowCalculator(false)}/>}
    </div>
  );
}



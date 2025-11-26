import { useState, useRef, useEffect } from 'react';
import './Chatbot.css';

export default function ConversationalChatbot({ inspectionData }) {
  const [messages, setMessages] = useState([
    { 
      type: 'bot', 
      text: `🔍 **Inspection Analysis Assistant**\n\nI'll help you analyze inspection data step by step!\n\nPlease answer my questions, and I'll prepare a detailed report at the end.\n\nShall we begin? Type "yes" to start!` 
    }
  ]);
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [conversationStep, setConversationStep] = useState(0);
  const [userResponses, setUserResponses] = useState({});
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Conversation flow steps
  const conversationFlow = [
    {
      question: "📅 Which month would you like to analyze? (e.g., January, February, March, or type 'all' for all months)",
      key: 'month'
    },
    {
      question: "📊 Which year are you interested in? (e.g., 2023, 2024, or type 'all' for all years)",
      key: 'year'
    },
    {
      question: "🎯 What would you like to focus on?\n• Type 'defects' for defects analysis\n• Type 'quality' for pass/fail rates\n• Type 'oql' for quality levels\n• Type 'all' for complete analysis",
      key: 'focus'
    },
    {
      question: "📈 Would you like comparison with previous data?\n• Type 'yes' for comparison\n• Type 'no' for single period analysis",
      key: 'comparison'
    },
    {
      question: "🔍 Any specific defect type you're concerned about?\n• Type specific defect name\n• Type 'none' for general analysis\n• Type 'list' to see defect types",
      key: 'specificDefect'
    }
  ];

  // Get available data
  const getAvailableData = () => {
    const months = [...new Set(inspectionData.map(d => d.month).filter(Boolean))];
    const years = [...new Set(inspectionData.map(d => d.year).filter(Boolean))];
    return { months, years };
  };

  // Defect types list
  const getDefectTypes = () => {
    return [
      'Pulled Terry', 'Raw Edge', 'Weaving Issue', 'Uncut Thread', 'Major Stain',
      'Skip Stitch', 'Broken Stitch', 'Runoff Stitch', 'Poor Shape', 'Pleat Defect',
      'Insecure Label', 'Missing Label', 'Slant Label', 'Fabric Damage', 'Hole'
    ];
  };

  // Process user response and move to next step
  const processUserResponse = (userInput) => {
    const currentStep = conversationFlow[conversationStep];
    const responses = { ...userResponses, [currentStep.key]: userInput };
    setUserResponses(responses);

    // Special handling for specific steps
    if (currentStep.key === 'specificDefect' && userInput.toLowerCase() === 'list') {
      setMessages(prev => [...prev, {
        type: 'bot',
        text: `📋 **Available Defect Types:**\n\n${getDefectTypes().join('\n')}\n\nPlease type the defect name you're interested in, or 'none' for general analysis:`
      }]);
      return;
    }

    // Move to next step or generate final report
    if (conversationStep < conversationFlow.length - 1) {
      setConversationStep(prev => prev + 1);
      setMessages(prev => [...prev, {
        type: 'bot',
        text: conversationFlow[conversationStep + 1].question
      }]);
    } else {
      // Generate final analysis report
      generateFinalReport(responses);
    }
  };

  // Generate comprehensive final report
  const generateFinalReport = (responses) => {
    const { months, years } = getAvailableData();
    
    let filteredData = inspectionData;
    let analysisScope = '';

    // Filter by month
    if (responses.month && responses.month.toLowerCase() !== 'all') {
      filteredData = filteredData.filter(d => d.month === responses.month);
      analysisScope += `Month: ${responses.month}\n`;
    }

    // Filter by year
    if (responses.year && responses.year.toLowerCase() !== 'all') {
      filteredData = filteredData.filter(d => d.year === parseInt(responses.year));
      analysisScope += `Year: ${responses.year}\n`;
    }

    if (!analysisScope) {
      analysisScope = 'All Available Data';
    }

    // Calculate metrics
    const totalInspections = filteredData.length;
    const totalPass = filteredData.reduce((s, d) => s + (d.pass || 0), 0);
    const totalFail = filteredData.reduce((s, d) => s + (d.fail || 0), 0);
    const totalCompleted = totalPass + totalFail;
    const passRate = totalCompleted ? ((totalPass / totalCompleted) * 100).toFixed(2) : 0;
    
    const totalDefects = filteredData.reduce((sum, d) => sum + (d.actualMajor || 0), 0);
    const avgOQL = filteredData.length ? 
      (filteredData.reduce((sum, d) => sum + (d.actualOql || d.oql || 0), 0) / filteredData.length).toFixed(2) : 0;

    // Defects analysis
    const defectAnalysis = analyzeDefects(filteredData, responses.specificDefect);

    // Generate report based on focus
    let report = `📊 **COMPREHENSIVE INSPECTION ANALYSIS REPORT**\n\n`;
    report += `**Analysis Scope:** ${analysisScope}\n`;
    report += `**Focus Area:** ${responses.focus}\n`;
    report += `**Data Points:** ${totalInspections} inspections analyzed\n\n`;

    report += `📈 **KEY METRICS SUMMARY**\n`;
    report += `• Total Inspections: ${totalInspections}\n`;
    report += `• Completed Inspections: ${totalCompleted}\n`;
    report += `• Pass Rate: ${passRate}% (${totalPass} passed)\n`;
    report += `• Fail Rate: ${(100 - passRate).toFixed(2)}% (${totalFail} failed)\n`;
    report += `• Average OQL: ${avgOQL}%\n`;
    report += `• Total Defects: ${totalDefects}\n\n`;

    // Add focus-specific analysis
    if (responses.focus === 'defects' || responses.focus === 'all') {
      report += `🔧 **DEFECTS ANALYSIS**\n`;
      report += defectAnalysis;
      report += `\n\n`;
    }

    if (responses.focus === 'quality' || responses.focus === 'all') {
      report += `🎯 **QUALITY TRENDS**\n`;
      report += `• Overall Quality Score: ${(100 - avgOQL).toFixed(2)}/100\n`;
      report += `• Defect Rate: ${totalCompleted ? ((totalDefects / totalCompleted) * 100).toFixed(2) : 0}% per inspection\n`;
      report += `• Success Ratio: ${totalPass}:${totalFail}\n\n`;
    }

    // Recommendations
    report += `💡 **RECOMMENDATIONS**\n`;
    if (passRate > 90) {
      report += `• Excellent quality performance! Maintain current processes.\n`;
    } else if (passRate > 75) {
      report += `• Good performance. Focus on reducing top defects.\n`;
    } else {
      report += `• Needs improvement. Implement corrective actions for major defects.\n`;
    }

    if (totalDefects > 0) {
      report += `• Address top 3 defects to improve pass rate by ~${Math.min(15, Math.round(totalDefects * 0.1))}%\n`;
    }

    report += `\nThank you for using Inspection Analysis Assistant! 🎉`;

    setMessages(prev => [...prev, {
      type: 'bot',
      text: report
    }, {
      type: 'bot', 
      text: 'Would you like to analyze another period? Type "restart" to begin again!'
    }]);

    // Reset for new conversation
    setConversationStep(0);
    setUserResponses({});
  };

  // Analyze defects based on user interest
  const analyzeDefects = (data, specificDefect) => {
    const defectTypes = [
      'pulledTerry', 'rawEdge', 'weaving', 'uncutThread', 'stainMajor',
      'skipStitch', 'brokenStitch', 'runoffStitch', 'poorShape', 'pleat',
      'insecureLabel', 'missingLabel', 'slantLabel', 'damageFabric', 'hole'
    ];

    const defectCounts = defectTypes.map(defect => ({
      name: formatDefectName(defect),
      key: defect,
      count: data.reduce((sum, d) => sum + (Number(d[defect]) || 0), 0)
    }));

    const topDefects = defectCounts
      .filter(d => d.count > 0)
      .sort((a, b) => b.count - a.count);

    let analysis = '';

    // Specific defect analysis
    if (specificDefect && specificDefect.toLowerCase() !== 'none') {
      const foundDefect = topDefects.find(d => 
        d.name.toLowerCase().includes(specificDefect.toLowerCase()) ||
        specificDefect.toLowerCase().includes(d.name.toLowerCase())
      );

      if (foundDefect) {
        analysis += `• **${foundDefect.name}**: ${foundDefect.count} occurrences\n`;
        analysis += `  - Represents ${topDefects.length ? ((foundDefect.count / topDefects.reduce((sum, d) => sum + d.count, 0)) * 100).toFixed(1) : 0}% of all defects\n`;
      } else {
        analysis += `• No specific data found for "${specificDefect}"\n`;
      }
    }

    // General defects analysis
    analysis += `• Total Defect Types: ${topDefects.length}\n`;
    analysis += `• Top 3 Defects:\n`;
    topDefects.slice(0, 3).forEach((defect, index) => {
      analysis += `  ${index + 1}. ${defect.name}: ${defect.count} occurrences\n`;
    });

    if (topDefects.length > 0) {
      analysis += `• Most Common: ${topDefects[0].name} (${topDefects[0].count} times)\n`;
    }

    return analysis;
  };

  const formatDefectName = (name) => {
    const nameMap = {
      'pulledTerry': 'Pulled Terry',
      'rawEdge': 'Raw Edge',
      'weaving': 'Weaving Issue',
      'uncutThread': 'Uncut Thread',
      'stainMajor': 'Major Stain',
      'skipStitch': 'Skip Stitch',
      'brokenStitch': 'Broken Stitch',
      'runoffStitch': 'Runoff Stitch',
      'poorShape': 'Poor Shape',
      'pleat': 'Pleat Defect',
      'insecureLabel': 'Insecure Label',
      'missingLabel': 'Missing Label',
      'slantLabel': 'Slant Label',
      'damageFabric': 'Fabric Damage',
      'hole': 'Hole'
    };
    return nameMap[name] || name;
  };

  const handleSend = () => {
    if (!input.trim()) return;

    // Add user message
    const userMsg = { type: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);

    // Handle restart command
    if (input.toLowerCase() === 'restart') {
      setMessages([{
        type: 'bot', 
        text: `🔍 **Inspection Analysis Assistant**\n\nLet's start a new analysis! Please answer my questions.\n\n${conversationFlow[0].question}`
      }]);
      setConversationStep(0);
      setUserResponses({});
      setInput('');
      return;
    }

    // Handle initial start
    if (conversationStep === 0 && messages.length === 1) {
      if (input.toLowerCase() === 'yes') {
        setMessages(prev => [...prev, {
          type: 'bot',
          text: conversationFlow[0].question
        }]);
        setConversationStep(1);
      } else {
        setMessages(prev => [...prev, {
          type: 'bot',
          text: 'Okay, whenever you\'re ready, just type "yes" to begin the analysis!'
        }]);
      }
    } else {
      // Process normal conversation flow
      processUserResponse(input);
    }

    setInput('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  const handleClearChat = () => {
    setMessages([{
      type: 'bot', 
      text: `🔍 **Inspection Analysis Assistant**\n\nI'll help you analyze inspection data step by step!\n\nPlease answer my questions, and I'll prepare a detailed report at the end.\n\nShall we begin? Type "yes" to start!`
    }]);
    setConversationStep(0);
    setUserResponses({});
  };

  return (
    <>
      {!isOpen && (
        <button className="chatbot-toggle-btn" onClick={() => setIsOpen(true)}>
          🤖 Ask AI
        </button>
      )}

      {isOpen && (
        <div className="chatbot-widget">
          <div className="chatbot-header">
            <div className="chatbot-title">
              <h3>Analysis Assistant</h3>
              <span className="chatbot-status">● Online</span>
            </div>
            <div className="chatbot-actions">
              <button onClick={handleClearChat} className="btn-clear">
                Restart
              </button>
              <button onClick={() => setIsOpen(false)} className="btn-close">
                ×
              </button>
            </div>
          </div>
          
          <div className="chatbot-messages">
            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.type}`}>
                {msg.text.split('\n').map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="chatbot-input">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your answer here..."
              autoFocus
            />
            <button onClick={handleSend} disabled={!input.trim()}>
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}
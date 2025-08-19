'use client';
import { useState, useEffect } from 'react';
import { Edit, Save, X, Plus, Trash2, FileText, Mail, Clock, CircleAlert } from 'lucide-react';
import { useMode } from '@/lib/contexts/ModeContext';

interface PageContent {
  id: string;
  section: string;
  key: string;
  content_type: string;
  value: string;
  created_at: string;
  updated_at: string;
}

interface AboutPageEditorProps {
  pageContents: PageContent[];
  onSave: (fieldId: string, content: string) => Promise<void>;
  onRefresh: () => void;
}

// About Page Editor Component - Mirrors frontend design but editable
function AboutPageEditor({ pageContents, onSave, onRefresh }: AboutPageEditorProps) {
  const [editingField, setEditingField] = useState<string>('');
  const [editingContent, setEditingContent] = useState<string>('');
  const [hasChanges, setHasChanges] = useState(false);
  const [cursorPosition, setCursorPosition] = useState<number>(0);

  // Convert pageContents array to key-value object for easy lookup
  const contentMap = pageContents.reduce((acc, item) => {
    acc[item.key] = { value: item.value, id: item.id };
    return acc;
  }, {} as Record<string, { value: string; id: string }>);

  // Default content (fallback)
  const defaultContent: Record<string, string> = {
    title: "About Gemsutopia",
    intro_paragraph: "First of all, thanks for stopping by — I'm Reese, founder of Gemsutopia and a proud Canadian gem dealer based in Alberta.",
    paragraph_1: "At Gemsutopia, we believe in gemstones with integrity. Every mineral and specimen you see in my shop is hand-selected, ethically sourced, and personally inspected by me. Many pieces — like our Blue Jay sapphires, Alberta peridot, and Canadian ammolite — were even mined by yours truly, straight from the earth with care and respect.",
    paragraph_2: "This isn't just a business — it's a passion. I don't list anything I wouldn't be proud to have in my own collection.",
    paragraph_3: "Each order is thoughtfully packed by my amazing spouse (she's the best), and we often include a small bonus gift as a thank-you for supporting our dream.",
    paragraph_4: "You can shop with confidence knowing we stand behind every piece, from quality to safe delivery.",
    shipping_title: "Shipping & Processing",
    shipping_item_1: "Processing time: 1–2 business days",
    shipping_item_2: "Estimated delivery (Canada): 3–15 business days (not guaranteed)",
    shipping_item_3: "Estimated delivery (USA): 5–20 business days (not guaranteed)",
    shipping_note: "Have a question or issue? Reach out anytime! I'll always do my best to help.",
    closing_paragraph: "Thanks so much for supporting Gemsutopia. You're not just buying a gem.. you're also investing in a story, a journey, and a small Canadian business that truly cares.",
    signature: "— Reese @ Gemsutopia"
  };

  const getContent = (key: string): string => contentMap[key]?.value || defaultContent[key] || '';
  const getFieldId = (key: string): string => contentMap[key]?.id || '';

  const handleStartEdit = (key: string) => {
    setEditingField(key);
    const content = getContent(key);
    setEditingContent(content);
    setHasChanges(false);
    setCursorPosition(content.length); // Set cursor to end when starting edit
  };

  const handleContentChange = (content: string) => {
    setEditingContent(content);
    setHasChanges(content !== getContent(editingField));
  };

  const handleSave = async () => {
    if (editingField && editingContent) {
      const fieldId = getFieldId(editingField);
      if (fieldId) {
        await onSave(fieldId, editingContent);
        setEditingField('');
        setEditingContent('');
        setHasChanges(false);
        onRefresh();
      }
    }
  };

  const handleCancel = () => {
    setEditingField('');
    setEditingContent('');
    setHasChanges(false);
  };

  const EditableText = ({ fieldKey, className = '', tag = 'p' }: { fieldKey: string; className?: string; tag?: string }) => {
    const isEditing = editingField === fieldKey;
    const content = getContent(fieldKey);
    
    if (isEditing) {
      return (
        <div className="relative">
          <textarea
            ref={(textarea) => {
              if (textarea && isEditing) {
                // Set cursor position after render
                setTimeout(() => {
                  textarea.focus();
                  textarea.setSelectionRange(cursorPosition, cursorPosition);
                }, 0);
              }
            }}
            value={editingContent} // Controlled input
            onChange={(e) => {
              const target = e.target as HTMLTextAreaElement;
              setCursorPosition(target.selectionStart || 0); // Save cursor position
              handleContentChange(e.target.value);
            }}
            onSelect={(e) => {
              const target = e.target as HTMLTextAreaElement;
              setCursorPosition(target.selectionStart || 0); // Update cursor position on selection change
            }}
            onClick={(e) => {
              const target = e.target as HTMLTextAreaElement;
              setCursorPosition(target.selectionStart || 0); // Update cursor position on click
            }}
            className={`w-full bg-yellow-50 border-2 border-yellow-400 rounded px-3 py-2 text-neutral-700 resize-vertical min-h-[60px] ${className}`}
            onKeyDown={(e) => {
              if (e.key === 'Escape') handleCancel();
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSave();
            }}
          />
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                hasChanges 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Save className="h-3 w-3 inline mr-1" />Save
            </button>
            <button
              onClick={handleCancel}
              className="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white rounded text-sm transition-colors"
            >
              <X className="h-3 w-3 inline mr-1" />Cancel
            </button>
            <span className="text-xs text-gray-500">Ctrl+Enter to save, Esc to cancel</span>
          </div>
        </div>
      );
    }

    const Component = tag as any;
    return (
      <Component 
        className={`${className} cursor-pointer hover:bg-blue-50 hover:outline-2 hover:outline-blue-300 rounded px-2 py-1 transition-all group relative`}
        onClick={() => handleStartEdit(fieldKey)}
        title="Click to edit"
      >
        {content}
        <Edit className="h-3 w-3 inline-block ml-1 opacity-0 group-hover:opacity-50 transition-opacity" />
      </Component>
    );
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
            <div className="text-center mb-12">
              <EditableText 
                fieldKey="title" 
                className="text-3xl md:text-4xl font-bold text-black mb-4" 
                tag="h1"
              />
            </div>
            
            <div className="prose prose-lg max-w-none text-neutral-700">
              <EditableText 
                fieldKey="intro_paragraph" 
                className="text-xl leading-relaxed mb-8"
              />
              
              <EditableText 
                fieldKey="paragraph_1" 
                className="mb-6"
              />
              
              <EditableText 
                fieldKey="paragraph_2" 
                className="mb-6"
              />
              
              <EditableText 
                fieldKey="paragraph_3" 
                className="mb-6"
              />
              
              <EditableText 
                fieldKey="paragraph_4" 
                className="mb-8"
              />
              
              <EditableText 
                fieldKey="shipping_title" 
                className="text-2xl font-bold text-black mt-8 mb-4" 
                tag="h2"
              />
              
              <ul className="mb-6">
                <li>
                  <EditableText 
                    fieldKey="shipping_item_1" 
                    className="inline"
                    tag="span"
                  />
                </li>
                <li>
                  <EditableText 
                    fieldKey="shipping_item_2" 
                    className="inline"
                    tag="span"
                  />
                </li>
                <li>
                  <EditableText 
                    fieldKey="shipping_item_3" 
                    className="inline"
                    tag="span"
                  />
                </li>
              </ul>
              
              <EditableText 
                fieldKey="shipping_note" 
                className="mb-6"
              />
              
              <EditableText 
                fieldKey="closing_paragraph" 
                className="text-xl leading-relaxed mb-8"
              />
              
              <EditableText 
                fieldKey="signature" 
                className="text-right font-semibold text-black"
              />
            </div>
    </div>
  );
}

// Support Page Editor Component - Mirrors frontend design but editable
function SupportPageEditor({ pageContents, onSave, onRefresh }: AboutPageEditorProps) {
  const [editingField, setEditingField] = useState<string>('');
  const [editingContent, setEditingContent] = useState<string>('');
  const [hasChanges, setHasChanges] = useState(false);
  const [cursorPosition, setCursorPosition] = useState<number>(0);

  // Convert pageContents array to key-value object for easy lookup
  const contentMap = pageContents.reduce((acc, item) => {
    acc[item.key] = { value: item.value, id: item.id };
    return acc;
  }, {} as Record<string, { value: string; id: string }>);

  // Default content (fallback)
  const defaultContent: Record<string, string> = {
    title: "Support Center",
    subtitle: "We're here to help you with any questions",
    email_support_title: "Email Support",
    email_support_description: "Get help via email",
    email_address: "gemsutopia@gmail.com",
    response_time_title: "Response Time",
    response_time_description: "We typically respond within",
    response_time_value: "24 hours",
    faq_title: "FAQ",
    faq_description: "Your questions answered",
    faq_section_title: "Frequently Asked Questions",
    faq_1_question: "How do I track my order?",
    faq_1_answer: "Once your order is shipped, you'll receive a tracking number via email. You can use this number to track your package on our shipping partner's website.",
    faq_2_question: "What is your return policy?",
    faq_2_answer: "We offer a 30-day return policy for all items in original condition. Please see our Returns & Exchange page for detailed information.",
    faq_3_question: "Are your gemstones authentic?",
    faq_3_answer: "Yes, all our gemstones come with certificates of authenticity and are sourced from trusted suppliers worldwide.",
    faq_4_question: "How long does shipping take?",
    faq_4_answer: "Standard shipping takes 3-5 business days. Express shipping options are available at checkout for faster delivery."
  };

  const getContent = (key: string): string => contentMap[key]?.value || defaultContent[key] || '';
  const getFieldId = (key: string): string => contentMap[key]?.id || '';

  const handleStartEdit = (key: string) => {
    setEditingField(key);
    const content = getContent(key);
    setEditingContent(content);
    setHasChanges(false);
    setCursorPosition(content.length);
  };

  const handleContentChange = (content: string) => {
    setEditingContent(content);
    setHasChanges(content !== getContent(editingField));
  };

  const handleSave = async () => {
    if (editingField && editingContent) {
      const fieldId = getFieldId(editingField);
      if (fieldId) {
        await onSave(fieldId, editingContent);
        setEditingField('');
        setEditingContent('');
        setHasChanges(false);
        onRefresh();
      }
    }
  };

  const handleCancel = () => {
    setEditingField('');
    setEditingContent('');
    setHasChanges(false);
  };

  const EditableText = ({ fieldKey, className = '', tag = 'p' }: { fieldKey: string; className?: string; tag?: string }) => {
    const isEditing = editingField === fieldKey;
    const content = getContent(fieldKey);
    
    if (isEditing) {
      return (
        <div className="relative">
          <textarea
            ref={(textarea) => {
              if (textarea && isEditing) {
                setTimeout(() => {
                  textarea.focus();
                  textarea.setSelectionRange(cursorPosition, cursorPosition);
                }, 0);
              }
            }}
            value={editingContent}
            onChange={(e) => {
              const target = e.target as HTMLTextAreaElement;
              setCursorPosition(target.selectionStart || 0);
              handleContentChange(e.target.value);
            }}
            onSelect={(e) => {
              const target = e.target as HTMLTextAreaElement;
              setCursorPosition(target.selectionStart || 0);
            }}
            onClick={(e) => {
              const target = e.target as HTMLTextAreaElement;
              setCursorPosition(target.selectionStart || 0);
            }}
            className={`w-full bg-yellow-50 border-2 border-yellow-400 rounded px-3 py-2 text-neutral-700 resize-vertical min-h-[60px] ${className}`}
            onKeyDown={(e) => {
              if (e.key === 'Escape') handleCancel();
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSave();
            }}
          />
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                hasChanges 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Save className="h-3 w-3 inline mr-1" />Save
            </button>
            <button
              onClick={handleCancel}
              className="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white rounded text-sm transition-colors"
            >
              <X className="h-3 w-3 inline mr-1" />Cancel
            </button>
            <span className="text-xs text-gray-500">Ctrl+Enter to save, Esc to cancel</span>
          </div>
        </div>
      );
    }

    const Component = tag as any;
    return (
      <Component 
        className={`${className} cursor-pointer hover:bg-blue-50 hover:outline-2 hover:outline-blue-300 rounded px-2 py-1 transition-all group relative`}
        onClick={() => handleStartEdit(fieldKey)}
        title="Click to edit"
      >
        {content}
        <Edit className="h-3 w-3 inline-block ml-1 opacity-0 group-hover:opacity-50 transition-opacity" />
      </Component>
    );
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
      <div className="text-center mb-12">
        <EditableText 
          fieldKey="title" 
          className="text-3xl md:text-4xl font-bold text-black mb-4" 
          tag="h1"
        />
        <EditableText 
          fieldKey="subtitle" 
          className="text-lg text-neutral-600"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="text-center p-6 bg-white rounded-lg shadow-sm">
          <Mail className="h-12 w-12 text-black mx-auto mb-4" />
          <EditableText 
            fieldKey="email_support_title" 
            className="text-xl font-bold text-black mb-2" 
            tag="h3"
          />
          <EditableText 
            fieldKey="email_support_description" 
            className="text-neutral-600 mb-4"
          />
          <EditableText 
            fieldKey="email_address" 
            className="text-black font-semibold hover:underline"
            tag="span"
          />
        </div>
        
        <div className="text-center p-6 bg-white rounded-lg shadow-sm">
          <Clock className="h-12 w-12 text-black mx-auto mb-4" />
          <EditableText 
            fieldKey="response_time_title" 
            className="text-xl font-bold text-black mb-2" 
            tag="h3"
          />
          <EditableText 
            fieldKey="response_time_description" 
            className="text-neutral-600 mb-4"
          />
          <EditableText 
            fieldKey="response_time_value" 
            className="text-black font-semibold"
          />
        </div>
        
        <div className="text-center p-6 bg-white rounded-lg shadow-sm">
          <CircleAlert className="h-12 w-12 text-black mx-auto mb-4" />
          <EditableText 
            fieldKey="faq_title" 
            className="text-xl font-bold text-black mb-2" 
            tag="h3"
          />
          <EditableText 
            fieldKey="faq_description" 
            className="text-neutral-600 mb-4"
          />
          <a href="#faq" className="text-black font-semibold hover:underline">
            View FAQ
          </a>
        </div>
      </div>
      
      <div id="faq">
        <EditableText 
          fieldKey="faq_section_title" 
          className="text-2xl font-bold text-black mb-8 text-center" 
          tag="h2"
        />
        <div className="space-y-6">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <EditableText 
              fieldKey="faq_1_question" 
              className="text-lg font-semibold text-black mb-3" 
              tag="h3"
            />
            <EditableText 
              fieldKey="faq_1_answer" 
              className="text-neutral-600"
            />
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <EditableText 
              fieldKey="faq_2_question" 
              className="text-lg font-semibold text-black mb-3" 
              tag="h3"
            />
            <EditableText 
              fieldKey="faq_2_answer" 
              className="text-neutral-600"
            />
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <EditableText 
              fieldKey="faq_3_question" 
              className="text-lg font-semibold text-black mb-3" 
              tag="h3"
            />
            <EditableText 
              fieldKey="faq_3_answer" 
              className="text-neutral-600"
            />
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <EditableText 
              fieldKey="faq_4_question" 
              className="text-lg font-semibold text-black mb-3" 
              tag="h3"
            />
            <EditableText 
              fieldKey="faq_4_answer" 
              className="text-neutral-600"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Shared EditableText component
function useEditableText() {
  const [editingField, setEditingField] = useState<string>('');
  const [editingContent, setEditingContent] = useState<string>('');
  const [hasChanges, setHasChanges] = useState(false);
  const [cursorPosition, setCursorPosition] = useState<number>(0);

  const handleStartEdit = (key: string, content: string) => {
    setEditingField(key);
    setEditingContent(content);
    setHasChanges(false);
    setCursorPosition(content.length);
  };

  const handleContentChange = (content: string, originalContent: string) => {
    setEditingContent(content);
    setHasChanges(content !== originalContent);
  };

  const handleSave = async (getFieldId: (key: string) => string, onSave: (fieldId: string, content: string) => Promise<void>, onRefresh: () => void) => {
    if (editingField && editingContent) {
      const fieldId = getFieldId(editingField);
      if (fieldId) {
        await onSave(fieldId, editingContent);
        setEditingField('');
        setEditingContent('');
        setHasChanges(false);
        onRefresh();
      }
    }
  };

  const handleCancel = () => {
    setEditingField('');
    setEditingContent('');
    setHasChanges(false);
  };

  const EditableText = ({ fieldKey, className = '', tag = 'p', getContent, getFieldId, onSave, onRefresh }: { 
    fieldKey: string; 
    className?: string; 
    tag?: string;
    getContent: (key: string) => string;
    getFieldId: (key: string) => string;
    onSave: (fieldId: string, content: string) => Promise<void>;
    onRefresh: () => void;
  }) => {
    const isEditing = editingField === fieldKey;
    const content = getContent(fieldKey);
    
    if (isEditing) {
      return (
        <div className="relative">
          <textarea
            ref={(textarea) => {
              if (textarea && isEditing) {
                setTimeout(() => {
                  textarea.focus();
                  textarea.setSelectionRange(cursorPosition, cursorPosition);
                }, 0);
              }
            }}
            value={editingContent}
            onChange={(e) => {
              const target = e.target as HTMLTextAreaElement;
              setCursorPosition(target.selectionStart || 0);
              handleContentChange(e.target.value, content);
            }}
            onSelect={(e) => {
              const target = e.target as HTMLTextAreaElement;
              setCursorPosition(target.selectionStart || 0);
            }}
            onClick={(e) => {
              const target = e.target as HTMLTextAreaElement;
              setCursorPosition(target.selectionStart || 0);
            }}
            className={`w-full bg-yellow-50 border-2 border-yellow-400 rounded px-3 py-2 text-neutral-700 resize-vertical min-h-[60px] ${className}`}
            onKeyDown={(e) => {
              if (e.key === 'Escape') handleCancel();
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSave(getFieldId, onSave, onRefresh);
            }}
          />
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={() => handleSave(getFieldId, onSave, onRefresh)}
              disabled={!hasChanges}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                hasChanges 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Save className="h-3 w-3 inline mr-1" />Save
            </button>
            <button
              onClick={handleCancel}
              className="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white rounded text-sm transition-colors"
            >
              <X className="h-3 w-3 inline mr-1" />Cancel
            </button>
            <span className="text-xs text-gray-500">Ctrl+Enter to save, Esc to cancel</span>
          </div>
        </div>
      );
    }

    const Component = tag as any;
    return (
      <Component 
        className={`${className} cursor-pointer hover:bg-blue-50 hover:outline-2 hover:outline-blue-300 rounded px-2 py-1 transition-all group relative`}
        onClick={() => handleStartEdit(fieldKey, content)}
        title="Click to edit"
      >
        {content}
        <Edit className="h-3 w-3 inline-block ml-1 opacity-0 group-hover:opacity-50 transition-opacity" />
      </Component>
    );
  };

  return { EditableText, editingField, handleStartEdit, handleSave, handleCancel };
}

// Refund Policy Page Editor
function RefundPolicyPageEditor({ pageContents, onSave, onRefresh }: AboutPageEditorProps) {
  const contentMap = pageContents.reduce((acc, item) => {
    acc[item.key] = { value: item.value, id: item.id };
    return acc;
  }, {} as Record<string, { value: string; id: string }>);

  const defaultContent: Record<string, string> = {
    title: "Refund Policy",
    subtitle: "Your satisfaction is our priority",
    guarantee_title: "30-Day Money Back Guarantee",
    guarantee_content: "We stand behind the quality of our products. If you're not completely satisfied with your purchase, you may return it within 30 days of delivery for a full refund.",
    process_title: "Refund Process",
    process_item_1: "Contact our customer service team to initiate a return",
    process_item_2: "Return items must be in original condition with all packaging",
    process_item_3: "Refunds are processed within 5-7 business days after we receive your return",
    process_item_4: "Original shipping costs are non-refundable",
    exceptions_title: "Exceptions",
    exceptions_content: "Custom or personalized items cannot be returned unless defective. Sale items are final sale and cannot be returned for refund, but may be exchanged for store credit.",
    damaged_title: "Damaged or Defective Items",
    damaged_content: "If you receive a damaged or defective item, please contact us immediately. We will provide a prepaid return label and process your refund or replacement as soon as possible.",
    contact_title: "Contact Us",
    contact_content: "For questions about our refund policy or to initiate a return, please contact us at support@gemsutopia.com or call +1 (555) 123-4567."
  };

  const getContent = (key: string): string => contentMap[key]?.value || defaultContent[key] || '';
  const getFieldId = (key: string): string => contentMap[key]?.id || '';
  const { EditableText } = useEditableText();

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
      <div className="text-center mb-12">
        <EditableText fieldKey="title" className="text-3xl md:text-4xl font-bold text-black mb-4" tag="h1" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
        <EditableText fieldKey="subtitle" className="text-lg text-neutral-600" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
      </div>
      
      <div className="prose prose-lg max-w-none text-neutral-700 space-y-8">
        <div>
          <EditableText fieldKey="guarantee_title" className="text-2xl font-bold text-black mb-4" tag="h2" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
          <EditableText fieldKey="guarantee_content" className="mb-4" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
        </div>
        
        <div>
          <EditableText fieldKey="process_title" className="text-2xl font-bold text-black mb-4" tag="h2" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
          <ul className="list-disc pl-6 space-y-2">
            <li><EditableText fieldKey="process_item_1" className="inline" tag="span" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} /></li>
            <li><EditableText fieldKey="process_item_2" className="inline" tag="span" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} /></li>
            <li><EditableText fieldKey="process_item_3" className="inline" tag="span" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} /></li>
            <li><EditableText fieldKey="process_item_4" className="inline" tag="span" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} /></li>
          </ul>
        </div>
        
        <div>
          <EditableText fieldKey="exceptions_title" className="text-2xl font-bold text-black mb-4" tag="h2" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
          <EditableText fieldKey="exceptions_content" className="mb-4" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
        </div>
        
        <div>
          <EditableText fieldKey="damaged_title" className="text-2xl font-bold text-black mb-4" tag="h2" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
          <EditableText fieldKey="damaged_content" className="mb-4" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
        </div>
        
        <div>
          <EditableText fieldKey="contact_title" className="text-2xl font-bold text-black mb-4" tag="h2" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
          <EditableText fieldKey="contact_content" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
        </div>
      </div>
    </div>
  );
}

// Returns & Exchange Page Editor
function ReturnsExchangePageEditor({ pageContents, onSave, onRefresh }: AboutPageEditorProps) {
  const contentMap = pageContents.reduce((acc, item) => {
    acc[item.key] = { value: item.value, id: item.id };
    return acc;
  }, {} as Record<string, { value: string; id: string }>);

  const defaultContent: Record<string, string> = {
    title: "Returns & Exchange",
    subtitle: "We want you to love your gemstones",
    policy_title: "Our Return Policy",
    policy_intro: "At Gemsutopia, we want you to be completely satisfied with your purchase. If for any reason you're not happy with your gemstones, we offer a hassle-free return policy.",
    policy_window: "Return Window: You have 30 days from the date of delivery to return your items for a full refund or exchange.",
    acceptable_title: "What Can Be Returned",
    acceptable_intro: "We accept returns for:",
    acceptable_item_1: "Gemstones in their original condition",
    acceptable_item_2: "Jewelry pieces that haven't been resized or altered",
    acceptable_item_3: "Items that are unworn and undamaged",
    acceptable_item_4: "Products in their original packaging with all certificates",
    unacceptable_title: "Items We Cannot Accept",
    unacceptable_intro: "For hygiene and safety reasons, we cannot accept returns for:",
    unacceptable_item_1: "Custom or personalized jewelry pieces",
    unacceptable_item_2: "Items that have been resized or altered",
    unacceptable_item_3: "Gemstones that show signs of damage or wear",
    unacceptable_item_4: "Items without original packaging or certificates",
    return_steps_title: "How to Start a Return",
    return_steps_intro: "To initiate a return, please follow these simple steps:",
    return_step_1: "Contact us at gemsutopia@gmail.com with your order number",
    return_step_2: "Include photos of the item(s) you wish to return",
    return_step_3: "Specify the reason for return (exchange, refund, damaged, etc.)",
    return_step_4: "We'll provide you with return instructions and a return authorization number",
    return_step_5: "Package the items securely with all original materials",
    return_step_6: "Ship using a trackable method (we recommend insurance for valuable items)",
    exchange_title: "Exchange Process",
    exchange_intro: "If you'd like to exchange your item for a different size, style, or gemstone:",
    exchange_item_1: "Follow the return process above and specify \"exchange\" as your reason",
    exchange_item_2: "Let us know what you'd like to exchange it for",
    exchange_item_3: "We'll confirm availability and any price differences",
    exchange_item_4: "Upon receiving your return, we'll ship your new item",
    exchange_item_5: "If there's a price difference, we'll refund or charge accordingly",
    refund_title: "Refund Processing",
    refund_intro: "Once we receive and inspect your returned item:",
    refund_item_1: "We'll send you an email confirming receipt",
    refund_item_2: "Refunds are processed within 3-5 business days",
    refund_item_3: "Refunds are issued to your original payment method",
    refund_item_4: "You'll receive an email confirmation when the refund is processed",
    refund_item_5: "Please allow 5-10 business days for the refund to appear in your account",
    shipping_title: "Shipping Costs",
    shipping_returns: "Returns: Customers are responsible for return shipping costs unless the item was damaged or incorrectly sent.",
    shipping_exchanges: "Exchanges: We'll cover the cost of shipping your new item to you. You cover the return shipping cost.",
    shipping_damaged: "Damaged Items: If you received a damaged item, we'll provide a prepaid return label and cover all shipping costs.",
    damaged_title: "Damaged or Incorrect Items",
    damaged_intro: "If you received a damaged or incorrect item, please contact us immediately at gemsutopia@gmail.com. We'll make it right with:",
    damaged_item_1: "A full refund including original shipping costs",
    damaged_item_2: "A replacement item at no additional cost",
    damaged_item_3: "Prepaid return shipping labels",
    damaged_item_4: "Expedited processing of your replacement or refund",
    questions_title: "Questions?",
    questions_intro: "Our team is here to help make your return or exchange as smooth as possible. If you have any questions about our return policy, please don't hesitate to contact us at gemsutopia@gmail.com.",
    questions_response_time: "Response Time: We typically respond to all emails within 24 hours."
  };

  const getContent = (key: string): string => contentMap[key]?.value || defaultContent[key] || '';
  const getFieldId = (key: string): string => contentMap[key]?.id || '';
  const { EditableText } = useEditableText();

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
      <div className="text-center mb-12">
        <EditableText fieldKey="title" className="text-3xl md:text-4xl font-bold text-black mb-4" tag="h1" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
        <EditableText fieldKey="subtitle" className="text-lg text-neutral-600" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
      </div>
      
      <div className="prose prose-lg max-w-none text-neutral-700 space-y-8">
        <section>
          <EditableText fieldKey="policy_title" className="text-2xl font-bold text-black mb-4" tag="h2" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
          <EditableText fieldKey="policy_intro" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
          <EditableText fieldKey="policy_window" className="mb-4" tag="p" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
        </section>

        <section>
          <EditableText fieldKey="acceptable_title" className="text-2xl font-bold text-black mb-4" tag="h2" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
          <EditableText fieldKey="acceptable_intro" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
          <ul className="list-disc ml-6 space-y-2">
            <li><EditableText fieldKey="acceptable_item_1" className="inline" tag="span" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} /></li>
            <li><EditableText fieldKey="acceptable_item_2" className="inline" tag="span" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} /></li>
            <li><EditableText fieldKey="acceptable_item_3" className="inline" tag="span" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} /></li>
            <li><EditableText fieldKey="acceptable_item_4" className="inline" tag="span" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} /></li>
          </ul>
        </section>

        <section>
          <EditableText fieldKey="unacceptable_title" className="text-2xl font-bold text-black mb-4" tag="h2" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
          <EditableText fieldKey="unacceptable_intro" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
          <ul className="list-disc ml-6 space-y-2">
            <li><EditableText fieldKey="unacceptable_item_1" className="inline" tag="span" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} /></li>
            <li><EditableText fieldKey="unacceptable_item_2" className="inline" tag="span" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} /></li>
            <li><EditableText fieldKey="unacceptable_item_3" className="inline" tag="span" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} /></li>
            <li><EditableText fieldKey="unacceptable_item_4" className="inline" tag="span" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} /></li>
          </ul>
        </section>

        <section>
          <EditableText fieldKey="return_steps_title" className="text-2xl font-bold text-black mb-4" tag="h2" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
          <EditableText fieldKey="return_steps_intro" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
          <ol className="list-decimal ml-6 space-y-2">
            <li><EditableText fieldKey="return_step_1" className="inline" tag="span" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} /></li>
            <li><EditableText fieldKey="return_step_2" className="inline" tag="span" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} /></li>
            <li><EditableText fieldKey="return_step_3" className="inline" tag="span" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} /></li>
            <li><EditableText fieldKey="return_step_4" className="inline" tag="span" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} /></li>
            <li><EditableText fieldKey="return_step_5" className="inline" tag="span" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} /></li>
            <li><EditableText fieldKey="return_step_6" className="inline" tag="span" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} /></li>
          </ol>
        </section>

        <section>
          <EditableText fieldKey="exchange_title" className="text-2xl font-bold text-black mb-4" tag="h2" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
          <EditableText fieldKey="exchange_intro" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
          <ul className="list-disc ml-6 space-y-2">
            <li><EditableText fieldKey="exchange_item_1" className="inline" tag="span" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} /></li>
            <li><EditableText fieldKey="exchange_item_2" className="inline" tag="span" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} /></li>
            <li><EditableText fieldKey="exchange_item_3" className="inline" tag="span" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} /></li>
            <li><EditableText fieldKey="exchange_item_4" className="inline" tag="span" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} /></li>
            <li><EditableText fieldKey="exchange_item_5" className="inline" tag="span" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} /></li>
          </ul>
        </section>

        <section>
          <EditableText fieldKey="refund_title" className="text-2xl font-bold text-black mb-4" tag="h2" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
          <EditableText fieldKey="refund_intro" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
          <ul className="list-disc ml-6 space-y-2">
            <li><EditableText fieldKey="refund_item_1" className="inline" tag="span" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} /></li>
            <li><EditableText fieldKey="refund_item_2" className="inline" tag="span" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} /></li>
            <li><EditableText fieldKey="refund_item_3" className="inline" tag="span" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} /></li>
            <li><EditableText fieldKey="refund_item_4" className="inline" tag="span" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} /></li>
            <li><EditableText fieldKey="refund_item_5" className="inline" tag="span" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} /></li>
          </ul>
        </section>

        <section>
          <EditableText fieldKey="shipping_title" className="text-2xl font-bold text-black mb-4" tag="h2" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
          <EditableText fieldKey="shipping_returns" tag="p" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
          <EditableText fieldKey="shipping_exchanges" tag="p" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
          <EditableText fieldKey="shipping_damaged" tag="p" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
        </section>

        <section>
          <EditableText fieldKey="damaged_title" className="text-2xl font-bold text-black mb-4" tag="h2" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
          <EditableText fieldKey="damaged_intro" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
          <ul className="list-disc ml-6 space-y-2">
            <li><EditableText fieldKey="damaged_item_1" className="inline" tag="span" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} /></li>
            <li><EditableText fieldKey="damaged_item_2" className="inline" tag="span" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} /></li>
            <li><EditableText fieldKey="damaged_item_3" className="inline" tag="span" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} /></li>
            <li><EditableText fieldKey="damaged_item_4" className="inline" tag="span" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} /></li>
          </ul>
        </section>

        <section>
          <EditableText fieldKey="questions_title" className="text-2xl font-bold text-black mb-4" tag="h2" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
          <EditableText fieldKey="questions_intro" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
          <EditableText fieldKey="questions_response_time" tag="p" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
        </section>
      </div>
    </div>
  );
}

// Terms of Service Page Editor  
function TermsOfServicePageEditor({ pageContents, onSave, onRefresh }: AboutPageEditorProps) {
  const contentMap = pageContents.reduce((acc, item) => {
    acc[item.key] = { value: item.value, id: item.id };
    return acc;
  }, {} as Record<string, { value: string; id: string }>);

  const defaultContent: Record<string, string> = {
    title: "Terms of Service",
    last_updated: "Last updated: January 2025",
    acceptance_title: "1. Acceptance of Terms",
    acceptance_content: "By accessing and using Gemsutopia's website and services, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.",
    products_title: "2. Products and Services",
    products_paragraph_1: "Gemsutopia offers premium gemstones and jewelry pieces, many of which are hand-mined and ethically sourced from Alberta, Canada. All product descriptions, images, and specifications are provided to the best of our knowledge and ability.",
    products_paragraph_2: "We reserve the right to refuse service, terminate accounts, remove or edit content, or cancel orders in our sole discretion.",
    orders_title: "3. Orders and Payment",
    orders_paragraph_1: "By placing an order through our website, you are making an offer to purchase products subject to these terms. All orders are subject to availability and confirmation.",
    orders_paragraph_2: "Payment is required at the time of purchase. We accept major credit cards, PayPal, and other payment methods as displayed on our website. All prices are in Canadian dollars unless otherwise stated.",
    shipping_title: "4. Shipping and Delivery",
    shipping_paragraph_1: "Shipping times are estimates and may vary. We are not responsible for delays caused by shipping carriers, customs, or other factors beyond our control.",
    shipping_paragraph_2: "Risk of loss and title for items purchased from Gemsutopia pass to you upon delivery to the shipping carrier.",
    returns_title: "5. Returns and Refunds",
    returns_content: "Please refer to our Returns & Exchange policy for detailed information about returns, exchanges, and refunds. All returns must be authorized and comply with our return policy.",
    intellectual_title: "6. Intellectual Property",
    intellectual_content: "All content on this website, including text, graphics, logos, images, and software, is the property of Gemsutopia and is protected by copyright and other intellectual property laws.",
    liability_title: "7. Limitation of Liability",
    liability_content: "Gemsutopia shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, use, goodwill, or other intangible losses.",
    privacy_title: "8. Privacy",
    privacy_content: "Your privacy is important to us. Please refer to our Privacy Policy for information about how we collect, use, and protect your personal information.",
    contact_title: "9. Contact Information",
    contact_content: "If you have any questions about these Terms of Service, please contact us at gemsutopia@gmail.com.",
    changes_title: "10. Changes to Terms",
    changes_content: "We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting on the website. Your continued use of the service constitutes acceptance of the modified terms."
  };

  const getContent = (key: string): string => contentMap[key]?.value || defaultContent[key] || '';
  const getFieldId = (key: string): string => contentMap[key]?.id || '';
  const { EditableText } = useEditableText();

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
      <div className="text-center mb-12">
        <EditableText fieldKey="title" className="text-3xl md:text-4xl font-bold text-black mb-4" tag="h1" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
        <EditableText fieldKey="last_updated" className="text-lg text-neutral-600" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
      </div>
      
      <div className="prose prose-lg max-w-none text-neutral-700 space-y-8">
        <section>
          <EditableText fieldKey="acceptance_title" className="text-2xl font-bold text-black mb-4" tag="h2" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
          <EditableText fieldKey="acceptance_content" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
        </section>

        <section>
          <EditableText fieldKey="products_title" className="text-2xl font-bold text-black mb-4" tag="h2" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
          <EditableText fieldKey="products_paragraph_1" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
          <EditableText fieldKey="products_paragraph_2" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
        </section>

        <section>
          <EditableText fieldKey="orders_title" className="text-2xl font-bold text-black mb-4" tag="h2" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
          <EditableText fieldKey="orders_paragraph_1" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
          <EditableText fieldKey="orders_paragraph_2" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
        </section>

        <section>
          <EditableText fieldKey="shipping_title" className="text-2xl font-bold text-black mb-4" tag="h2" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
          <EditableText fieldKey="shipping_paragraph_1" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
          <EditableText fieldKey="shipping_paragraph_2" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
        </section>

        <section>
          <EditableText fieldKey="returns_title" className="text-2xl font-bold text-black mb-4" tag="h2" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
          <EditableText fieldKey="returns_content" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
        </section>

        <section>
          <EditableText fieldKey="intellectual_title" className="text-2xl font-bold text-black mb-4" tag="h2" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
          <EditableText fieldKey="intellectual_content" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
        </section>

        <section>
          <EditableText fieldKey="liability_title" className="text-2xl font-bold text-black mb-4" tag="h2" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
          <EditableText fieldKey="liability_content" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
        </section>

        <section>
          <EditableText fieldKey="privacy_title" className="text-2xl font-bold text-black mb-4" tag="h2" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
          <EditableText fieldKey="privacy_content" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
        </section>

        <section>
          <EditableText fieldKey="contact_title" className="text-2xl font-bold text-black mb-4" tag="h2" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
          <EditableText fieldKey="contact_content" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
        </section>

        <section>
          <EditableText fieldKey="changes_title" className="text-2xl font-bold text-black mb-4" tag="h2" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
          <EditableText fieldKey="changes_content" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
        </section>
      </div>
    </div>
  );
}

// Privacy Policy Page Editor
function PrivacyPolicyPageEditor({ pageContents, onSave, onRefresh }: AboutPageEditorProps) {
  const contentMap = pageContents.reduce((acc, item) => {
    acc[item.key] = { value: item.value, id: item.id };
    return acc;
  }, {} as Record<string, { value: string; id: string }>);

  const defaultContent: Record<string, string> = {
    title: "Privacy Policy",
    last_updated: "Last updated: January 2025",
    intro_paragraph_1: "This Privacy Policy describes how and when Gemsutopia (\"I\", \"me\", \"my\") collects, uses, and shares information when you purchase an item from Gemsutopia (Gemsutopia.ca) contact me, or otherwise use my services through this site.",
    intro_paragraph_2: "You agree that by purchasing an item from Gemsutopia or otherwise interacting with Gemsutopia, you have read, understood, and agree to be bound by all of the terms of this Privacy Policy. If you do not agree, you must leave Gemsutopia immediately.",
    intro_paragraph_3: "I may change this Privacy Policy from time to time. If I make changes, I will notify you by revising the date at the top of the page.",
    intro_paragraph_4: "This Privacy Policy does not apply to the practices of third parties that I do not own or control through Gemsutopia such as Gemrockauctions or Etsy.",
    intro_paragraph_5: "Additionally, I will make every reasonable effort to inform you when I interact with third parties with your information; however, you are solely responsible for reviewing, understanding, and agreeing to or not agreeing to any third-party privacy policies.",
    information_collect_title: "Information I Collect",
    information_collect_content: "To fulfill your order, you must provide me with certain information such as your name, e-mail address, postal address, payment information, and the details of the product that you're ordering. You may also choose to provide me with additional personal information from time to time if you contact me directly.",
    why_use_title: "Why I Need Your Information and How I Use It",
    why_use_intro: "I collect, use and share your information in several legally-permissible ways, including:",
    why_use_item_1: "As needed to provide my services, such as when I use your information to fulfill your order, to settle disputes, or to provide you with customer support;",
    why_use_item_2: "When you have provided your affirmative consent, which you may revoke at any time, such as by signing up for my mailing list or to receive notifications from me;",
    why_use_item_3: "If necessary to comply with a court order or legal obligation, such as retaining information about your purchases if required by tax law; and",
    why_use_item_4: "As necessary for my own legitimate interests, if those legitimate interests are not overridden by your rights or interests, such as (a) providing and enhancing my services;",
    sharing_title: "Information Sharing and Disclosure",
    sharing_intro: "Protecting my customers' personal information is crucially important to my business and something I take very seriously. For these reasons, I share your personal information only for very limited reasons and in limited circumstances, as follows:",
    sharing_third_party_title: "With Third-Party Service Providers.",
    sharing_third_party_content: "I engage the following trusted third parties to perform functions and provider services to my shop:\n\nI share you personal information with these third parties, but only to the extent necessary to perform these services;",
    sharing_business_title: "In the Event of a Business Transfer.",
    sharing_business_content: "If I sell or merge my business, I may disclose your information as part of that transaction, only to the extent permitted by law.",
    sharing_legal_title: "In Compliance with Laws.",
    sharing_legal_content: "I may collect, use, retain, and share your information if I have a good faith belief that doing so is reasonably necessary to: (a) respond to legal process or to government requests; (b) perform legal obligations to which I am bound by agreements; (c) prevent, investigate, and address fraud and other illegal activity, security, or technical issues; or (d) protect the rights, property, and safety of my customers, or others.",
    retention_title: "How Long I Store Your Information",
    retention_content: "I retain your personal information only for as long as necessary to provide you with my services and as otherwise described in my Privacy Policy. However, I may also be required to retain this information to comply with my legal and regulatory obligations, to resolve disputes, and to enforce or perform under my agreements. I generally keep your data for the following time period: five (5) years.",
    transfers_title: "Transfers of Personal Information Outside the EU",
    transfers_content: "I may store and process your information through third-party hosting services in the US and other jurisdictions. As a result, I may transfer your personal information to a jurisdiction with different data protection and government surveillance laws than your jurisdiction has. If I am required to transfer information about you outside of the EU, I rely on Privacy Shield as the legal basis for the transfer, as Google Cloud is Privacy Shield certified.",
    rights_title: "Your Rights",
    rights_intro: "If you reside in certain territories, including the EU, you have a number of rights in relation to your personal information. While some of these rights apply generally, certain rights apply only in certain limited cases. Your rights are as follows:",
    rights_access_title: "Right to Access.",
    rights_access_content: "You may have the right to access and receive a copy of the personal information I hold about you by contacting me using the contact information below.",
    rights_change_title: "Right to Change, Restrict, or Delete.",
    rights_change_content: "You may also have rights to change, restrict my use of, or delete your personal information. Absent exceptional circumstances (such as where I am required to store information for legal reasons) I will generally delete your personal information upon your request.",
    rights_object_title: "Right to Object.",
    rights_object_content: "You can object to (a) my processing of some of your information based on my legitimate interests and (b) receiving marketing messages from me. In such cases, I will delete your personal information unless I have compelling and legitimate grounds to continue storing and using your information or if it is needed for legal reasons.",
    rights_complain_title: "Right to Complain.",
    rights_complain_content: "If you reside in the EU and wish to raise a concern about my use of your information (and without prejudice to any other rights you may have), you have the right to do so with your local data protection authority.",
    contact_title: "How to Contact Me",
    contact_content: "You may reach me with any concerns relating to privacy at Gemsutopia@gmail.com"
  };

  const getContent = (key: string): string => contentMap[key]?.value || defaultContent[key] || '';
  const getFieldId = (key: string): string => contentMap[key]?.id || '';
  const { EditableText } = useEditableText();

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
      <div className="text-center mb-12">
        <EditableText fieldKey="title" className="text-3xl md:text-4xl font-bold text-black mb-4" tag="h1" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
        <EditableText fieldKey="last_updated" className="text-lg text-neutral-600" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
      </div>
      
      <div className="prose prose-lg max-w-none text-neutral-700 space-y-8">
        <EditableText fieldKey="intro_paragraph_1" className="text-lg mb-6" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
        <EditableText fieldKey="intro_paragraph_2" className="mb-6" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
        <EditableText fieldKey="intro_paragraph_3" className="mb-6" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
        <EditableText fieldKey="intro_paragraph_4" className="mb-6" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
        <EditableText fieldKey="intro_paragraph_5" className="mb-8" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />

        <section>
          <EditableText fieldKey="information_collect_title" className="text-2xl font-bold text-black mb-4" tag="h2" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
          <EditableText fieldKey="information_collect_content" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
        </section>

        <section>
          <EditableText fieldKey="why_use_title" className="text-2xl font-bold text-black mb-4" tag="h2" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
          <EditableText fieldKey="why_use_intro" className="mb-4" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
          <ul className="list-disc ml-6 space-y-2">
            <li><EditableText fieldKey="why_use_item_1" className="inline" tag="span" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} /></li>
            <li><EditableText fieldKey="why_use_item_2" className="inline" tag="span" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} /></li>
            <li><EditableText fieldKey="why_use_item_3" className="inline" tag="span" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} /></li>
            <li><EditableText fieldKey="why_use_item_4" className="inline" tag="span" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} /></li>
          </ul>
        </section>

        <section>
          <EditableText fieldKey="sharing_title" className="text-2xl font-bold text-black mb-4" tag="h2" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
          <EditableText fieldKey="sharing_intro" className="mb-4" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
          <ul className="list-disc ml-6 space-y-4">
            <li>
              <strong><EditableText fieldKey="sharing_third_party_title" className="inline" tag="span" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} /></strong>
              <EditableText fieldKey="sharing_third_party_content" className="inline" tag="span" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
            </li>
            <li>
              <strong><EditableText fieldKey="sharing_business_title" className="inline" tag="span" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} /></strong>
              <EditableText fieldKey="sharing_business_content" className="inline" tag="span" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
            </li>
            <li>
              <strong><EditableText fieldKey="sharing_legal_title" className="inline" tag="span" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} /></strong>
              <EditableText fieldKey="sharing_legal_content" className="inline" tag="span" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
            </li>
          </ul>
        </section>

        <section>
          <EditableText fieldKey="retention_title" className="text-2xl font-bold text-black mb-4" tag="h2" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
          <EditableText fieldKey="retention_content" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
        </section>

        <section>
          <EditableText fieldKey="transfers_title" className="text-2xl font-bold text-black mb-4" tag="h2" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
          <EditableText fieldKey="transfers_content" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
        </section>

        <section>
          <EditableText fieldKey="rights_title" className="text-2xl font-bold text-black mb-4" tag="h2" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
          <EditableText fieldKey="rights_intro" className="mb-4" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
          <ul className="list-disc ml-6 space-y-3">
            <li>
              <strong><EditableText fieldKey="rights_access_title" className="inline" tag="span" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} /></strong>
              <EditableText fieldKey="rights_access_content" className="inline" tag="span" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
            </li>
            <li>
              <strong><EditableText fieldKey="rights_change_title" className="inline" tag="span" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} /></strong>
              <EditableText fieldKey="rights_change_content" className="inline" tag="span" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
            </li>
            <li>
              <strong><EditableText fieldKey="rights_object_title" className="inline" tag="span" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} /></strong>
              <EditableText fieldKey="rights_object_content" className="inline" tag="span" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
            </li>
            <li>
              <strong><EditableText fieldKey="rights_complain_title" className="inline" tag="span" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} /></strong>
              <EditableText fieldKey="rights_complain_content" className="inline" tag="span" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
            </li>
          </ul>
        </section>

        <section>
          <EditableText fieldKey="contact_title" className="text-2xl font-bold text-black mb-4" tag="h2" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
          <EditableText fieldKey="contact_content" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
        </section>
      </div>
    </div>
  );
}

// Cookie Policy Page Editor
function CookiePolicyPageEditor({ pageContents, onSave, onRefresh }: AboutPageEditorProps) {
  const contentMap = pageContents.reduce((acc, item) => {
    acc[item.key] = { value: item.value, id: item.id };
    return acc;
  }, {} as Record<string, { value: string; id: string }>);

  const defaultContent: Record<string, string> = {
    title: "Cookie Policy",
    last_updated: "Last updated: January 2025",
    what_are_title: "What Are Cookies?",
    what_are_content: "Cookies are small text files that are stored on your device (computer, tablet, or mobile) when you visit our website. They help us provide you with a better browsing experience and allow certain features to function properly.",
    how_use_title: "How We Use Cookies",
    how_use_intro: "Gemsutopia uses cookies for the following purposes:",
    how_use_essential: "Essential Cookies: Required for basic website functionality, shopping cart, and checkout process",
    how_use_performance: "Performance Cookies: Help us understand how visitors interact with our website by collecting anonymous information",
    how_use_functional: "Functional Cookies: Remember your preferences and settings to enhance your experience",
    how_use_marketing: "Marketing Cookies: Used to deliver relevant advertisements and track campaign effectiveness",
    types_title: "Types of Cookies We Use",
    essential_subtitle: "Essential Cookies",
    essential_content: "These cookies are necessary for the website to function and cannot be switched off. They are usually set in response to actions you take, such as setting privacy preferences, logging in, or filling in forms.",
    analytics_subtitle: "Analytics Cookies",
    analytics_content: "We use analytics cookies to understand how visitors use our website. This helps us improve our website performance and user experience. All information collected is anonymous.",
    marketing_subtitle: "Marketing Cookies",
    marketing_content: "These cookies track your browsing activity to help us show you relevant advertisements. They may be set by us or third-party advertising partners.",
    managing_title: "Managing Your Cookie Preferences",
    managing_intro: "You can control and manage cookies in several ways:",
    managing_browser: "Browser Settings: Most browsers allow you to control cookies through their settings preferences",
    managing_settings: "Cookie Settings: Use our Cookie Settings page to manage your preferences",
    managing_optout: "Opt-Out: You can opt-out of certain cookies, though this may affect website functionality",
    managing_note: "Please note that disabling certain cookies may impact your browsing experience and prevent some features from working properly.",
    third_party_title: "Third-Party Cookies",
    third_party_intro: "Some cookies on our website are set by third-party services we use, such as:",
    third_party_analytics: "Google Analytics (for website analytics)",
    third_party_payment: "Payment processors (for secure transactions)",
    third_party_social: "Social media platforms (for social sharing features)",
    third_party_email: "Email marketing services (for newsletter functionality)",
    retention_title: "Cookie Retention",
    retention_intro: "Cookies remain on your device for different periods depending on their type:",
    retention_session: "Session Cookies: Deleted when you close your browser",
    retention_persistent: "Persistent Cookies: Remain for a set period or until you delete them",
    retention_essential_time: "Essential Cookies: Typically expire after 1 year",
    retention_analytics_time: "Analytics Cookies: Usually expire after 2 years",
    consent_title: "Your Consent",
    consent_content: "By continuing to use our website, you consent to our use of cookies as described in this policy. You can withdraw your consent at any time by adjusting your cookie settings or browser preferences.",
    updates_title: "Updates to This Policy",
    updates_content: "We may update this Cookie Policy from time to time to reflect changes in our practices or applicable laws. We encourage you to review this page periodically.",
    contact_title: "Contact Us",
    contact_content: "If you have any questions about our use of cookies, please contact us at gemsutopia@gmail.com."
  };

  const getContent = (key: string): string => contentMap[key]?.value || defaultContent[key] || '';
  const getFieldId = (key: string): string => contentMap[key]?.id || '';
  const { EditableText } = useEditableText();

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
      <div className="text-center mb-12">
        <EditableText fieldKey="title" className="text-3xl md:text-4xl font-bold text-black mb-4" tag="h1" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
        <EditableText fieldKey="last_updated" className="text-lg text-neutral-600" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
      </div>
      
      <div className="prose prose-lg max-w-none text-neutral-700 space-y-8">
        <section>
          <EditableText fieldKey="what_are_title" className="text-2xl font-bold text-black mb-4" tag="h2" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
          <EditableText fieldKey="what_are_content" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
        </section>

        <section>
          <EditableText fieldKey="how_use_title" className="text-2xl font-bold text-black mb-4" tag="h2" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
          <EditableText fieldKey="how_use_intro" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
          <ul className="list-disc ml-6 space-y-2">
            <li><strong><EditableText fieldKey="how_use_essential" className="inline" tag="span" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} /></strong></li>
            <li><strong><EditableText fieldKey="how_use_performance" className="inline" tag="span" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} /></strong></li>
            <li><strong><EditableText fieldKey="how_use_functional" className="inline" tag="span" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} /></strong></li>
            <li><strong><EditableText fieldKey="how_use_marketing" className="inline" tag="span" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} /></strong></li>
          </ul>
        </section>

        <section>
          <EditableText fieldKey="types_title" className="text-2xl font-bold text-black mb-4" tag="h2" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
          
          <EditableText fieldKey="essential_subtitle" className="text-lg font-semibold text-black mb-2" tag="h3" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
          <EditableText fieldKey="essential_content" className="mb-4" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />

          <EditableText fieldKey="analytics_subtitle" className="text-lg font-semibold text-black mb-2" tag="h3" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
          <EditableText fieldKey="analytics_content" className="mb-4" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />

          <EditableText fieldKey="marketing_subtitle" className="text-lg font-semibold text-black mb-2" tag="h3" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
          <EditableText fieldKey="marketing_content" className="mb-4" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
        </section>

        <section>
          <EditableText fieldKey="managing_title" className="text-2xl font-bold text-black mb-4" tag="h2" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
          <EditableText fieldKey="managing_intro" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
          <ul className="list-disc ml-6 space-y-2">
            <li><strong><EditableText fieldKey="managing_browser" className="inline" tag="span" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} /></strong></li>
            <li><strong><EditableText fieldKey="managing_settings" className="inline" tag="span" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} /></strong></li>
            <li><strong><EditableText fieldKey="managing_optout" className="inline" tag="span" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} /></strong></li>
          </ul>
          <EditableText fieldKey="managing_note" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
        </section>

        <section>
          <EditableText fieldKey="third_party_title" className="text-2xl font-bold text-black mb-4" tag="h2" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
          <EditableText fieldKey="third_party_intro" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
          <ul className="list-disc ml-6 space-y-2">
            <li><EditableText fieldKey="third_party_analytics" className="inline" tag="span" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} /></li>
            <li><EditableText fieldKey="third_party_payment" className="inline" tag="span" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} /></li>
            <li><EditableText fieldKey="third_party_social" className="inline" tag="span" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} /></li>
            <li><EditableText fieldKey="third_party_email" className="inline" tag="span" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} /></li>
          </ul>
        </section>

        <section>
          <EditableText fieldKey="retention_title" className="text-2xl font-bold text-black mb-4" tag="h2" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
          <EditableText fieldKey="retention_intro" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
          <ul className="list-disc ml-6 space-y-2">
            <li><strong><EditableText fieldKey="retention_session" className="inline" tag="span" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} /></strong></li>
            <li><strong><EditableText fieldKey="retention_persistent" className="inline" tag="span" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} /></strong></li>
            <li><strong><EditableText fieldKey="retention_essential_time" className="inline" tag="span" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} /></strong></li>
            <li><strong><EditableText fieldKey="retention_analytics_time" className="inline" tag="span" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} /></strong></li>
          </ul>
        </section>

        <section>
          <EditableText fieldKey="consent_title" className="text-2xl font-bold text-black mb-4" tag="h2" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
          <EditableText fieldKey="consent_content" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
        </section>

        <section>
          <EditableText fieldKey="updates_title" className="text-2xl font-bold text-black mb-4" tag="h2" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
          <EditableText fieldKey="updates_content" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
        </section>

        <section>
          <EditableText fieldKey="contact_title" className="text-2xl font-bold text-black mb-4" tag="h2" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
          <EditableText fieldKey="contact_content" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
        </section>
      </div>
    </div>
  );
}

// Cookie Settings Page Editor
function CookieSettingsPageEditor({ pageContents, onSave, onRefresh }: AboutPageEditorProps) {
  const contentMap = pageContents.reduce((acc, item) => {
    acc[item.key] = { value: item.value, id: item.id };
    return acc;
  }, {} as Record<string, { value: string; id: string }>);

  const defaultContent: Record<string, string> = {
    title: "Cookie Settings",
    subtitle: "Manage your cookie preferences",
    saved_message: "✅ Cookie preferences saved successfully!",
    intro_text: "We use cookies to enhance your browsing experience, provide personalized content, and analyze our traffic. You can customize your cookie preferences below. Please note that disabling certain cookies may impact your experience on our website.",
    essential_title: "Essential Cookies",
    essential_description: "These cookies are necessary for the website to function and cannot be switched off. They are usually set in response to actions made by you such as setting your privacy preferences, logging in, or filling in forms.",
    essential_status: "Always Active",
    analytics_title: "Analytics Cookies",
    analytics_description: "These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously. This helps us improve our website performance and user experience.",
    marketing_title: "Marketing Cookies",
    marketing_description: "These cookies track your browsing activity to help us show you relevant advertisements and measure the effectiveness of our marketing campaigns. They may be set by us or third-party advertising partners.",
    functional_title: "Functional Cookies",
    functional_description: "These cookies enable enhanced functionality and personalization, such as remembering your preferences and settings. They may be set by us or by third-party providers whose services we use on our pages.",
    save_button: "Save Preferences",
    accept_all_button: "Accept All",
    reject_all_button: "Reject All (except Essential)",
    footer_text: "Need more information? Visit our",
    footer_link_text: "Cookie Policy",
    footer_text_end: "for detailed information about how we use cookies."
  };

  const getContent = (key: string): string => contentMap[key]?.value || defaultContent[key] || '';
  const getFieldId = (key: string): string => contentMap[key]?.id || '';
  const { EditableText } = useEditableText();

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
      <div className="text-center mb-12">
        <EditableText fieldKey="title" className="text-3xl md:text-4xl font-bold text-black mb-4" tag="h1" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
        <EditableText fieldKey="subtitle" className="text-lg text-neutral-600" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-8 space-y-8">
        <div className="text-neutral-700">
          <EditableText fieldKey="intro_text" className="mb-6" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
        </div>

        {/* Essential Cookies */}
        <div className="border-b border-neutral-200 pb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <EditableText fieldKey="essential_title" className="text-lg font-semibold text-black mb-2" tag="h3" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
              <EditableText fieldKey="essential_description" className="text-neutral-600 text-sm" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
            </div>
            <div className="ml-6">
              <div className="flex items-center">
                <input type="checkbox" checked disabled className="w-5 h-5 text-black bg-gray-100 border-gray-300 rounded focus:ring-black" />
                <EditableText fieldKey="essential_status" className="ml-2 text-sm text-neutral-500" tag="span" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Cookies */}
        <div className="border-b border-neutral-200 pb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <EditableText fieldKey="analytics_title" className="text-lg font-semibold text-black mb-2" tag="h3" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
              <EditableText fieldKey="analytics_description" className="text-neutral-600 text-sm" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
            </div>
            <div className="ml-6">
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Marketing Cookies */}
        <div className="border-b border-neutral-200 pb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <EditableText fieldKey="marketing_title" className="text-lg font-semibold text-black mb-2" tag="h3" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
              <EditableText fieldKey="marketing_description" className="text-neutral-600 text-sm" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
            </div>
            <div className="ml-6">
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Functional Cookies */}
        <div className="pb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <EditableText fieldKey="functional_title" className="text-lg font-semibold text-black mb-2" tag="h3" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
              <EditableText fieldKey="functional_description" className="text-neutral-600 text-sm" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
            </div>
            <div className="ml-6">
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-neutral-200">
          <button className="bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-neutral-800 transition-colors">
            <EditableText fieldKey="save_button" className="inline" tag="span" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
          </button>
          <button className="bg-neutral-200 text-black px-6 py-3 rounded-lg font-semibold hover:bg-neutral-300 transition-colors">
            <EditableText fieldKey="accept_all_button" className="inline" tag="span" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
          </button>
          <button className="bg-neutral-200 text-black px-6 py-3 rounded-lg font-semibold hover:bg-neutral-300 transition-colors">
            <EditableText fieldKey="reject_all_button" className="inline" tag="span" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
          </button>
        </div>

        <div className="text-sm text-neutral-600 pt-4 border-t border-neutral-200">
          <p>
            <strong><EditableText fieldKey="footer_text" className="inline" tag="span" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} /></strong>{' '}
            <a href="/cookie-policy" className="text-black underline hover:no-underline">
              <EditableText fieldKey="footer_link_text" className="inline" tag="span" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
            </a>{' '}
            <EditableText fieldKey="footer_text_end" className="inline" tag="span" getContent={getContent} getFieldId={getFieldId} onSave={onSave} onRefresh={onRefresh} />
          </p>
        </div>
      </div>
    </div>
  );
}

const AVAILABLE_PAGES = [
  { id: 'about', name: 'About', description: 'About Gemsutopia page content' },
  { id: 'support', name: 'Support', description: 'Customer support page content' },
  { id: 'refund-policy', name: 'Refund Policy', description: 'Refund policy page content' },
  { id: 'returns-exchange', name: 'Returns & Exchange', description: 'Returns and exchange policy content' },
  { id: 'terms-of-service', name: 'Terms of Service', description: 'Terms of service page content' },
  { id: 'privacy-policy', name: 'Privacy Policy', description: 'Privacy policy page content' },
  { id: 'cookie-policy', name: 'Cookie Policy', description: 'Cookie policy page content' },
  { id: 'cookie-settings', name: 'Cookie Settings', description: 'Cookie settings page content' }
];

export default function Pages() {
  const { mode } = useMode();
  const [selectedPage, setSelectedPage] = useState<string>('');
  const [pageContents, setPageContents] = useState<PageContent[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingField, setEditingField] = useState<string>('');
  const [editContent, setEditContent] = useState<string>('');
  const [newFieldName, setNewFieldName] = useState<string>('');
  const [showAddField, setShowAddField] = useState<boolean>(false);

  const fetchPageContent = async (pageId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/pages/${pageId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('admin-token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setPageContents(data);
      }
    } catch (error) {
      console.error('Error fetching page content:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveField = async (fieldId: string, content: string) => {
    try {
      const response = await fetch(`/api/admin/pages/content/${fieldId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin-token')}`
        },
        body: JSON.stringify({ value: content })
      });
      
      if (response.ok) {
        await fetchPageContent(selectedPage);
        setEditingField('');
        setEditContent('');
      }
    } catch (error) {
      console.error('Error saving field:', error);
    }
  };

  const addField = async () => {
    if (!newFieldName.trim()) return;
    
    try {
      const response = await fetch('/api/admin/pages/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin-token')}`
        },
        body: JSON.stringify({
          section: selectedPage,
          key: newFieldName,
          value: ''
        })
      });
      
      if (response.ok) {
        await fetchPageContent(selectedPage);
        setNewFieldName('');
        setShowAddField(false);
      }
    } catch (error) {
      console.error('Error adding field:', error);
    }
  };

  const deleteField = async (fieldId: string) => {
    if (!confirm('Are you sure you want to delete this field?')) return;
    
    try {
      const response = await fetch(`/api/admin/pages/content/${fieldId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('admin-token')}` }
      });
      
      if (response.ok) {
        await fetchPageContent(selectedPage);
      }
    } catch (error) {
      console.error('Error deleting field:', error);
    }
  };

  useEffect(() => {
    if (selectedPage) {
      fetchPageContent(selectedPage);
    }
  }, [selectedPage]);

  return (
    <div className="space-y-6">
      <div className="bg-black rounded-2xl p-6 border border-white/20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Page Management ✨</h1>
            <p className="text-slate-400">Edit content for static pages</p>
          </div>
        </div>
      </div>

      {/* Page Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {AVAILABLE_PAGES.map((page) => (
          <button
            key={page.id}
            onClick={() => setSelectedPage(page.id)}
            className={`p-6 rounded-2xl border text-left transition-all ${
              selectedPage === page.id
                ? mode === 'dev' 
                  ? 'bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20 text-white'
                  : 'bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20 text-white'
                : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:border-white/20'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <FileText className="h-5 w-5" />
              <h3 className="font-semibold">{page.name}</h3>
            </div>
            <p className="text-sm opacity-70">{page.description}</p>
          </button>
        ))}
      </div>

      {/* Page Content Editor */}
      {selectedPage && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">
              {AVAILABLE_PAGES.find(p => p.id === selectedPage)?.name} Content
            </h2>
            <button
              onClick={() => setShowAddField(true)}
              className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors ${
                mode === 'dev'
                  ? 'bg-orange-600 hover:bg-orange-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              <Plus className="h-4 w-4" />
              Add Field
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
            </div>
          ) : (
            selectedPage === 'about' ? (
              <AboutPageEditor 
                pageContents={pageContents} 
                onSave={saveField}
                onRefresh={() => fetchPageContent(selectedPage)}
              />
            ) : selectedPage === 'support' ? (
              <SupportPageEditor 
                pageContents={pageContents} 
                onSave={saveField}
                onRefresh={() => fetchPageContent(selectedPage)}
              />
            ) : selectedPage === 'refund-policy' ? (
              <RefundPolicyPageEditor 
                pageContents={pageContents} 
                onSave={saveField}
                onRefresh={() => fetchPageContent(selectedPage)}
              />
            ) : selectedPage === 'returns-exchange' ? (
              <ReturnsExchangePageEditor 
                pageContents={pageContents} 
                onSave={saveField}
                onRefresh={() => fetchPageContent(selectedPage)}
              />
            ) : selectedPage === 'terms-of-service' ? (
              <TermsOfServicePageEditor 
                pageContents={pageContents} 
                onSave={saveField}
                onRefresh={() => fetchPageContent(selectedPage)}
              />
            ) : selectedPage === 'privacy-policy' ? (
              <PrivacyPolicyPageEditor 
                pageContents={pageContents} 
                onSave={saveField}
                onRefresh={() => fetchPageContent(selectedPage)}
              />
            ) : selectedPage === 'cookie-policy' ? (
              <CookiePolicyPageEditor 
                pageContents={pageContents} 
                onSave={saveField}
                onRefresh={() => fetchPageContent(selectedPage)}
              />
            ) : selectedPage === 'cookie-settings' ? (
              <CookieSettingsPageEditor 
                pageContents={pageContents} 
                onSave={saveField}
                onRefresh={() => fetchPageContent(selectedPage)}
              />
            ) : (
              <div className="space-y-4">
                {pageContents.map((field) => (
                  <div key={field.id} className="bg-white/5 border border-white/10 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-white">{field.key}</h3>
                      <div className="flex items-center gap-2">
                        {editingField === field.id ? (
                          <>
                            <button
                              onClick={() => saveField(field.id, editContent)}
                              className="p-1 text-emerald-400 hover:text-emerald-300"
                            >
                              <Save className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingField('');
                                setEditContent('');
                              }}
                              className="p-1 text-slate-400 hover:text-slate-300"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setEditingField(field.id);
                                setEditContent(field.value);
                              }}
                              className="p-1 text-blue-400 hover:text-blue-300"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => deleteField(field.id)}
                              className="p-1 text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {editingField === field.id ? (
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full h-32 px-3 py-2 bg-black border border-white/20 rounded text-white resize-vertical"
                        placeholder="Enter content..."
                      />
                    ) : (
                      <div className="text-slate-300 whitespace-pre-wrap">
                        {field.value || <span className="text-slate-500 italic">No content</span>}
                      </div>
                    )}
                  </div>
                ))}

                {/* Add Field Form */}
                {showAddField && (
                  <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <input
                        type="text"
                        value={newFieldName}
                        onChange={(e) => setNewFieldName(e.target.value)}
                        placeholder="Field name (e.g., 'title', 'intro_paragraph')"
                        className="flex-1 px-3 py-2 bg-black border border-white/20 rounded text-white"
                      />
                      <button
                        onClick={addField}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-colors"
                      >
                        Add
                      </button>
                      <button
                        onClick={() => {
                          setShowAddField(false);
                          setNewFieldName('');
                        }}
                        className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
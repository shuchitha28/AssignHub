import { useState, useEffect, useRef, useMemo } from "react";
import {
  Save,
  Send,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link,
  Image as ImageIcon,
  AlertTriangle,
  FileText,
  MousePointer2,
  Zap,
  BarChart3,
  ShieldCheck,
  Edit3,
  Undo2,
  Redo2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  NotebookPen,
  MessageSquareWarning
} from "lucide-react";
import toast from "react-hot-toast";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { saveSubmission, updateSubmission } from "../../api/assignment.api";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { openPDF } from "../../utils/file";

export default function Notepad() {
  const location = useLocation();
  const assignment = location.state?.assignment;
  const submission = location.state?.submission;
  const editAssignment = submission || null;

  const [title, setTitle] = useState(
    editAssignment?.title || assignment?.title || ""
  );
  const [content, setContent] = useState(
    editAssignment?.content || ""
  );
  const [currentSubmissionId, setCurrentSubmissionId] = useState<string | null>(
    submission?._id || null
  );
  const [showPasteAlert, setShowPasteAlert] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [typedChars, setTypedChars] = useState(editAssignment?.typedChars || 0);
  const [pastedChars, setPastedChars] = useState(editAssignment?.pastedChars || 0);
  const [wordCount, setWordCount] = useState(editAssignment?.wordCount || 0);
  const [wpm, setWpm] = useState(editAssignment?.wpm || 0);

   const assignmentInfo =
    assignment ||
    editAssignment?.assignment ||
    null;
  const [tick, setTick] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setTick(Date.now()), 10000); // Check every 10s
    return () => clearInterval(timer);
  }, []);

  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  // Auto-save logic
  useEffect(() => {
    if (isReadOnly || !title.trim() || !content.trim()) return;

    const timeout = setTimeout(() => {
      setAutoSaveStatus("saving");
      saveDraftMutation.mutate(undefined, {
        onSuccess: () => setAutoSaveStatus("saved"),
        onError: () => setAutoSaveStatus("error")
      });
    }, 3000); // Save after 3 seconds of inactivity

    return () => clearTimeout(timeout);
  }, [content, title]);

  const isDeadlinePassed = useMemo(() => {
    if (!assignmentInfo?.deadline) return false;
    return new Date(assignmentInfo.deadline).getTime() < tick;
  }, [assignmentInfo?.deadline, tick]);

  const isReadOnly = editAssignment?.status === "submitted" || editAssignment?.status === "reviewed" || isDeadlinePassed;

  const editorRef = useRef<HTMLDivElement>(null);

  // Initialize editor content if editing
  useEffect(() => {
    if (editAssignment && editorRef.current) {
      editorRef.current.innerHTML = editAssignment.content;
      setContent(editAssignment.content);
    }
  }, [editAssignment]);


  // Calculate Stats
  useEffect(() => {
    const text = editorRef.current?.innerText || content;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    setWordCount(words);

    if (startTime && typedChars > 0) {
      const minutes = (Date.now() - startTime) / 60000;
      if (minutes > 0) {
        const wordsFromChars = typedChars / 5;
        setWpm(Math.round(wordsFromChars / minutes));
      }
    }
  }, [content, startTime, typedChars]);

  const [activeStyles, setActiveStyles] = useState({
    bold: false,
    italic: false,
    underline: false,
    insertUnorderedList: false,
    insertOrderedList: false,
    justifyLeft: false,
    justifyCenter: false,
    justifyRight: false,
    justifyFull: false,
  });

  const checkActiveStyles = () => {
    setActiveStyles({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
      insertUnorderedList: document.queryCommandState("insertUnorderedList"),
      insertOrderedList: document.queryCommandState("insertOrderedList"),
      justifyLeft: document.queryCommandState("justifyLeft"),
      justifyCenter: document.queryCommandState("justifyCenter"),
      justifyRight: document.queryCommandState("justifyRight"),
      justifyFull: document.queryCommandState("justifyFull"),
    });
  };

  useEffect(() => {
    const handleSelectionChange = () => {
      checkActiveStyles();
    };
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => document.removeEventListener("selectionchange", handleSelectionChange);
  }, []);

  const { typedPercentage, pastedPercentage } = useMemo(() => {
    if (!editorRef.current) return { typedPercentage: 100, pastedPercentage: 0 };

    const totalText = editorRef.current.innerText || "";
    const totalChars = totalText.length;

    if (totalChars === 0) return { typedPercentage: 100, pastedPercentage: 0 };

    // Find all pasted content spans
    const pastedSpans = editorRef.current.querySelectorAll(".pasted-content");
    let totalPasted = 0;
    pastedSpans.forEach((span: any) => {
      totalPasted += span.innerText.length;
    });

    const actualPasted = Math.min(totalPasted, totalChars);
    const actualTyped = totalChars - actualPasted;

    const pastedPercent = Math.round((actualPasted / totalChars) * 100);
    const typedPercent = 100 - pastedPercent;

    // Side effect: update raw character states to match the DOM
    // We do this in an effect usually, but for immediate UI sync:
    if (typedChars === 0 && pastedChars === 0 && totalChars > 0) {
      setTypedChars(actualTyped);
      setPastedChars(actualPasted);
    }

    return { typedPercentage: typedPercent, pastedPercentage: pastedPercent };
  }, [content, editorRef.current]); // Also depend on ref to catch mount

  const integrityScore = useMemo(() => {
    if (pastedPercentage <= 10) return { label: "High", color: "text-green-500" };
    if (pastedPercentage <= 30) return { label: "Medium", color: "text-yellow-500" };
    return { label: "Low", color: "text-red-500" };
  }, [pastedPercentage]);

  const applyStyle = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    checkActiveStyles();
  };

  const handleLink = () => {
    const url = prompt("Enter the link URL:");
    if (url) applyStyle("createLink", url);
  };

  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        applyStyle("insertImage", dataUrl);
        toast.success(`"${file.name}" inserted into your draft!`);
      };
      reader.readAsDataURL(file);
    }
  };

  const insertImage = () => {
    imageInputRef.current?.click();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!startTime) setStartTime(Date.now());

    // Logic to prevent typed text from being trapped inside a pasted-content span
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        let node = range.startContainer;

        // Find if we are inside a .pasted-content span
        let pastedSpan = null;
        let current: any = node;
        while (current && current !== editorRef.current) {
          if (current.nodeType === 1 && current.classList.contains("pasted-content")) {
            pastedSpan = current;
            break;
          }
          current = current.parentNode;
        }

        if (pastedSpan) {
          e.preventDefault();
          
          if (!range.collapsed) {
            range.deleteContents();
          }

          const sel = window.getSelection();
          if (!sel || sel.rangeCount === 0) return;
          const currRange = sel.getRangeAt(0);

          let pSpan = null;
          let curr: any = currRange.startContainer;
          while (curr && curr !== editorRef.current) {
            if (curr.nodeType === 1 && curr.classList.contains("pasted-content")) {
              pSpan = curr;
              break;
            }
            curr = curr.parentNode;
          }

          const char = e.key;

          if (pSpan) {
            const splitRange = document.createRange();
            splitRange.setStart(currRange.startContainer, currRange.startOffset);
            splitRange.setEndAfter(pSpan);
            
            const extracted = splitRange.extractContents(); 
            
            const charNode = document.createTextNode(char);
            pSpan.after(charNode);
            
            if (charNode.parentNode) {
              charNode.parentNode.insertBefore(extracted, charNode.nextSibling);
            }
            
            const newRange = document.createRange();
            newRange.setStart(charNode, 1);
            newRange.collapse(true);
            sel.removeAllRanges();
            sel.addRange(newRange);
          } else {
            const textNode = document.createTextNode(char);
            currRange.insertNode(textNode);
            currRange.setStart(textNode, 1);
            currRange.collapse(true);
            sel.removeAllRanges();
            sel.addRange(currRange);
          }

          handleInput();
        }
      }
      setTypedChars((prev: number) => prev + 1);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();

    // Check for images in clipboard
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            applyStyle("insertImage", dataUrl);
          };
          reader.readAsDataURL(file);
          return;
        }
      }
    }

    const pastedText = e.clipboardData.getData("text");

    // Highlight pasted text visually in the editor using <mark> which execCommand preserves better
    const markElement = document.createElement("mark");
    markElement.className = "pasted-content bg-primary/10 border-b-2 border-dashed border-primary transition-all";
    markElement.style.backgroundColor = "rgba(236, 72, 153, 0.08)";
    markElement.style.borderBottom = "1.5px dashed #ec4899";
    markElement.style.color = "inherit";
    markElement.innerText = pastedText;

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(markElement);
      // Insert a visible space node after the mark 
      const spaceNode = document.createTextNode("\u00A0");
      markElement.after(spaceNode);

      range.setStart(spaceNode, 1);
      range.setEnd(spaceNode, 1);
      selection.removeAllRanges();
      selection.addRange(range);
    }

    setPastedChars((prev: number) => prev + pastedText.length);
    setShowPasteAlert(true);

    // Force set content update
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
  };

  /* ─── API mutations ─── */
  const saveDraftMutation = useMutation({
    mutationFn: () => {
      if (isDeadlinePassed) throw new Error("Deadline has passed");
      const payload: any = {
        title,
        content: editorRef.current?.innerHTML || content,
        wordCount,
        wpm,
        typedPercentage,
        pastedPercentage,
        typedChars,
        pastedChars,
        status: editAssignment?.status === "revision_requested" ? "revision_requested" : "draft",
      };

      // If we don't have a submission ID yet but we have an assignment template ID
      if (!currentSubmissionId && assignment?._id) {
        payload.assignment = assignment._id;
      }

      return currentSubmissionId
        ? updateSubmission(currentSubmissionId, payload)
        : saveSubmission(payload);
    },
    onSuccess: (res: any) => {
      toast.success(currentSubmissionId ? "Draft updated!" : "Draft saved!");
      // If it's a new submission, store the ID so further saves update it
      if (!currentSubmissionId && res.data?._id) {
        setCurrentSubmissionId(res.data._id);
      }
    },
    onError: () => toast.error("Failed to save draft"),
  });

  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const submitMutation = useMutation({
    mutationFn: () => {
      if (isDeadlinePassed) throw new Error("Deadline has passed");
      const payload: any = {
        title,
        content: editorRef.current?.innerHTML || content,
        wordCount,
        wpm,
        typedPercentage,
        pastedPercentage,
        typedChars,
        pastedChars,
        status: "submitted",
      };

      if (!currentSubmissionId && assignment?._id) {
        payload.assignment = assignment._id;
      }

      return currentSubmissionId
        ? updateSubmission(currentSubmissionId, payload)
        : saveSubmission(payload);
    },
    onSuccess: (res: any) => {
      toast.success(currentSubmissionId ? "Assignment updated!" : "Assignment submitted!");
      setShowSubmitModal(false);
      if (!currentSubmissionId && res.data?._id) {
        setCurrentSubmissionId(res.data._id);
      }
    },
    onError: () => toast.error("Failed to submit assignment"),
  });

  const handleSave = () => {
    if (isDeadlinePassed) return toast.error("Deadline has passed. Cannot save draft.");
    if (!title.trim()) return toast.error("Please enter a title");
    saveDraftMutation.mutate();
  };

  const handleSubmit = () => {
    if (isDeadlinePassed) return toast.error("Deadline has passed. Cannot submit assignment.");
    if (!title.trim()) return toast.error("Please enter a title");
    if (!content.trim()) return toast.error("Please write some content");
    setShowSubmitModal(true);
  };

  return (
    <div className="min-h-screen bg-theme -m-6 p-6 font-sans relative">
      {/* Header Banner */}
      <div className="p-8 text-white rounded-3xl bg-gradient-to-r from-primary to-secondary shadow-lg shadow-primary/20 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Edit3 className="w-8 h-8" />
            Assignment Editor
          </h1>
          <p className="mt-2 opacity-90">
            Create, edit, and monitor your assignment writing with real-time integrity analytics.
          </p>
        </div>

        <div className="flex gap-4">
          {!isReadOnly && (
            <>
              <button
                onClick={handleSave}
                disabled={saveDraftMutation.isPending}
                className="flex items-center gap-2 px-6 py-2.5 bg-white/20 backdrop-blur-md text-white font-semibold rounded-full border border-white/30 hover:bg-white/30 transition-all disabled:opacity-50"
              >
                <Save size={18} /> {saveDraftMutation.isPending ? "Saving..." : "Save Draft"}
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitMutation.isPending}
                className="flex items-center gap-2 px-8 py-2.5 bg-white text-primary font-bold rounded-full shadow-lg hover:bg-gray-50 transition-all disabled:opacity-50"
              >
                <Send size={18} /> {submitMutation.isPending ? "Submitting..." : "Submit Now"}
              </button>
            </>
          )}
          {isReadOnly && (
            <div className="px-6 py-2.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20 flex items-center gap-2 font-bold uppercase tracking-widest text-xs">
              <ShieldCheck size={16} /> Read Only
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Editor Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Teacher Feedback Banner (revision_requested) */}
          {editAssignment?.status === "revision_requested" && editAssignment?.feedback && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-[2rem] border border-violet-200 dark:border-violet-800 overflow-hidden shadow-sm"
            >
              <div className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white">
                <MessageSquareWarning size={20} />
                <h2 className="font-black uppercase tracking-widest text-xs">Teacher Feedback — Revision Required</h2>
              </div>
              <div className="bg-violet-50 dark:bg-violet-950/30 px-6 py-5">
                <p className="text-violet-800 dark:text-violet-300 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                  {editAssignment.feedback}
                </p>
              </div>
            </motion.div>
          )}

          {/* Assignment Instructions / PDF */}
          {(assignmentInfo?.description || assignmentInfo?.pdfUrl) && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-900 rounded-[2rem] p-6 border border-gray-100 dark:border-gray-800 shadow-sm"
            >
              <div className={`flex items-center justify-between ${assignmentInfo.description ? 'mb-4' : ''}`}>
                <div className="flex items-center gap-2 text-primary">
                  <NotebookPen size={20} />
                  <h2 className="font-bold uppercase tracking-widest text-xs">Assignment Details</h2>
                </div>
                {assignmentInfo.pdfUrl && (
                  <button
                    onClick={() => openPDF(assignmentInfo.pdfUrl)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary font-bold rounded-xl hover:bg-primary hover:text-white transition-all text-xs"
                  >
                    <FileText size={14} /> View Reference PDF
                  </button>
                )}
              </div>
              {assignmentInfo.description && (
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed whitespace-pre-wrap">
                  {assignmentInfo.description}
                </p>
              )}
            </motion.div>
          )}

          {/* Title Input */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-2 shadow-sm border border-gray-100 dark:border-gray-800">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isReadOnly}
              className="w-full px-6 py-3 text-xl font-bold bg-transparent outline-none dark:text-white disabled:opacity-70"
              placeholder="Enter assignment title..."
            />
          </div>

          {/* Main Notepad */}
          <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col min-h-[600px]">
            {/* Toolbar */}
            <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-50 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
              <input
                type="file"
                ref={imageInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />

              <div className="flex items-center gap-1">
                <button
                  onClick={() => applyStyle("undo")}
                  className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg text-gray-400 hover:text-primary transition-all"
                  title="Undo (Ctrl+Z)"
                >
                  <Undo2 size={18} />
                </button>
                <button
                  onClick={() => applyStyle("redo")}
                  className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg text-gray-400 hover:text-primary transition-all"
                  title="Redo (Ctrl+Y)"
                >
                  <Redo2 size={18} />
                </button>
              </div>

              <div className="w-[1px] h-6 bg-gray-200 dark:bg-gray-700 mx-2" />
              <button
                onClick={() => applyStyle("bold")}
                className={`p-2 rounded-lg transition-all ${activeStyles.bold ? "bg-primary text-white shadow-md" : "hover:bg-white dark:hover:bg-gray-700 text-gray-500 hover:text-primary"}`}
              >
                <Bold size={18} />
              </button>
              <button
                onClick={() => applyStyle("italic")}
                className={`p-2 rounded-lg transition-all ${activeStyles.italic ? "bg-primary text-white shadow-md" : "hover:bg-white dark:hover:bg-gray-700 text-gray-500 hover:text-primary"}`}
              >
                <Italic size={18} />
              </button>
              <button
                onClick={() => applyStyle("underline")}
                className={`p-2 rounded-lg transition-all ${activeStyles.underline ? "bg-primary text-white shadow-md" : "hover:bg-white dark:hover:bg-gray-700 text-gray-500 hover:text-primary"}`}
              >
                <Underline size={18} />
              </button>

              <div className="w-[1px] h-6 bg-gray-200 dark:bg-gray-700 mx-2" />

              <button
                onClick={() => applyStyle("insertUnorderedList")}
                className={`p-2 rounded-lg transition-all ${activeStyles.insertUnorderedList ? "bg-primary text-white shadow-md" : "hover:bg-white dark:hover:bg-gray-700 text-gray-500 hover:text-primary"}`}
              >
                <List size={18} />
              </button>
              <button
                onClick={() => applyStyle("insertOrderedList")}
                className={`p-2 rounded-lg transition-all ${activeStyles.insertOrderedList ? "bg-primary text-white shadow-md" : "hover:bg-white dark:hover:bg-gray-700 text-gray-500 hover:text-primary"}`}
              >
                <ListOrdered size={18} />
              </button>

              <div className="w-[1px] h-6 bg-gray-200 dark:bg-gray-700 mx-2" />

              <div className="flex items-center gap-2">
                <select
                  onChange={(e) => applyStyle("fontName", e.target.value)}
                  defaultValue="Arial"
                  className="bg-transparent border-none outline-none text-xs font-bold text-gray-500 hover:text-primary cursor-pointer max-w-[100px]"
                >
                  <option value="Arial">Arial</option>
                  <option value="Verdana">Verdana</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Courier New">Courier New</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Trebuchet MS">Trebuchet MS</option>
                </select>

                <select
                  onChange={(e) => applyStyle("fontSize", e.target.value)}
                  defaultValue="3"
                  className="bg-transparent border-none outline-none text-xs font-bold text-gray-500 hover:text-primary cursor-pointer"
                >
                  <option value="1">Small</option>
                  <option value="3">Normal</option>
                  <option value="5">Large</option>
                  <option value="7">Huge</option>
                </select>
              </div>

              <div className="w-[1px] h-6 bg-gray-200 dark:bg-gray-700 mx-2" />

              <div className="flex items-center gap-1">
                <button
                  onClick={() => applyStyle("justifyLeft")}
                  className={`p-2 rounded-lg transition-all ${activeStyles.justifyLeft ? "bg-primary text-white shadow-md" : "hover:bg-white dark:hover:bg-gray-700 text-gray-500 hover:text-primary"}`}
                  title="Align Left"
                >
                  <AlignLeft size={18} />
                </button>
                <button
                  onClick={() => applyStyle("justifyCenter")}
                  className={`p-2 rounded-lg transition-all ${activeStyles.justifyCenter ? "bg-primary text-white shadow-md" : "hover:bg-white dark:hover:bg-gray-700 text-gray-500 hover:text-primary"}`}
                  title="Align Center"
                >
                  <AlignCenter size={18} />
                </button>
                <button
                  onClick={() => applyStyle("justifyRight")}
                  className={`p-2 rounded-lg transition-all ${activeStyles.justifyRight ? "bg-primary text-white shadow-md" : "hover:bg-white dark:hover:bg-gray-700 text-gray-500 hover:text-primary"}`}
                  title="Align Right"
                >
                  <AlignRight size={18} />
                </button>
                <button
                  onClick={() => applyStyle("justifyFull")}
                  className={`p-2 rounded-lg transition-all ${activeStyles.justifyFull ? "bg-primary text-white shadow-md" : "hover:bg-white dark:hover:bg-gray-700 text-gray-500 hover:text-primary"}`}
                  title="Justify"
                >
                  <AlignJustify size={18} />
                </button>
              </div>

              <div className="w-[1px] h-6 bg-gray-200 dark:bg-gray-700 mx-2" />

              <button onClick={handleLink} className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg text-gray-500 hover:text-primary transition-all disabled:opacity-50" disabled={isReadOnly}><Link size={18} /></button>
              <button onClick={insertImage} className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg text-gray-500 hover:text-primary transition-all disabled:opacity-50" disabled={isReadOnly}><ImageIcon size={18} /></button>
              
              <div className="ml-auto pr-4 flex items-center gap-2">
                <AnimatePresence mode="wait">
                  {autoSaveStatus === "saving" && (
                    <motion.div 
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="text-[9px] font-black uppercase tracking-widest text-primary flex items-center gap-1.5"
                    >
                      <div className="w-1 h-1 bg-primary rounded-full animate-ping" />
                      Saving...
                    </motion.div>
                  )}
                  {autoSaveStatus === "saved" && (
                    <motion.div 
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="text-[9px] font-black uppercase tracking-widest text-green-500 flex items-center gap-1.5"
                    >
                      <CheckCircle2 size={10} />
                      Draft Saved
                    </motion.div>
                  )}
                  {autoSaveStatus === "error" && (
                    <motion.div 
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="text-[9px] font-black uppercase tracking-widest text-red-500 flex items-center gap-1.5"
                    >
                      <AlertTriangle size={10} />
                      Save Failed
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {isReadOnly && (
              <div className="bg-amber-50 dark:bg-amber-900/10 border-b border-amber-100 dark:border-amber-900/30 px-6 py-3 flex items-center justify-center gap-2 text-amber-600 dark:text-amber-400 text-sm font-bold uppercase tracking-widest">
                <AlertTriangle size={16} />
                {isDeadlinePassed
                  ? "The deadline for this assignment has passed. Submission is no longer allowed."
                  : `This assignment has been ${editAssignment?.status} and cannot be edited.`
                }
              </div>
            )}

            {/* Content Area */}
            <div
              ref={editorRef}
              contentEditable={!isReadOnly}
              onInput={handleInput}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              className={`flex-1 p-8 outline-none text-gray-700 dark:text-gray-300 leading-relaxed text-lg whitespace-pre-wrap min-h-[500px] notepad-editor ${isReadOnly ? "opacity-80 bg-gray-50 dark:bg-gray-800/20" : ""}`}
              style={{ caretColor: 'rgb(var(--primary))' }}
            />
          </div>
        </div>

        {/* Analytics Sidebar */}
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-primary to-secondary p-4 rounded-2xl shadow-lg shadow-primary/20 flex items-center gap-3 text-white">
            <BarChart3 size={20} />
            <h2 className="text-sm font-bold uppercase tracking-widest">Real-Time Analytics</h2>
          </div>

          {/* Typed % Card */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Typed %</span>
              <Zap size={16} className="text-primary" />
            </div>
            <div className="text-3xl font-bold text-gray-800 dark:text-white mb-2">{typedPercentage}%</div>
            <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${typedPercentage}%` }}
              />
            </div>
          </div>

          {/* Pasted % Card */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">Pasted %</span>
              <MousePointer2 size={16} className="text-secondary" />
            </div>
            <div className="text-3xl font-bold text-gray-800 dark:text-white mb-2">{pastedPercentage}%</div>
            <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-secondary rounded-full transition-all duration-500"
                style={{ width: `${pastedPercentage}%` }}
              />
            </div>
          </div>

          {/* Word Count Card */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 border-l-4 border-l-primary">
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Word Count</span>
              <FileText size={16} className="text-primary" />
            </div>
            <div className="text-3xl font-bold text-gray-800 dark:text-white mb-1">{wordCount.toLocaleString()}</div>
            <p className="text-xs text-gray-400">Goal: 2,500 words</p>
          </div>

          {/* Typing Speed Card */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 border-l-4 border-l-secondary">
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">Typing Speed</span>
              <Zap size={16} className="text-secondary" />
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <div className="text-3xl font-bold text-gray-800 dark:text-white">{wpm}</div>
              <span className="text-sm font-bold text-gray-400">WPM</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-bold text-green-500">
              <Zap size={10} /> {wpm > 40 ? `${Math.round(((wpm - 40) / 40) * 100)}% faster than avg` : "Keep typing!"}
            </div>
          </div>

          {/* Integrity Score */}
          <div className="bg-primary/5 dark:bg-primary/10 p-8 rounded-[2rem] border border-primary/10 dark:border-primary/20 text-center space-y-3">
            <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center mx-auto shadow-sm">
              <ShieldCheck className="text-primary" size={24} />
            </div>
            <h3 className={`font-bold ${integrityScore.color}`}>
              Integrity Score: {integrityScore.label}
            </h3>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed px-4">
              {integrityScore.label === "High"
                ? "Authentic typing patterns detected. No suspicious paste activity found."
                : integrityScore.label === "Medium"
                  ? "Some pasted content detected. Consider writing more original content."
                  : "High paste activity detected. Writing integrity may be compromised."}
            </p>
          </div>
        </div>
      </div>

      {/* Paste Alert Overlay */}
      {showPasteAlert && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-primary/20 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-gray-900 p-8 rounded-[3rem] shadow-2xl border border-primary/20 max-w-md w-full text-center space-y-6 animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="text-primary" size={40} />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-gray-800 dark:text-white">Paste Detected!</h3>
              <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                We've noticed you pasted some content. For the best evaluation, please ensure your work reflects your own writing process.
              </p>
            </div>
            <div className="bg-primary/5 p-4 rounded-2xl text-xs font-bold text-primary uppercase tracking-widest">
              Writing Integrity is being Monitored
            </div>
            <button
              onClick={() => setShowPasteAlert(false)}
              className="w-full py-4 bg-primary text-white font-bold rounded-2xl hover:opacity-90 transition-all shadow-lg shadow-primary/30"
            >
              I Understand
            </button>
          </div>
        </div>
      )}
      {/* Submission Confirmation Modal */}
      <AnimatePresence>
        {showSubmitModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSubmitModal(false)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 max-w-lg w-full shadow-2xl border border-gray-100 dark:border-gray-800"
            >
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Ready to Submit?</h3>
              <p className="text-gray-500 mb-8 text-sm font-medium">
                You are about to finalize your submission for <span className="font-bold text-primary">{title}</span>. Once submitted, you cannot edit this draft.
              </p>

              <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-3xl mb-8 border border-gray-100 dark:border-gray-700">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Words</p>
                    <p className="text-lg font-bold text-gray-800 dark:text-white">{wordCount}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Integrity Score</p>
                    <p className={`text-lg font-bold ${integrityScore.color}`}>{integrityScore.label}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setShowSubmitModal(false)}
                  className="flex-1 py-4 bg-gray-50 dark:bg-gray-800 text-gray-500 font-bold rounded-2xl hover:bg-gray-100 transition-all"
                >
                  Go Back
                </button>
                <button
                  onClick={() => submitMutation.mutate()}
                  disabled={submitMutation.isPending}
                  className="flex-1 py-4 bg-primary text-white font-bold rounded-2xl hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                >
                  {submitMutation.isPending ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>Submit Final <CheckCircle2 size={18} /></>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

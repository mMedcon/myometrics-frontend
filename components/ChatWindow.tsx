import {BotMessageSquare, Minus, SendHorizontal, Square, ExternalLink} from "lucide-react";
import {useEffect, useRef, useState} from "react";
import ReactMarkdown from "react-markdown";

type Message = {
    id: number;
    message: string;
    reply: string | null;
}

const ChatWindow = () => {
    let [open, setOpen] = useState(false);
    let [maximized, setMaximized] = useState(false);
    let [input, setInput] = useState("");
    let [messages, setMessages] = useState<Message[]>([]);
    let [showClinicalButtons, setShowClinicalButtons] = useState(false);
    const win = useRef<HTMLDivElement>(null);

    // Load messages from localStorage only on the client side
    useEffect(() => {
        // Check if window is defined (we're in the browser)
        if (typeof window !== 'undefined') {
            const storedMessages = localStorage.getItem("message");
            if (storedMessages) {
                try {
                    const parsedMessages = JSON.parse(storedMessages);
                    setMessages(Array.from(parsedMessages));
                } catch (e) {
                    console.error("Failed to parse stored messages:", e);
                    // If parsing fails, use empty array
                    setMessages([]);
                }
            }
        }
    }, []);

    useEffect(() => {
        if (open && win.current) {
            win.current.scrollTop = win.current.scrollHeight;
        }
    }, [open, messages]);

    async function sendPrompt(message: Message): Promise<void> {
        const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-goog-api-key": "AIzaSyDGw09XjT6c3D-kMm8tY6W2uiPXnMJHDBw"
                },
                body: JSON.stringify({
                    "contents": [
                        {
                            "parts": [
                                {
                                    "text": message.message,
                                }
                            ]
                        }
                    ]
                }),
            }
        );
        const data = await response.json();
        const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

        setMessages(prev => {
            const updated: Message[] = prev.map((m: Message) =>
                m.id === message.id ? { ...m, reply } : m
            );
            localStorage.setItem("message", JSON.stringify(updated));
            return updated;
        });
    }

    async function SendMessage(message: string): Promise<void> {
        if (!message.trim()) return;
        setMessages((prev: Message[]) => {
            let updated = [...prev, {
                message,
                id: messages.length,
                reply: "",
            }];
            localStorage.setItem("message", JSON.stringify(updated));
            return updated;
        });
        setInput("");
        setShowClinicalButtons(false);
        await sendPrompt({ message, id: messages.length, reply: "" });
    }
    
    function handleClinicalTrialsClick() {
        // Redirect to clinical trials external URL
        window.open('https://mmedcon-finance.vercel.app/', '_blank');
        setShowClinicalButtons(false);
        setInput("");
    }
    
    function handleRadialClick() {
        // TODO: should be redirected to view the actual data
        SendMessage("I want to learn about radial");
    }

    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Enter") {
                if (input.trim() !== "") {
                    if (input.toLowerCase().includes("clinical trials")) {
                        setShowClinicalButtons(true);
                    } else {
                        SendMessage(input);
                    }
                }
            }
        }

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [input]);
    return (
        <>
            <div
                className="w-1/4 fixed min-w-90 h-150 right-10 top-50 chat-container flex-col rounded-lg border-2"
                style={{
                    backgroundColor: 'var(--card-background)',
                    borderColor: 'var(--border)',
                    display: open ? 'block' : 'none',
                    width: maximized ? 'calc(100% - 20px)' : '',
                    height: maximized ? '100vh' : '',
                    top: maximized ? '0' : '',
                    right: maximized ? '0' : '',
                }}
            >
                <div
                    className="rounded-t-lg p-3 text-xl flex"
                    style={{ backgroundColor: 'var(--primary)' }}
                >
                    <h1 className="w-4/5">Ask AI</h1>
                    <div className="flex flex-row items-center justify-around absolute right-3">
                        <button onClick={() => setOpen(false)} className="mr-4"><Minus /></button>
                        <button onClick={() => setMaximized(!maximized)}><Square /></button>
                    </div>
                </div>

                <div className="p-3 flex flex-col overflow-y-scroll" id="lol" style={{height: 'calc(100% - 105px)'}} ref={win}>
                    { (messages.map((message: Message, index:number )  => {
                        return (
                        <>
                            <div key={index} className="mb-3 px-4 py-2 rounded-lg text-right border-2 w-fit"
                                 style={{backgroundColor: 'var(--primary)', borderColor: 'var(--border)', alignSelf: 'end'}}>
                                {message.message as string}
                            </div>
                            <div key={index+1} className="mb-3 px-4 py-2 rounded-lg text-left border-2 w-fit"
                                 style={{backgroundColor: 'var(--sci-cyan)', borderColor: 'var(--border)', alignSelf: 'start'}}>
                                <ReactMarkdown>{message.reply as string}</ReactMarkdown>
                            </div>
                        </>
                        )
                    }))}
                </div>

                <div
                    className="rounded-b-lg p-3 text-xl flex-row items-center justify-center absolute bottom-0 w-full border-2"
                    style={{ backgroundColor: 'var(--primary)', borderColor: 'var(--border)' }}
                >
                    <input
                        value={input}
                        onChange={(e) => {
                            const newValue = e.target.value;
                            setInput(newValue);
                            setShowClinicalButtons(newValue.toLowerCase().includes("clinical trials"));
                        }}
                        placeholder="Ask.."
                        className="w-10/11"
                    />

                    {showClinicalButtons && (
                        <div className="absolute top-[-60px] left-0 right-0 flex justify-center gap-4 p-2 bg-opacity-90" style={{ backgroundColor: 'var(--card-background)' }}>
                            <button 
                                className="px-3 py-1 rounded-md text-sm font-medium flex items-center gap-1" 
                                style={{ backgroundColor: 'var(--primary)', borderColor: 'var(--border)', border: '1px solid' }}
                                onClick={handleClinicalTrialsClick}
                                title="Open Clinical Trials in new tab"
                            >
                                Clinical Trials <ExternalLink size={14} />
                            </button>
                            <button 
                                className="px-3 py-1 rounded-md text-sm font-medium" 
                                style={{ backgroundColor: 'var(--primary)', borderColor: 'var(--border)', border: '1px solid' }}
                                onClick={handleRadialClick}
                            >
                                Radial
                            </button>
                        </div>
                    )}

                    <button
                        className="absolute right-3"
                        onClick={() => SendMessage(input)}
                    >
                        <SendHorizontal />
                    </button>
                </div>
            </div>

            <div>
                <button
                    className="btn-primary fixed bottom-10 right-10"
                    onClick={() => setOpen(!open)}
                    style={{ display: open ? 'none' : "block" }}
                >
                    <BotMessageSquare />
                </button>
            </div>
        </>
    );
};

export default ChatWindow;